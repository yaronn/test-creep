var execSync = require('execSync');
var fs = require('fs');
var consts = require('../consts')
var assert = require('assert')

describe('selective test execution', function() {  

     beforeEach(function(done){
        if (fs.existsSync(consts.depsFile)) {
           fs.unlinkSync(consts.depsFile)
        }
        done()
     })

    it('should only run tests that depend on changed code', function(){        
      var results = runTests('aut_passing_tests.js')      
      assert(results.indexOf('3 tests complete')!=-1, 'expected all tests to run because deps file does not exist yet')
      assert(fs.existsSync(consts.depsFile), 'expected ' + consts.depsFile + ' to exist')
      var deps = fs.readFileSync(consts.depsFile)
      assert.equal(deps
         , JSON.stringify({"should show a,b,c,e":["tests/aut/aut_passing_tests.js","tests/aut/a.js","tests/aut/b.js","tests/aut/c.js","tests/aut/e.js"],"should show a,b,c,e again":["tests/aut/aut_passing_tests.js","tests/aut/a.js","tests/aut/b.js","tests/aut/c.js","tests/aut/e.js"],"should show a,b,d,e":["tests/aut/aut_passing_tests.js","tests/aut/a.js","tests/aut/b.js","tests/aut/e.js","tests/aut/d.js"]}, null, 4)
         , 'deps file does not contain expected content')


      results = runTests('aut_passing_tests.js')

      assert(results.indexOf('0 tests complete')!=-1, 'expected no tests to run because no code changes have been made')
      
      for (var i=0; i<2; i++) {
         results = runTests('aut_passing_tests.js', 'modified:   tests/aut/c.js')
         assert(results.indexOf('2 tests complete')!=-1, 'expected 2 tests to run because c.js has changed')
      }
      
      results = runTests('aut_passing_tests.js')
      assert(results.indexOf('0 tests complete')!=-1, 'expected no tests to run because no code changes have been made')
      
    }) 

   it('should not have entry in deps file for failing tests', function() {
      var results = runTests('aut_failing_tests.js')      
      //execSync cannot read stderr so we cannot detect this
      //assert(results.indexOf('1 of 2 tests failed')!=-1, 'expected one test to fail, and one test to pass')
      assert(fs.existsSync(consts.depsFile), 'expected ' + consts.depsFile + ' to exist')
            
      var deps = fs.readFileSync(consts.depsFile).toString()
      assert.notEqual(deps.indexOf('should pass'), -1, 'deps file does not contain expected content')
      assert.equal(deps.indexOf('should fail'), -1, 'deps file does not contain expected content')
   })

   it('should add/delete dependencies to existing tests that run again', function() {
      //abuse the limitation that tests with same name in different files are considered the same test...
      runTests('aut_tests_duplicate1.js')
      var deps1 = fs.readFileSync(consts.depsFile).toString()
      //console.log(deps1)
      assert.notEqual(deps1.indexOf('a.js'), -1, 'deps file does not contain expected content')
      assert.notEqual(deps1.indexOf('c.js'), -1, 'deps file does not contain expected content')
      assert.equal(deps1.indexOf('d.js'), -1, 'deps file does not contain expected content')

      runTests('aut_tests_duplicate2.js', 'modified:   tests/aut/a.js')
      var deps2 = fs.readFileSync(consts.depsFile).toString()
      //console.log(deps2)
      assert.notEqual(deps2.indexOf('a.js'), -1, 'deps file does not contain expected content')
      assert.equal(deps2.indexOf('c.js'), -1, 'deps file does not contain expected content')
      assert.notEqual(deps2.indexOf('d.js'), -1, 'deps file does not contain expected content')
   })

   it('should run a test if its test file has changed', function() {
      var results = runTests('aut_passing_tests.js')      
      assert(results.indexOf('3 tests complete')!=-1, 'expected all tests to run because deps file does not exist yet')
      var results = runTests('aut_passing_tests.js', 'deleted: tests/aut/aut_passing_tests.js')      
      assert(results.indexOf('3 tests complete')!=-1, 'expected all tests to run because the tests file has changed')
   })

})

var runTests = function(file, gitstatus) {
   gitstatus = gitstatus || ' '  
   var cmd = 'gitstatus="' + gitstatus + '" ./node_modules/mocha/bin/mocha ./first.js ./tests/aut/' + file  
   var res = execSync.stdout(cmd)   
   return res
}  