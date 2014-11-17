var path = require('path');
var dir = path.resolve(__dirname+'/..')
var chai = require('chai')
var expect = chai.expect
var Tree = require('../index');
chai.should();

describe('Walking a directory',function(){
	it("should walk the directory provided",function(done){
		Tree(dir).start(function(err,file){
			if(err){throw err;}
			file._.children.length.should.equal(9);
			done();
		});
	});
	it("should be capable of ignoring files that begin with a dot",function(done){
		Tree(dir)
			.ignoreDotFiles()
			.start(function(err,file){
				if(err){throw err;}
				file._.children.length.should.equal(7);
				done();
			})
		;
	});
	it("should emit events for every file and directory",function(done){
		var fileEvents = 0;
		var directoryEvents = 0;
		Tree(dir+'/test')
			.on('file',function(file){
				fileEvents++;
			})
			.on('directory',function(dir){
				directoryEvents++;
			})
			.start(function(err,file){
				if(err){throw err;}
				fileEvents.should.equal(4);
				directoryEvents.should.equal(2);
				done();
			})
		;
	});
	it("should silently eat errors by default",function(done){
		Tree('/some_path that doesn\'t exist lalala')
			.on("error",function(err){
				console.log(err);
			})
			.start(function(err,file){
				done();
			})
		;
	});
	it("should allow to limit depth",function(done){
		function testWithLimit(next){
			Tree(dir)
				.limit(1)
				.start(function(err,file){
					file['node_modules']._.children.length.should.equal(0);
					next();
				})
			;
		}
		function testWithoutLimits(next,andAfter){
			Tree(dir)		
				.start(function(err,file){
					file['node_modules']._.children.length.should.be.greaterThan(0);
					next(andAfter);
				})
			;
		}

		testWithoutLimits(testWithLimit,done);
	});
	it("should allow looping through members names",function(done){
		Tree(dir)		
			.start(function(err,file){
				for(var n in file){
					if(n=='node_modules'){done();}
				}
			});
		;
	});
	it("should allow looping through the _.children array",function(done){
		Tree(dir)		
			.start(function(err,file){
				for(var i=0,f;f=file._.children[i++];){
					if(f._.name=="node_modules"){done();}
				}
			});
		;
	});
	it.skip("should throw an error if errors are set to be thrown",function(done){
		var fn = function(){
			Tree('/some_path that doesn\'t exist lalala')
				.throwErrors(true)
				.start(function(err,file){});
		}
		expect(fn).to.throw();
		;
	})
});

describe("Using Events",function(){
	it("should emit events for every file and directory",function(done){
		var fileEvents = 0;
		var directoryEvents = 0;
		Tree(dir+'/test')
			.on('file',function(file){
				fileEvents++;
			})
			.on('directory',function(dir){
				directoryEvents++;
			})
			.start(function(err,file){
				if(err){throw err;}
				fileEvents.should.equal(4);
				directoryEvents.should.equal(2);
				done();
			})
		;
	});
	it("should emit events when done",function(done){
		var fileEvents = 0;
		var directoryEvents = 0;
		Tree(dir+'/test')
			.on('file',function(file){
				fileEvents++;
			})
			.on('directory',function(dir){
				directoryEvents++;
			})
			.on('done',function(file){
				fileEvents.should.equal(4);
				directoryEvents.should.equal(2);
				done();
			})
			.start(function(err,file){
				if(err){throw err;}
			})
		;
	});
	it("should emit an error if errors are set to be emitted",function(done){
		Tree('/some_path that doesn\'t exist lalala')
			.emitErrors(true)
			.on("error",function(err){done();})
			.start(function(err,file){})
		;
	})
})

