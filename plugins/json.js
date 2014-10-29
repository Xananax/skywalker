module.exports = function(tree,key){

	tree.filter(/\.json$/,function(next,done){
		var props = this[key]
		require('fs').readFile(props.path,{encoding:'utf8'},function(err,contents){
			if(err){
				props.error = err;
				return next();
			}
			props.setProp('contents',contents);
			try{
				var json = JSON.parse(contents);
				props.setProp('data',json);
			}catch(err){
				props.error = err;
			}
			next();
		})
	});

}