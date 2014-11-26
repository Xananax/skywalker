var path = require('path');
var root = __dirname+'/'; 
var dir = path.resolve(__dirname+'/watch')+'/';
var chai = require('chai');
var expect = chai.expect;
var Tree = require('../index');
var fs = require('fs');
var dummyFile = dir+'dummy.file.txt';
chai.should();

function clean(){
	if(fs.existsSync(dir)){
		remove();
		if(fs.existsSync(dummyFile+'A')){
			fs.unlinkSync(dummyFile+'A');
		}
		if(fs.existsSync(dummyFile+'C')){
			fs.unlinkSync(dummyFile+'C');
		}
		fs.rmdirSync(dir);
	}
}
function prepare(){if(!fs.existsSync(dir)){fs.mkdirSync(dir);fs.writeFileSync(dummyFile+'C','a');}}
function randomData(){return (Math.random()*1000)+'';}
function create(content){fs.writeFileSync(dummyFile,content||randomData(),{encoding:'utf8'});}
function createDelay(delay,content,cb){setTimeout(function(){create(content);if(cb){cb();}},delay||200);}
function remove(){if(fs.existsSync(dummyFile)){fs.unlinkSync(dummyFile);}}
function ensureExists(){return fs.existsSync(dummyFile);}
function ensureDeleted(){return fs.existsSync(dummyFile);}
function readDummyFile(){return (fs.existsSync(dummyFile) && fs.readFileSync(dummyFile,{encoding:'utf8'})) || '';}
function recordValue(){recordValue.val = readDummyFile();return recordValue.val;}
function ensureChanged(){var v = recordValue.val || false;return (v && v !== recordValue());}
function runBeforeEach(){clean();prepare();}
function runAfterEach(){remove();clean();}
function rename(L1,L2){
	if(fs.existsSync(dummyFile+L1)){
		fs.renameSync(dummyFile+L1,dummyFile+L2);
		return true;
	};return false;
}


describe('Watching a directory',function(){
	var writeFileDelay = 500;
	this.timeout(5000);
	beforeEach(runBeforeEach);
	afterEach(runAfterEach);
	it('should emit a created event when a file is created under the directory',function(done){
		var t = Tree(dir)
			.on('created',function(file){
				t.unwatch();
				remove();
				done();
			})
			.watch('gaze',function(err,files){
				if(err){throw err;}
				createDelay(writeFileDelay);
			})
		;
	});
	it('should emit a changed event when a file is modified under the directory',function(done){
		create();
		ensureExists().should.be.true;
		recordValue();
		var t = Tree(dir)
			.on('changed',function(file){
				ensureChanged().should.be.true;
				t.unwatch();
				done();
			})
			.watch('gaze',function(err,files){
				if(err){throw err;}
				createDelay(writeFileDelay);
			})
		;
	});
	it.skip('should emit a changed event when a file is renamed under the directory',function(done){
		create();
		ensureExists().should.be.true;
		var t = Tree(dir)
			.on('renamed',function(file){
				t.unwatch();
				fs.existsSync(dummyFile+'A').should.be.true;
				done();
			})
			.watch('gaze',function(err,files){
				if(err){throw err;}
				setTimeout(function(){
					rename('','A').should.be.true;
					fs.existsSync(dummyFile+'A').should.be.true;
				},writeFileDelay);
			})
		;
	});
	it('should emit a removed event when a file is deleted under the directory',function(done){
		create();
		ensureExists().should.be.true;
		var t = Tree(dir)
			.on('removed',function(file){
				t.unwatch();
				done();
			})
			.watch('gaze',function(err,files){
				if(err){throw err;}
				setTimeout(function(){
					remove();
					ensureExists().should.be.false;
				},writeFileDelay);
			})
		;
	});
});