describe("Adding Filters",function(){
	it("should allow to add regex filters",function(done){
		var filesThatBeginWithI = 0;
		Tree(dir+'/test')
			.filter(/i[^\/]*?$/,function(next){
				filesThatBeginWithI++;
				next();
			})
			.start(function(err,file){
				if(err){throw err;}
				filesThatBeginWithI.should.equal(2);
				done();
			})
		;		
	});
	it("should allow to add regex filters on directories only",function(done){
		var filesThatBeginWithI = 0;
		Tree(dir+'/test')
			.directoryFilter(/i[^\/]*?$/,function(next){
				filesThatBeginWithI++;
				next();
			})
			.start(function(err,file){
				if(err){throw err;}
				filesThatBeginWithI.should.equal(1);
				done();
			})
		;		
	});
	it("should allow to add regex filters to files only",function(done){
		var filesThatBeginWithI = 0;
		Tree(dir+'/test')
			.fileFilter(/i[^\/]*?$/,function(next){
				filesThatBeginWithI++;
				expect(this._.path).to.match(/index\.js/)
				next();
			})
			.start(function(err,file){
				if(err){throw err;}
				filesThatBeginWithI.should.equal(1);
				done();
			})
		;		
	});
	it("should allow to match filters by mime type",function(done){
		var filesThatBeginWithI = 0;
		Tree(dir+'/test')
			.mimeFilter('application/javascript',function(next){
				filesThatBeginWithI++;
				expect(this._.path).to.match(/index\.js/)
				next();
			})
			.mimeFilter('javascript',function(next){
				filesThatBeginWithI++;
				expect(this._.path).to.match(/index\.js/)
				next();
			})
			.start(function(err,file){
				if(err){throw err;}
				filesThatBeginWithI.should.equal(2);
				done();
			})
		;		
	});
	it("should allow to match filters by extension",function(done){
		var images = 0;
		Tree(dir+'/test')
			.extensionFilter('jpg jpeg png',function(next){
				images++;
				next();
			})
			.start(function(err,file){
				images.should.equal(2);
				done();
			})
		;
	})
	it("should allow to remove files in filters",function(done){
		var images = 0;
		Tree(dir+'/test')
			.extensionFilter('jpg jpeg png',function(next,done){
				images++;
				done(null,false);
			})
			.start(function(err,file){
				images.should.equal(2);
				file.images._.children.length.should.equal(0);
				done();
			})
		;
	})
	it("should allow to match filters by globbing",function(done){
		var images = 0;
		Tree(dir+'/test')
			.filter('**/images/*',function(next){
				images++;
				next();
			})
			.start(function(err,file){
				images.should.equal(2);
				done();
			})
		;
	});
})

describe("Adding Selectors",function(){
	it("should allow for adding a size selector",function(done){
		Tree(dir)
			.ignoreDotFiles()
			.selectors('size > 6100')
			.start(function(err,file){
				var c = file._.children;
				c[0]._.filename.should.equal('README.md');
				done();
			});
	});
	it("should allow for a matching selector",function(done){
		Tree(dir+'/test')
			.ignoreDotFiles()
			.selectors('path # dummy')
			.start(function(err,file){
				var c = file._.children;
				c[0]._.filename.should.equal('dummy.json');
				done();
			});
	});
	it("should allow for an extension selector",function(done){
		Tree(dir+'/test')
			.ignoreDotFiles()
			.selectors('. json')
			.start(function(err,file){
				var c = file._.children;
				c[0]._.filename.should.equal('dummy.json');
				done();
			});
	});
	it("should allow for a path selector",function(done){
		Tree(dir+'/test')
			.ignoreDotFiles()
			.selectors('/ **/images*')
			.start(function(err,file){
				var c = file._.children;
				c[0]._.filename.should.equal('images');
				done();
			})
		;
	});
	it("should allow for a mimetype selector",function(done){
		Tree(dir+'/test')
			.ignoreDotFiles()
			.selectors('@ json')
			.start(function(err,file){
				var c = file._.children;
				c[0]._.filename.should.equal('dummy.json');
				done();
			})
		;
	});
	it("should allow for a directory filter",function(done){
		Tree(dir+'/test')
			.ignoreDotFiles()
			.selectors('D')
			.start(function(err,file){
				var c = file._.children;
				c[0]._.filename.should.equal('images');
				done();
			})
		;
	});
	it("should allow for a file filter",function(done){
		Tree(dir+'/test')
			.ignoreDotFiles()
			.selectors('F')
			.start(function(err,file){
				var c = file._.children;
				c.length.should.equal(2);
				done();
			})
		;
	});
	it("should allow for directives chaining",function(done){
		Tree(dir+'/test')
			.ignoreDotFiles()
			.selectors('F & @ json')
			.start(function(err,file){
				var c = file._.children;
				c.length.should.equal(1);
				done();
			})
		;
	});
})

describe("File Properties",function(){
	it("should contain several properties",function(done){
		Tree(dir+'/test/images')
			.start(function(err,file){
				var image = file._.children[0];
				var props = image._;
				props.path.should.be.a('string');
				props.dirname.should.be.a('string');
				props.filename.should.be.a('string');
				props.extension.should.be.equal('jpg')
				props.name.should.be.a('string');
				props.contents.should.be.empty;
				props.type.should.be.equal('file')
				props.isDirectory.should.be.false;
				props.mime.type.should.be.equal('image');
				props.mime.subType.should.be.equal('jpeg');
				done();
			})
		;
	});
	it("should allow to change the default key on which properties are set",function(done){
		Tree.propertiesPropertyKey('_somethingsafe_');
		Tree(dir+'/test/images')
			.start(function(err,file){
				var image = file._somethingsafe_.children[0];
				var props = image._somethingsafe_;
				props.path.should.be.a('string');
				Tree.propertiesPropertyKey('_');
				done();
			})
		;
	});
	it("should provide directory size",function(done){
		Tree(dir+'/test/images')
			.start(function(err,file){
				var images = file._.children;
				var size = 0
				for(var i=0,image;image=images[i++];){
					size+=image._.size;
				}
				size.should.be.equal(file._.size);
				done();
			})
		;
	});
});

