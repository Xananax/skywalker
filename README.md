# Skywalker

Walks a directory or a file and optionally applies transformations on the tree's members.
There are other modules that do the same, I didn't like them, rolled my own.

_Can't believe skywalker was not already in use on npmjs._

-----
## Install
```bash
	npm install skywalker
```

----
## Features

 - Easy to use
 - Callbacks or evented style
 - Directory sizes
 - Supports limited depth, regex filtering, glob matching, mime-type filtering, extension filtering
 - Easy as hell to write plugins for

-----
## Usage

```js
	var Tree = require('skywalker');

	Tree('~/some_dir')
		.ignoreDotFiles()
		.ignore(/(^|\/)_.*?$/g) //ignores files that begin with "_"
		.filter(/something/g,function(next,done){
			console.log('runs for each file or directory that match "something"');
			next()
		})
		.filter(/(^|\/)_.*?$/g,function(next,done){
			console.log('rejects all files or directories that begin with "_"',this._.path);
			done(null,false);
		})
		.extensionFilter('json',function(next,done){
			console.log('runs for each file that has a json extension');
			var file = this;
			require('fs').readFile(this._.path,{encoding:'utf8'},function(err,contents){
				if(err){
					file._.error = err;
					return next();
				}
				file._.contents = contents;
				try{
					file.data = JSON.parse(contents);
				}catch(err){
					file._.error = err;
				}
				next();
			})
		})
		.on('file',function(file){console.log('file event:',file._.path);})
		.on('directory',function(file){console.log('directory event:',file._.path);})
		.on('done',function(file){console.log('-----------------------');})
		.emitErrors(true)
		.on('error',function(err){console.log('ERROR',err);})
		.start(function(err,file){
			if(err){return console.log(err);}
			for(var n in file){
				console.log(file[n]);
			}
			//or
			var children = file._.children;
			for(var i=0;i<children.length;i++){
				console.log(children[i]._.name);
			}
		})
```

If for some reason you want to set the root directory name later (not at instantiation), do that:

```js
	Tree()
		.file('path_to_file')
		//other things
		.start(callback)

```

By default, skywalker does not emit errors, as it is expected that they will be handled in callbacks.
However, if you prefer event-style error handling, do the following:

```js
	Tree(dir)
	.emitError(true)
	.on('error',function(err){
		console.log('error',err);
	})
	.start(func);
```

-----
## Files Properties

All properties (name, path, etc) are stored on a property named "_".
The following properties are to be found:


 - `file._.path`  full path to the file
 - `file._.dirname`  parent dir of the file
 - `file._.filename`  filename of the file, including extension
 - `file._.extension`  extension, without the dot, and in lowercase
 - `file._.name`  filename without extension
 - `file._.children`  only for directories: an array of children
 - `file._.parents`  an array of parents (backref to the parents)
 - `file._.contents`  empty, fill it with a string if your own callbacks
 - `file._.mime`  mimetype, for example 'text/plain'
 - `file._.mime.type`  for example 'text'
 - `file._.mime.subType` for example, 'plain'
 - and all `stats` properties, which are:
 	+ `dev`
 	+ `mode`
 	+ `nlink`
 	+ `uid`
 	+ `gid`
 	+ `rdev`
 	+ `blksize`
 	+ `ino`
 	+ `size` works for directories too
 	+ `blocks`
 	+ `atime` converted to a unix timestamp
 	+ `mtime` converted to a unix timestamp
 	+ `ctime` converted to a unix timestamp

Plugins may add properties to this object (see below).

If you have, in your path, a file or folder named "_", then the properties of its parent will be overwritten.
In that case, you have two options:  
1 - Change the default namespace:
```js
	Tree.propertiesPropertyKey('_somethingsafe_');
	// later...
	console.log(file._somethingsafe_.path)
```
2 - use the 'safe' namespace:
```js
	console.log(file.__________.path);
	// Yes, that's 10 "_".
	// If you have a file named like that too,
	// then you are shit out of luck.
```
Note that both keys are usable at all times.

