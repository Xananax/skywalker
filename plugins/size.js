var filesize = require('filesize');

module.exports = function(tree,key){

	tree.filter(null,function(next,done){
		var isDir = this[key].isDirectory
		var size = this[key].size;
		this[key].setProp('humanSize',filesize(size));
		next();
	});

	return 'size';

}