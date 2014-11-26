var chokidar = require('chokidar');

module.exports = function(fns,cb){

	var calledBack = false;

	function done(err,stop){
		if(!calledBack){
			calledBack = true;
			cb(err,stop);
		}
	}

	function onErr(err){
		fns.onError(err);
		done(err);
	}

	var watcher = chokidar.watch(fns.filename, {ignored: /[\/\\]\./, persistent: true})
		.on('error',onErr)
		.on('ready',function(){
			console.log('ready to watch')
			done(null,function(){watcher.close();});
		})
		.on('all',function(evt,filepath){
			console.log(evt,filepath)
			switch(evt){
				case 'change':
					fns.onChanged(filepath);
				break;
				case 'unlink':
				case 'unlinkDir':
					fns.onRemoved(filepath);
				break;
				default:
				break;
			}
		});
}