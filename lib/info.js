var path = require('path')
,	define = require('./define')
,	Mime = require('./mime')
,	types = require('./consts').types
;

var InfoMethods = {
	add: function(name,obj){
		var file = this._file;
		this.children.push(obj);
		file[name] = obj;
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
		for(var n in props){
			this.setProp(n,props[n]);
		}
	}
,	setProp:function(name,prop){
		this[name] = prop;
	}
};

var Info = function(filename,file){
	if(!(this instanceof Info)){return new Info(filename,file);}
	this.path = filename;
	this.dirname = path.dirname(filename);
	this.filename = path.basename(filename);
	this.extension = path.extname(this.filename).replace('.','').toLowerCase();
	this.name = path.basename(this.filename,'.'+this.extension);
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