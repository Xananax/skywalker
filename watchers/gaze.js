var Gaze = require('gaze').Gaze;

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

	var opts = {
		cwd: fns.filename
	}

	var gaze = new Gaze('**/*',opts);

	gaze.on('error',onErr);

	gaze.on('ready', function(watcher){

		//watcher.watched(function(err,files){console.log(files);})

		this.on('changed',function(filepath){
			fns.onChanged(filepath);
		});

		this.on('added',function(filepath){
			fns.onCreated(filepath);
		});

		this.on('deleted',function(filepath){
			fns.onRemoved(filepath);
		});

		this.on('renamed',function(newpath,oldPath){
			console.log('renamed')
			fns.onRenamed(newpath,oldPath);
		});

		this.on('error',onErr);

		done(null,function(){gaze.stop();});
	});
}