describe("Plugin Interface",function(){
	it("should allow for a simple plugin interface",function(done){
		var num = 0;
		var simplePlugin =function(tree,key){
			tree.filter(null,function(next,done){
				var props = this[key];
				props.setProp('number',num++)
				next();
			});
		};
		Tree(dir)
			.ignoreDotFiles()
			.plugin(simplePlugin)
			.start(function(err,file){
				num.should.be.greaterThan(100);
				file._.number.should.be.equal(num-1);
				done();
			})
		;
	});
	it("has a human readable size plugin",function(done){
		Tree(dir)
			.ignoreDotFiles()
			.plugin(require('../plugins/size'))
			.start(function(err,file){
				file._.humanSize.should.be.a('string').and.match(/MB/);
				done();
			})
		;
	});
	it("has an image size plugin",function(done){
		Tree(dir+'/test/images')
			.ignoreDotFiles()
			.plugin(require('../plugins/images'))
			.start(function(err,file){
				file._.children[0]._.width.should.be.a('number');
				file._.children[0]._.height.should.be.a('number');
				done();
			})
		;
	});
	it("has a plugin to generate web id/classname safe names from filenames",function(done){
		Tree(dir+'/test/images')
			.ignoreDotFiles()
			.plugin(require('../plugins/websafe'))
			.start(function(err,file){
				file['002 1376654587507.jpg']._.safename.should.be.equal('002_1376654587507');
				done();
			})
		;
	});
	it("has a plugin to generate checksums from filenames",function(done){
		Tree(dir+'/test/images')
			.ignoreDotFiles()
			.plugin(require('../plugins/checksum'))
			.start(function(err,file){
				file['002 1376654587507.jpg']._.checksum.should.be.equal('c299f1f7e692e98a3c4bee427251005978b71a80');
				done();
			})
		;
	});
	it("has a plugin to parse markdown files automatically",function(done){
		Tree(dir)
			.ignoreDotFiles()
			.limit(1)
			.plugin(require('../plugins/markdown'))
			.start(function(err,file){
				var c = require('fs').readFileSync(dir+'/README.md',{encoding:'utf8'});
				var markdown = require('markdown').markdown.toHTML(c);
				file['README.md']._.contents.should.equal(c);
				file['README.md']._.rendered.should.equal(markdown);
				done();
			})
		;
	});
	it("has a plugin to parse json files automatically",function(done){
		Tree(dir+'/test')
			.ignoreDotFiles()
			.limit(1)
			.plugin(require('../plugins/json'))
			.start(function(err,file){
				var c = require('fs').readFileSync(dir+'/test/dummy.json',{encoding:'utf8'});
				var json = JSON.parse(c);
				file['dummy.json']._.data.someprop.should.equal(json.someprop);
				done();
			})
		;
	});
});

describe("ToString",function(){
	it("should output the file path if rendered to string",function(done){
		Tree(dir+'/test')
			.ignoreDotFiles()
			.limit(1)
			//.plugin(require('../plugins/json'))
			.start(function(err,file){
				(file+"").should.be.equal(file._.path);
				done();
			})
		;
	});
	it("should output the file contents if rendered to string and 'contents' exists",function(done){
		Tree(dir+'/test')
			.ignoreDotFiles()
			.limit(1)
			.plugin(require('../plugins/json'))
			.start(function(err,file){
				var c = require('fs').readFileSync(dir+'/test/dummy.json',{encoding:'utf8'});
				(file['dummy.json']+"").should.be.equal(c);
				done();
			})
		;
	});
	it("should output the file rendered if rendered to string and 'rendered' exists",function(done){
		Tree(dir)
			.ignoreDotFiles()
			.limit(1)
			.plugin(require('../plugins/markdown'))
			.start(function(err,file){
				var c = require('fs').readFileSync(dir+'/README.md',{encoding:'utf8'});
				var markdown = require('markdown').markdown.toHTML(c);
				(file['README.md']+"").should.be.equal(markdown);
				done();
			})
		;
	});
});

describe("Post Tree Building",function(){
	it("should allow to group files by extension",function(done){
		var db = Tree.db;
		Tree(dir)
			.ignoreDotFiles()
			.start(function(err,file){
				//db(file).walk(function(){console.log(this._.path)});
				done();
			})
		;
	})
})