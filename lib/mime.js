var mime = require('mime')
,	define = require('./define')
;

var Mime = function(file){
	if(!(this instanceof Mime)){return new Mime(file);}
	define
		(this,'type','',true)
		(this,'subType','',true)
	;
	if(file){this.file(file);}
}
Mime.prototype.toString = function(){
	return this.mimeType;
}
Mime.prototype.file = function(file){
	var mimeType = mime.lookup(file);
	return this.set(mimeType);
}
Mime.prototype.set = function(mimeType){
	var m = mimeType.split('/');
	this.type = m.shift();
	this.subType = m.shift();
	this.mimeType = mimeType;
	return this;
}

Mime.mime = mime;
module.exports = Mime;