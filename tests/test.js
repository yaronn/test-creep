var execSync = require('execSync');
var fs = require('fs');
var consts = require('../consts')
var assert = require('assert')

describe('selective test execution', function(){  
    it('should only run tests that depend on changed code', function(){
      
      var runTests = function(gitstatus) {
         gitstatus = gitstatus || ''         
         return execSync.stdout('gitstatus="' + gitstatus + '" ./node_modules/mocha/bin/mocha ./tests/aut/aut_test.js')
      }    

      if (fs.existsSync(consts.depsFile)) {
         fs.unlinkSync(consts.depsFile)
      }

      var results = runTests()
      
      assert(results.indexOf('3 tests complete')!=-1, 'expected all tests to run because deps file does not exist yet')
      assert(fs.existsSync(consts.depsFile), 'expected ' + consts.depsFile + ' to exist')
      var deps = fs.readFileSync(consts.depsFile)
      assert.equal(deps
         , JSON.stringify({"should show a,b,c,e":["tests/aut/a.js","tests/aut/b.js","tests/aut/c.js","tests/aut/e.js"],"should show a,b,c,e again":["tests/aut/a.js","tests/aut/b.js","tests/aut/c.js","tests/aut/e.js"],"should show a,b,d,e":["tests/aut/a.js","tests/aut/b.js","tests/aut/e.js","tests/aut/d.js"]}, null, 4)
         , 'deps file does not contain expected content')


      results = runTests()

      assert(results.indexOf('0 tests complete')!=-1, 'expected no tests to run because no code changes have been made')
      
      for (var i=0; i<2; i++) {
         results = runTests('modified:   tests/aut/c.js')    
         assert(results.indexOf('2 tests complete')!=-1, 'expected 2 tests to run because c.js has changed')
      }
      
      results = runTests()
      assert(results.indexOf('0 tests complete')!=-1, 'expected no tests to run because no code changes have been made')
      
    }) 

})