The default toString() function outputs the file's path, but if you set the `contents` property of the file...

```js
	file._.contents = 'abcde';
```

...Then this is what toString() will output.


To detect mimetypes, skywalker uses [node-mime](https://github.com/broofa/node-mime). It is made available on the `Tree.mime` namespace

```js
	//define a new mime-type:
	Tree.mime.define({
		'text/jade':['jade']
	})
```

------
## Filters
There are several available filters, they all have the same signature:
`filterFunction(regex|glob|null,func)`

- `regex or glob` is either a regex or a string. If nothing is provided, the filter will match every file and directory
- `func` is a function with signature `callback(next,done)`. Next() processes the next file, and done() interrupts the current directory processing. You can call done(err) to output an error.

Available filters are:

- `filter(regex|glob,func)`: basic filter
- `directoryFilter(regex|glob,func)`: acts only on directories
- `fileFilter(regex|glob,func)`: acts only on files
- `extensionFilter(string,func)`: you can provide a space-separated string of extension (`jpg jpeg bmp`), will act only on those extensions
- `mimeFilter(regex|glob,func)`: will act only on matched mime type

Additionally, you have some convenience filters to ignore things:
- `ignore(regex|glob)`: will ignore files that match the pattern
- `ignoreDirectories(regex|glob)`: you know what this does
- `ignoreFiles(regex|glob)`: that too
- `ignoreDotFiles()`: ignores files and directories that begin with '.'

-----
## Selectors
Selectors run *after* the tree has been parsed and allow for further filtering.

```js
	var Tree = require('skywalker');
	var db = Tree.db;
	Tree(__dirname)
		.ignoreDotFiles()
		.selectors('F & size > 6100')
		.start(function(err,file){
			var c = file._.children;
			for(var n in c){console.log(c[n]._.path)}
		})
```

A selector presents itself as such:
`property operator value`

- `property` is any property of the file, found on the `_` object. That is any 'native' property, or any property added by a plugin
- `operator` is one of the operators below
- `value` is the value compared to. some operators don't require a value

You can chain selectors with '&'.
Available selectors are:

- Selectors with properties:
	- `GREATER_THAN : '>'` example: `size > 6100`
	- `LOWER_THAN: '<'` example: `atime < 1416242596`
	- `GREATER_OR_EQUAL: '>='` 
	- `LOWER_OR_EQUAL: '<='`
	- `EQUAL: '=='`
	- `EQUAL_STRICT: '==='`
	- `MATCHES: '#'` example: `path # node_modules`
- Selectors that require a value only:
	- `EXTENSION: '.'` example `. jpg` (does not require a property)
	- `PATH: '/'` example `/ node_modules` (similar to the `matches` example above, but globbing is allowed)
	- `MIMETYPE: '@'` example: `@ text/javascript`
- Selectors that require an operator only:
	- `ISDIR: 'D'`
	- `ISFILE:'F'`

-----
## Plugins

Skywalker ships with a few examples plugins (not loaded, copy-paste them where you need them). They are:

- checksum: outputs a checksum string in a property called `checksum`. Needs the `checksum` module.
- images: outputs size (width,height), imageMode (landscape, portrait, square) and ratio (1.xxx) to the "_" property of images. Needs the `image-size` module.
- json: parses json files. Sets the raw data on the "\_.contents" and the parsed data on "\_.data"
- markdown: parses markdown files. Sets the raw data on "\_.contents" and the rendered content on "\_.rendered". Needs the `markdown` module.
- size: adds a human readable size property called `humanSize`. Needs the `filesize` module.
- websafe: turns file names ("my nice image.jpeg") to a string that can be used in a classname or as an id ("my_nice_image"), and sets it on the "_.safename" property

add a plugin by calling  
`Tree(dir).plugin(require('path-to-plugin').start(...`

**Be careful, order of filters and plugins does matter**

-----
## More Info & Examples
Check out the tests.
* install moka and chai:
`npm install -g mocha chai`
* run the tests
`cd skywalker && mocha`

----
## License
MIT
