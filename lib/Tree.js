var fs = require('fs')
,	EventEmitter = require('events').EventEmitter
,	extend = require('node.extend')
,	util = require('util')
,	minimatch = require('minimatch')
,	inspect = function(){
		var args = Array.prototype.slice.call(arguments);
		if(!args.length){args = ['----------------'];}
		var options = {showHidden:false,depth:4,colors:true};
		for(var i = 0; i<args.length;i++){
			args[i] = util.inspect(args[i],options);
		}
		console.log.apply(console,args);
	}
,	File = require('./file')
,	safeKey = File.safeKey
,	events = require('./consts').events
,	types = require('./consts').types
,	Data = require('./data')
,	path = require('path')
;


var Tree = function(filename){
	if(!(this instanceof Tree)){return new Tree(filename);}
	EventEmitter.call(this);
	this.filename = filename.replace(/^\/$/,'');
	this.filters = [];
	this._emitError = false;
	this._throwError = false;
	this._depth = -1;
	this._tree;
	this._selectors = [];
	this._plugins_set = [];
	this._watch = false;
	this._watcherStop = false;
} 
util.inherits(Tree, EventEmitter);
Tree.prototype.file = function(filename){
	if(filename){this.filename = filename; return this;}
	return this.filename;
}
Tree.prototype.limit = function(depth){
	if(!arguments.length){return this._depth;}
	this._depth = depth;
	return this;
}
Tree.prototype.start = function Start(callback){
	var that = this;
	this.process(this.filename,function(err,file){
		if(err){
			if(that._emitError){that.emit(events.ERROR,err);}
			if(callback){callback(err);}
			if(that._throwError){throw err;}
			return;
		};
		if(that._selectors.length){
			file = that.processSelectors(file);
		}
		that._tree = file;
		if(that._watch){
			that._watcherStop = that._watch(that.watcherReady(),function(w){
				that._watcher = w;
				that.emit(events.DONE,file);
				if(callback){callback(null,file);}
			});
		}else{
			that.emit(events.DONE,file);
			if(callback){callback(null,file);}
		}
	},this._depth);
	return this;
}
Tree.prototype.emitErrors = function EmitError(doEmit){
	if(arguments.length){this._emitError = doEmit;return this;}
	return this._emitError;
}
Tree.prototype.throwErrors = function ThrowError(doThrow){
	if(arguments.length){this._throwError = doThrow; return this;}
	return this._throwError;
}
Tree.prototype.process = function Process(filename,cb,depth,skip){
	var file = new File(filename);
	var that = this;
	var _path = file[safeKey].path;
	fs.lstat(_path,function(err,stats){
		if(err){return cb(err);}
		file[safeKey].setProps(stats);
		if(stats.isDirectory()){
			file[safeKey].setAsDirectory();
			that.emit(events.DIRECTORY,file);
			return that.processDir(file,cb,depth,skip);
		}
		file[safeKey].setAsFile();
		that.emit(events.FILE,file);
		return that.processFile(file,cb);
	})
	return this;
}
Tree.prototype.processDir = function ProcessDir(file,cb,depth,skip){
	var _path = file[safeKey].path;
	var that = this;
	fs.readdir(_path,function(err,files){
		if(err){return cb(err);}
		var i = 0
		,	l = files.length
		,	total = l
		,	f
		,	size = 0
		,	interrupt = false
		,	error = function(err){
				interrupt = true;
				total = 0;
				cb(err);
			}
		,	done = function Done(err,child){
				if(interrupt){return;}
				if(err){return error(err);}
				if(child && !skip){
					size+=child[safeKey].size;
					try{
						file[safeKey].add(child[safeKey].filename,child);
						child[safeKey].parents.push(file[safeKey].path);
					}catch(e){return error(err);}
				}
				total--;
				if(total<=0){
					file[safeKey].size = size;
					that.processFilters(file,cb);
				}
				return that;
			}
		;

		if(depth==0){total=0;return done();}
		if(!total){return done();}
		for(i;i<total;i++){
			f = files[i];
			that.process(_path+'/'+f,done,depth-1)
		}
	})
	return this;
}
Tree.prototype.processFile = function ProcessFile(file,cb){
	this.processFilters(file,cb);
	return this;
}
Tree.prototype.filter = function Filter(regex,func,type){
	if(regex && !(regex instanceof RegExp)){
		regex = minimatch.makeRe(regex);
	}
	type = 
		(type && type.match(/f|file/i))? types.FILE :
		(type && type.match(/d|dir|directory|folder/i))? types.DIRECTORY :
		(type && type.match(/m|mime|mimetype|type|mime-type/i))? types.MIMETYPE :
		false
	var that = this
	,	fn = function Filter(file,next,done){
			var _path,_type,m;
			if(type==types.MIMETYPE){
				_path = file[safeKey].mime.mimeType;
				m = _path.match(regex);
				if(m){
					return func.call(file,next,done,m);
				}
			}
			else if(!regex){
				return func.call(file,next,done,m);
			}
			else{
				_path = file[safeKey].path;
				_type = file[safeKey].type;
				m = _path.match(regex);
				if((!type || type == _type) && m){
					return func.call(file,next,done,m);
				}
			}
			next();
		}
	;
	this.filters.push(fn);
	return this;
}
Tree.prototype.processFilters = function ProcessFilters(file,callback){
	var i = 0
	,	filters = this.filters
	,	l = filters.length
	,	that = this
	,	isDone = false
	,	interrupt = false
	,	error = function(err){
			interrupt = true;
			isDone = true;
			callback(err);
		}
	,	done = function Done(err,replace){
			if(interrupt){return;}
			if(err){error(err);}
			if(arguments.length>1){file = replace;}
			if(!isDone){
				isDone = true;
				callback(null,file);
			}
		}
	,	next = function Next(){
			if(interrupt){return;}
			if(i==l){
				return done();
			}
			filters[i++].call(that,file,next,done);
		}
	;
	next();
	return this;
}
Tree.prototype.directoryFilter = function DirectoryFilter(regex,func){
	return this.filter(regex,func,types.DIRECTORY)
}
Tree.prototype.fileFilter = function FileFilter(regex,func){
	return this.filter(regex,func,types.FILE)
}
Tree.prototype.mimeFilter = function MimeFilter(mime,func){
	regex = (mime instanceof RegExp) ? mime : new RegExp(mime.replace('/','\/'),'i');
	return this.filter(regex,func,types.MIMETYPE);
}
Tree.prototype.extensionFilter = function ExtensionFilter(ext,func,type){
	ext = new RegExp('\.('+ext.split(' ').join('|')+')$','i');
	type = type || types.FILE;
	return this.filter(ext,func,type)
}
Tree.events = events;
Tree.prototype.plugin = function(plugin){
	var pluginName = plugin(this,File.propertiesPropertyKey);
	if(pluginName){
		this._plugins_set.push(pluginName);
	}
	return this;
}
Tree.prototype.pluginIsRegistered = function(pluginName){
	return this._plugins_set.indexOf(pluginName) >= 0;
}
Tree.propertiesPropertyKey = function(key){
	if(key){File.propertiesPropertyKey = key; return Tree;}
	return File.propertiesPropertyKey;
}
Tree.prototype.ignore = function(regex,type){
	this.filter(regex,function(next,done){
		done(null,false);
	},type);
	return this;
}
Tree.prototype.ignoreDotFiles = function(){
	return this.ignore(/(^|\/)\..*?$/g);
}
Tree.prototype.ignoreFiles = function(regex){
	this.ignore(regex,types.FILE);
}
Tree.prototype.ignoreDirectories = function(regex){
	this.ignore(regex,types.DIRECTORY);
}
Tree.prototype.selectors = function(args){
	args = args.split(/\s+?&+\s+?/g);
	for(var i=0,l=args.length;i<l;i++){
		this.selector(args[i]);
	}
	return this;
}
Tree.prototype.selector = function(args){
	if(arguments.length==3){
		this._addSelector(arguments[0],arguments[1],arguments[2]);
	}else if(arguments.length==1){
		args = args.split(/\s+/g);
		if(args.length>=1){
			this._addSelector(args[0],args[1],args[2]);
		}
	}
	return this;
}
Tree.prototype.processSelectors = function(file){
	var l = this._selectors.length;
	if(!l){return file;}
	var d
	,	i = 0
	,	props
	;
	while(i<l){
		props = this._selectors[i++];
		d = new Data(file);
		file = d._select(props[0],props[1],props[2]);
	}
	return file;
}
Tree.prototype._addSelector = function(prop,operator,val){
	this._selectors.push([prop,operator,val]);
	return this;
}
Tree.prototype.watcherReady = require('./watchReady')
Tree.prototype.watch = function(watcher,callback){
	if(typeof watcher == 'string'){
		watcher = require('../watchers/'+watcher);
	}
	this._watch = watcher;
	this.start(callback);
	return this;
}
Tree.prototype.unwatch = function(){
	if(this._watch){
		this._watch = false;
		if(this._watcherStop){
			this._watcherStop();
			this._watcherStop = false;
		}
	}
}
Tree.prototype.createFilterProcessor = function(){
	var that = this;
	return function(path,cb){
		var file = that.get(path);
		if(file){
			that.processFilters(file,function(err,file){
				if(err){return cb(err);}
				cb(null,file);
			});
		}
	}
}
Tree.prototype.get = function(key){
	key = path.relative(this.filename,key);
	if(key=='/' || !key){return this._tree;}
	return key.split('/').reduce(function(a,b){return a && a[b];},this._tree);
}
Tree.db = Data;
Tree.mime = require('./mime').mime;
Tree.Events = events;
module.exports = Tree;
