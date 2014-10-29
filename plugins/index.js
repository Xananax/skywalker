var plugins = {};

require('fs').readdirSync(__dirname + '/').forEach(function(file) {
	if(file !== 'index.js') {
		plugins[file] = require(file);
	}
});

module.exports = plugins;