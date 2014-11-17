var markdown = require('markdown').markdown

module.exports = function(tree,key){

	tree.filter(/\.md$/,function(next,done){
		var props = this[key]
		require('fs').readFile(props.path,{encoding:'utf8'},function(err,contents){
			if(err){
				props.error = err;
				return next();
			}
			props.setProp('contents',contents);
			try{
				var md = markdown.toHTML(contents);
				props.setProp('rendered',md);
			}catch(err){
				props.error = err;
			}
			next();
		})
	});

	return 'markdown';

}