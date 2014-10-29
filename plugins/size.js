var filesize = require('filesize');

module.exports = function(tree,key){

	tree.filter(null,function(next,done){
		var isDir = this[key].isDirectory
		var stats = this[key].stats;
		var size = stats.size;
		this[key].setProp('size',filesize(size));
		next();
	});

}