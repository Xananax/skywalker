var define = module.exports = function(obj,name,val,writable){
	Object.defineProperty(obj,name,{
		value:val
	,	writable:writable || false
	,	enumerable:false
	});
	return define;
}
;