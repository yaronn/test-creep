
var fs = require('fs')
var path = require('path')
var execSync = require('execSync');
var mocha = require('mocha')
var consts = require('./consts')
var coverage = require('./coverage');

var selective = {  
  depsTree: {},
  testsToRun: {},
  verbose: false,

  init: function() {
    selective.log('initializing selective execution...')
    this.loadDepsTree()
    this.loadChangedFiles()
  },

  loadDepsTree: function() {
    if (fs.existsSync(consts.depsFile)) {
      var deps = fs.readFileSync(consts.depsFile)
      this.depsTree = JSON.parse(deps)        
      selective.log('loading deps tree from disk:\n' + deps)
    }
    selective.log('done loading deps tree')
  },

  saveDepsTree: function() {        
    var deps = JSON.stringify(this.depsTree, null, 4)
    fs.writeFileSync(consts.depsFile, deps)
    selective.log('saved deps tree to disk:\n' + deps)
  },

  cleanCoverageCounts: function() {
    selective.log('trying to clean coverage report...')
    if (typeof __coverage__ == 'undefined') return

    for (var file in __coverage__) {
      for (var line in __coverage__[file].s) {
          __coverage__[file].s[line] = 0
      }
    }

    selective.log('coverage report clean')
  },

  updateCoverageCounts: function(test) {    
    selective.log('updating coverage count for test '+test.title+'...')
    var coverage = this.getCurrentCoverage()              
    selective.log('coverage for test:\n' + JSON.stringify(coverage, null, 4))    
    this.depsTree[test.title] = coverage    
    selective.log('total coverage:\n' + JSON.stringify(this.depsTree, null, 4))    
  },

  removeFromCoverage: function(test) {
    selective.log('removing coverage count for test '+test.title+'...')
    delete this.depsTree[test.title]
  },

  getCurrentCoverage: function() {    
    if (typeof __coverage__ == 'undefined') return
    selective.log('current coverage:\n' + JSON.stringify(__coverage__, null, 4))
    var res = []
    for (var file in __coverage__) {
      for (var line in __coverage__[file].s) {
          if (__coverage__[file].s[line]>0) {            
            var relative = path.relative(process.cwd(), file)
            res.push(relative)            
            break
          }
      }
    }

    return res
  },

  loadChangedFiles: function() {
    selective.log('loading changed files...')    
    var changedFiles = {}   
    //using env var is good for testing of the test-select library 
    var diff = process.env['gitstatus'] || execSync.stdout('git status');
    selective.log('diff is:\n' + diff)
    var rePattern = new RegExp(/(modified|deleted|added):\s*(.*)/g);
    var match = rePattern.exec(diff)
    while (match!=null) {     
       selective.log('changed file: ' + match[2])
       changedFiles[match[2]] = true
       match = rePattern.exec(diff)
    }
        
    selective.log('deps tree:\n' + JSON.stringify(this.depsTree, null, 4))
    selective.log('changed files:\n' + JSON.stringify(changedFiles, null, 4))    

    for (var test in this.depsTree) {  
      this.testsToRun[test] = false  
      for (var file in this.depsTree[test])
      {   
       
        if (changedFiles[this.depsTree[test][file]]) {        
          this.testsToRun[test] = true
        }
      }
    }
    
    selective.log('tests to run\n' + JSON.stringify(this.testsToRun, null, 4))        

  },

  log: function(str) {
    if (this.verbose) console.log(str + '\n')
  }

}


selective.log('starting selective execution')
if (process.argv.indexOf('--sel')==-1) return
selective.verbose = process.argv.indexOf('--verbose')!=-1
coverage.hookRequire(selective.verbose);
selective.init()


mocha.Runner.prototype.runTests = function(suite, fn) {  
  var self = this
    , tests = suite.tests.slice()
    , test;

  function next(err) {
    // if we bail after first err
    if (self.failures && suite._bail) return fn();

    // next test          
    test = tests.shift();

    // all done
    if (!test) return fn();    

    //**this is the line added for selective testing    
    if (selective.testsToRun[test.title]==false) {
      selective.log('skipping test:\n' + test.title)
      return next()
    }

    // grep
    var match = self._grep.test(test.fullTitle());
    if (self._invert) match = !match;
    if (!match) return next();

    // pending
    if (test.pending) {
      self.emit('pending', test);
      self.emit('test end', test);
      return next();
    }

    // execute test and hook(s)
    self.emit('test', self.test = test);
    self.hookDown('beforeEach', function(){
      self.currentRunnable = self.test;

      self.runTest(function(err){
        test = self.test;

        if (err) {
          self.fail(test, err);
          self.emit('test end', test);
          return self.hookUp('afterEach', next);
        }        

        test.state = 'passed';
        self.emit('pass', test);
        self.emit('test end', test);
        self.hookUp('afterEach', next);
      });      

    });
  }

  this.next = next;
  next();
};

var innerRunner = mocha.Runner

mocha.Runner = function (suite) {
   var runner = new innerRunner(suite)
   runner.on('end', function() {      
      selective.saveDepsTree()
   })
   runner.on('test', function(test) {          
      selective.cleanCoverageCounts() 
      selective.log('start run test:\n' + test.title)    
   })
   runner.on('pass', function(test) {          
      selective.updateCoverageCounts(test)            
      selective.log('end run test (pass):\n' + test.title)    
   })
   runner.on('fail', function(test) {          
      selective.removeFromCoverage(test)            
      selective.log('end run test (fail):\n' + test.title)    
   })

   return runner
}

