var filters = {
	images: /\.(bmp|jpe?g|gif|png|tiff?|svg|webp|psd)$/i
,	text:/\.(txt|text|conf|def|list|log|in|md|markdown|css|stylus|less|sass|scss|html?|ejs|jade|haml|js|coffee|typescript|xml|json|csv|ini)$/i
,	plaintext:/\.(txt|text|conf|def|list|log|in)$/i
,	markdown:/\.(md|markdown)$/i
,	styles:/\.(css|stylus|less|sass)$/i
,	templates:/\.(html?|ejs|jade|haml)$/i
,	script:/\.(js|coffee|typescript)$/i
,	data:/\.(xml|json|csv|ini)$/i
}

module.exports = filters