var	minimatch = require('minimatch');
var define = require('./define');
var propsKey = require('./file').propertiesPropertyKey;

var Data = function(files){
	if(!(this instanceof Data)){return new Data(files);}
	define(this,'_f',files[propsKey].children);
	define(this,'limit',-1);
	this[propsKey] = {children:this._f};
};
Data.operators = {
	GREATER_THAN : '>'
,	LOWER_THAN: '<'
,	GREATER_OR_EQUAL: '>='
,	LOWER_OR_EQUAL: '<='
,	EQUAL: '=='
,	EQUAL_STRICT: '==='
,	MATCHES: '#'
,	EXTENSION: '.'
,	PATH: '/'
,	MIMETYPE: '@'
,	ISDIR: 'D'
,	ISFILE:'F'
}
Data.funcs = {
	GREATER_THAN: function GREATER_THAN(prop,val){
		return function(){
			var result = this[propsKey][prop] && (this[propsKey][prop] > val);
			return result;
		}
	}
,	LOWER_THAN: function LOWER_THAN(prop,val){
		return function(){
			var result = this[propsKey][prop] && (this[propsKey][prop] < val);
			return result;
		}
	}
,	GREATER_OR_EQUAL: function GREATER_OR_EQUAL(prop,val){
		return function(){
			var result = this[propsKey][prop] && (this[propsKey][prop] >= val);
			return result;
		}
	}
,	LOWER_OR_EQUAL: function LOWER_OR_EQUAL(prop,val){
		return function(){
			var result = this[propsKey][prop] && (this[propsKey][prop] >= val);
			return result;
		}
	}
,	EQUAL: function EQUAL(prop,val){
		return function(){
			var result = this[propsKey][prop] && (this[propsKey][prop] == val);
			return result;
		}
	}
,	EQUAL_STRICT: function EQUAL_STRICT(prop,val){
		return function(){
			var result = this[propsKey][prop] && (this[propsKey][prop] === val);
			return result;
		}
	}
,	MATCHES: function MATCHES(prop,val){
		if(!(val instanceof RegExp)){val = new RegExp(val,'gi');}
		return function(){
			var result = this[propsKey][prop] && val.test(this[propsKey][prop]);
			return result;
		}
	}
,	EXTENSION:function EXTENSION(val){
		if(!(val instanceof RegExp)){val = new RegExp(val+'$','i');}
		return function(){
			var result = val.test(this[propsKey].extension);
			return result;
		}
	}
,	PATH:function PATH(val){
		if(!(val instanceof RegExp)){val = minimatch.makeRe(val);}
		return function(){
			var result = val.test(this[propsKey].path);
			return result;
		}
	}
,	MIMETYPE:function MIMETYPE(val){
		if(!(val instanceof RegExp)){val = new RegExp(val,'gi');}
		return function(){
			var result = (this[propsKey].mime.test(val));
			return result;
		}
	}
,	ISDIR:function ISDIR(){
		return function(){
			var result = (this[propsKey].isDirectory);
			return result;
		}
	}
,	ISFILE:function ISFILE(){
		return function(){
			var result = (!this[propsKey].isDirectory);
			return result;
		}
	}
}
var DataMethods = {

	walk:function(func,base,results,limit){
		if(!base){base = this._f;}
		if(!results){results = [];}
		if(typeof limit == 'undefined' || limit === null){limit = this.limit;}
		if(limit==0){return;}
		var i = 0
		,	f
		,	res
		;
		for(i=0;f=base[i++];){
			res = func.call(f);
			if(res!==true){continue;}
			results.push(f)
			if(f._.isDirectory){
				this.walk(func,f._.children,results,limit);
			}
		};
		var d = {};
		d[propsKey] = {children:results};
		d = new Data(d);
		d.limit = 1;
		return d;
	}

,	_select:function(prop,operator,val,limit,base){
		if(prop==Data.operators.EXTENSION){
			base = limit;
			limit = val;
			val = operator;
			operator = Data.operators.EXTENSION;
			prop = null;
		}
		if(prop==Data.operators.PATH){
			base = limit;
			limit = val;
			val = operator;
			operator = Data.operators.PATH;
			prop = null;
		}
		else if(prop==Data.operators.MIMETYPE){
			base = limit;
			limit = val;
			val = operator;
			operator = Data.operators.MIMETYPE;
			prop = null;
		}
		else if(prop==Data.operators.ISDIR){
			base = val;
			limit = operator;
			operator = Data.operators.ISDIR;
		}
		else if(prop==Data.operators.ISFILE){
			base = val;
			limit = operator;
			operator = Data.operators.ISFILE;
		}
		if(!base){base = this._f;}
		var func;
		switch(operator){
			case Data.operators.GREATER_THAN: func = Data.funcs.GREATER_THAN(prop,val); break;
			case Data.operators.LOWER_THAN: func = Data.funcs.LOWER_THAN(prop,val); break;
			case Data.operators.GREATER_OR_EQUAL: func = Data.funcs.GREATER_OR_EQUAL(prop,val); break;
			case Data.operators.LOWER_OR_EQUAL: func = Data.funcs.LOWER_OR_EQUAL(prop,val); break;
			case Data.operators.EQUAL: func = Data.funcs.EQUAL(prop,val); break;
			case Data.operators.EQUAL_STRICT: func = Data.funcs.EQUAL_STRICT(prop,val); break;
			case Data.operators.MATCHES: func = Data.funcs.MATCHES(prop,val); break;
			case Data.operators.EXTENSION: func = Data.funcs.EXTENSION(val); break;
			case Data.operators.PATH: func = Data.funcs.PATH(val); break;
			case Data.operators.MIMETYPE: func = Data.funcs.MIMETYPE(val); break;
			case Data.operators.ISDIR: func = Data.funcs.ISDIR(); break;
			case Data.operators.ISFILE: func = Data.funcs.ISFILE(); break;
			default: 
				throw new Error(operator+' is not a valid skywalker select operator for operation '+prop+' '+operator+' '+val);
				break;
		}
		if(!func){return new Data({_:{children:[]}});}
		return this.walk(func,base);
	}

};

for(var n in DataMethods){
	define(Data.prototype,n,DataMethods[n]);
};

module.exports = Data;