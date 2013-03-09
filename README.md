# Test-Creep - Node.js Selective Test Execution

Make testing 10x times faster by running only the tests affected by changed code. Seamlessly integrates with [Mocha](http://visionmedia.github.com/mocha/) (more frameworks coming soon).


## What is selective test execution?

Selective test execution means running just the relevant subset of your tests instead of all of them. For example, if you have 200 tests, and 10 of them are related to some feature, then if you make a change to this feature you should run only the 10 tests and not the whole 200. test-creep automatically chooses the relevant tests based on [istanbul](https://github.com/gotwarlost/istanbul) code coverage reports. All this is done for you behind the scenes and you can work normally with just Mocha.

For more information visit [my blog](http://webservices20.blogspot.com/) or [my twitter](https://twitter.com/YaronNaveh).


## Installation and usage

1. You should use [Mocha](http://visionmedia.github.com/mocha/) in your project to run tests. You should use git as a source control.

2. You need to have Mocha installed locally and run it locally rather than globally:
`````
    $> npm install mocha
    $> ./node_moduels/mocha/bin/mocha ./tests
`````

3. You need to install test-creep:
`````
    $> npm install test-creep
`````

4. When you run mocha specify to run the special test 'first.js' before all other tests:
`````
    $> ./node_modules/mocha/bin/mocha ./node_modules/test-creep/first.js ./tests
`````
   first.js is bundled with test-creep and monkey patchs mocha with the required instrumentation (via [istanbul](https://github.com/gotwarlost/istanbul)).

In addition, it is recommended to add .testdeps_.json to .gitignore (more on this file below).

## How does this work?

The first time you execute the command all tests run. first.js monkey patches mocha with istanbul code coverage and tracks the coverage per test (rather than per the whole process). Based on this information test-creep creates a test dependency file in the root of your project (.testdeps_.json). The file specifies for each test which files it uses:


`````javascript
    {
        "should alert when dividing by zero": [
            "tests/calc.js",
            "lib/calc.js",
            "lib/exceptions.js",

        ],

        "should multiply with negative numbers": [
            "tests/negative.js",
            "lib/calc.js",            
        ],
    }

`````

Next time you run the tests (assuming you add first.js to the command) test-creep runs 'git status' to see which files were added/deleted/modified since last commit. Then test-creep searches the dependency file to see which tesst may be affected and instructs mocha to only run these tests. In the example above, if you have uncommited changes only to lib/exceptions.js, then only the first test will be executed.

At any moment you can run mocha without the 'first.js' parameter in which case all tests and not just relevant ones will run.


## When to use test-creep
test-creep sweet spot is in long running test suites, where it can save many seconds or minutes each time you run tests. If you have a test suite that runs super fast (< 2 seconds) then test-creep will probably add more overhead than help. However whenever tests run for more than that test-creep can save you time.


## Limitations
* Dependency between test and code is captured at file and not function granularity. So sometimes test-creep can run more tests than actually requiered (though there is no harm in that).

* test-creep cannot detect changes in global contexts. For example, if you have a one time global initialization of a dictionary, and some tests use this dictionary, then test-creep will not mark these tests as dirty if there is a change in the initialization code. 

* Tests should have unique names even if they reside in different files/suites.


## Troubleshooting
At any moment you can run mocha without the 'first.js' parameter in which case mocha runs all tests as normal.
You can also delete .testdeps_.json if you wish test-creep to reinitialize its cache for any reason.


## More information
For more information visit [my blog](http://webservices20.blogspot.com/) or [my twitter](https://twitter.com/YaronNaveh).
