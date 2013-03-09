var fs = require('fs')
var path = require('path')
var execSync = require('execSync');
var mocha = require('mocha')
var consts = require('./consts')
var coverage = require('./coverage');
coverage.hookRequire();

var selective = {  
  depsTree: {},
  testsToRun: {},

  init: function() {
    this.loadDepsTree()
    this.loadChangedFiles()
  },

  loadDepsTree: function() {
    if (fs.existsSync(consts.depsFile)) {
      this.depsTree = JSON.parse(fs.readFileSync(consts.depsFile))  
    }
  },

  saveDepsTree: function() {
    fs.writeFileSync(consts.depsFile, JSON.stringify(this.depsTree, null, 4))
  },

  cleanCoverageCounts: function() {
    if (typeof __coverage__ == 'undefined') return

    for (var file in __coverage__) {
      for (var line in __coverage__[file].s) {
          __coverage__[file].s[line] = 0
      }
    }
  },

  updateCoverageCounts: function(test) {    
    var coverage = this.getCurrentCoverage()          
    this.depsTree[test.title] = coverage
  },

  getCurrentCoverage: function() {    
    if (typeof __coverage__ == 'undefined') return
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
    var changedFiles = {}   
    //using env var is good for testing of the test-select library 
    var diff = process.env['gitstatus'] || execSync.stdout('git status');
    var rePattern = new RegExp(/(modified|deleted|added):\s*(.*)/g);
    var match = rePattern.exec(diff)
    while (match!=null) {     
       changedFiles[match[2]] = true
       match = rePattern.exec(diff)
    }
    
    for (var test in this.depsTree) {  
      this.testsToRun[test] = false  
      for (var file in this.depsTree[test])
      {   
       
        if (changedFiles[this.depsTree[test][file]]) {        
          this.testsToRun[test] = true
        }
      }
    }  
  }

}


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
    if (selective.testsToRun[test.title]==false)
      return next()

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
   })
   runner.on('test end', function(test) {          
      selective.updateCoverageCounts(test)            
   })

   return runner
}

