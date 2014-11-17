var sizeOf = require('image-size');

module.exports = function(tree,key){

	var getDimensions = function(next,done){
			var props = this[key];
			sizeOf(props.path, function(err,d) {
				if(err){
					props.error = err;
					next();
				}
				var imageProps = {
					width:d.width
				,	height:d.height
				,	imageMode:d.width>d.height?'landscape':d.height>d.width?'portrait':'square'
				,	ratio:parseFloat((Math.max(d.width,d.height)/Math.min(d.width,d.height)).toFixed(2))
				}
				props.setProps(imageProps);
				next();
			});
		}
	;

	tree.extensionFilter('jpg jpeg tiff tif png bmp gif',getDimensions);

	return 'images';
}