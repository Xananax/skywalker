var fs = require('fs')
,	events = require('./consts').events
,	path = require('path')
,	Tree = require('./Tree')
;

module.exports = function(){

	var that = this;

	function onErr(err){
		if(that._emitError){that.emit(events.ERROR,err);}
		if(that._throwError){throw err;}
	}

	return {

		filename:this.filename.replace(/\/$/,'')
	,	tree:that
	,	onError: function onError(err){
			onErr(err);
		}

	,	onChanged: function onChanged(filepath){
			var file = that.get(filepath);
			if(file){
				that.emit(events.CHANGED,file);
			}
		}

	,	onCreated: function onCreated(filepath){
			var parent = that.get(path.dirname(filepath));
			if(!parent){return;}
			var file = that.get(filepath);
			if(!file){
				that.process(filepath,function(err,files){
					if(err){
						return onErr(err);
					};
					if(that._selectors.length){
						files = that.processSelectors(files);
					}
					if(!files){return;}
					parent._.add(files);
					that.emit(events.CREATED,files);
				})
			}
		}

	,	onRemoved: function onRemoved(filepath){
			var file = that.get(filepath);
			if(file){
				var parent = that.get(path.dirname(filepath));
				if(parent){
					var filename = path.basename(filepath);
					parent._.remove(filename);
				}
				that.emit(events.REMOVED,file);
			}
		}

	,	onRenamed: function onRenamed(newpath,oldPath){
			if(oldPath){
				var file = that.get(oldPath);
				if(file){
					file._.setChildrenPaths(newpath);
					var parent = that.get(path.dirname(filepath));
					if(parent){
						var oldFilename = path.basename(oldPath);
						parent._.remove(oldFilename)
						parent._.add(file);
					}
					that.emit(events.RENAMED,file);
				}
			}
		}
	};

}