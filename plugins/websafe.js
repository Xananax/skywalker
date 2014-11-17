module.exports = function(tree,key){

	tree.filter(null,function(next,done){
		var name = this[key].name;
		var safename = name.replace(/^\//,'')
			.replace(/\//g,'_')
			.replace(/\s{2,}/g,' ')
			.replace(/\s-|-\s|\s-\s/g,'-')
			.replace(/-+/g,'-')
			.replace(/\.|,/g,'-')
			.replace(/\s/g,'_')
			.toLowerCase()
		;
		this[key].setProp('safename',safename);
		next();
	});

	return 'websafe';

}