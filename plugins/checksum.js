var checksum = require('checksum');

module.exports = function(tree,key){

	tree.fileFilter(null,function(next,done){
		var name = this[key].filename;
		var safename = checksum(name);
		this[key].setProp('checksum',safename);
		next();
	});

	return 'checksum';

}