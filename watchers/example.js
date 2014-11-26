var Tree = require('../lib/Tree');
var dir = require('path').resolve(__dirname+'/../');

var t = Tree(dir)
	.on('changed',function(file){
		console.log(file._.path);
	})
	.watch('gaze',function(err,files){
		if(err){throw err;}
	})
;