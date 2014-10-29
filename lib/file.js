var Info = require('./info')
,	define = require('./define')
;

FileToString = function(){
	return this[File.safeKey].toString();
}

var File = function(filename){
	if(!(this instanceof File)){return new File(filename);}
	var info = (new Info(filename,this));
	define
		(this,File.propertiesPropertyKey,info)
		(this,File.safeKey,info)
		(this,'toString',FileToString);
}
File.safeKey = '__________'
File.propertiesPropertyKey = '_';

module.exports = File;