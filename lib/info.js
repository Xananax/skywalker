var path = require('path')
,	define = require('./define')
,	Mime = require('./mime')
,	types = require('./consts').types
;

function setPaths(filename,obj){
	obj.path = filename;
	obj.dirname = path.dirname(filename);
	obj.filename = path.basename(filename);
	obj.extension = path.extname(obj.filename).replace('.','').toLowerCase();
	obj.name = path.basename(obj.filename,'.'+obj.extension);
}

var InfoMethods = {
	add: function(name,obj){
		var file = this._file;
		this.children.push(obj);
		file[name] = obj;
	}
,	remove: function(name){
		for(var i = 0, l = this.children.length; i<l; i++){
			if(this.children[i]._.filename == name){
				this.children.splice(i,1);
				break;
			}
		}
		if(this._file[name]){delete this._file[name];}
	}
,	toString: function(){
		return (this.rendered || this.contents || this.content || this.path)+'';
	}
,	setAsDirectory:function(){
		this.type = types.DIRECTORY;
		this.isDirectory = true;
		this.mime.set('directory/inode');
		return this;
	}
,	setAsFile:function(){
		this.type = types.FILE;
		this.isDirectory = false;
		this.mime.file(this.path);
		return this;
	}
,	setProps:function(props){
		var prop;
		for(var n in props){
			if(!props.hasOwnProperty(n)){continue;}
			prop = props[n];
			if(prop instanceof Date){
				prop = prop.getTime() / 1000;
			}
			this.setProp(n,prop);
		}
	}
,	setProp:function(name,prop){
		this[name] = prop;
	}
,	setPaths:function(filename){
		setPaths(filename,this);
	}
,	setChildrenPaths:function(filename){
		var oldFileName = this.path;
		setPaths(filename,this);
		if(this.isDirectory && this.children.length){
			this.children.forEach(function(child){
				var childFilename = filename+'/'+child._.filename;
				var props = child._;
				props.setChildrenPaths(childFilename);
				if(props.parents && props.parents.length){
					for(var i=0, l = props.parents.length;i<l;i++){
						if(props.parents[i] == oldFileName){
							props.parents[i] = filename;
							break;
						}
					}
				}
			});
		}
	}
};

var Info = function(filename,file){
	if(!(this instanceof Info)){return new Info(filename,file);}
	setPaths(filename,this);
	this.contents = '';
	this.type = '';
	this.isDirectory = false;
	this.mime = new Mime();
	for(var n in InfoMethods){
		define(this,n,InfoMethods[n])
	}
	define
		(this,'_file',file)
		(this,'children',[])
		(this,'parents',[])
	;
}

module.exports = Info;