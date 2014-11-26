var watch = require('watch');

module.exports = function(fns,cb){

	var calledBack = false;

	function done(err,stop){
		if(!calledBack){
			calledBack = true;
			cb(err,stop);
		}
	}

	watch.createMonitor(fns.filename,function(watcher){

		watcher.on('created',function(filepath,stat){
			fns.onCreated(filepath);
		});

		watcher.on('changed',function(filepath,curr,prev){
			fns.onChanged(filepath);
		});

		watcher.on('removed',function(filepath,stat){
			fns.onRemoved(filepath);
		});

		done(null,function(){watcher.stop();});

	})
}