## test-creep - Node.js selective test execution

**Seamlessly** integrates with [Mocha](http://visionmedia.github.com/mocha/) (more frameworks coming soon).


## What is selective test execution?

It means running just the relevant subset of your tests instead of all of them. For example, if you have 200 tests, and 10 of them are related to some feature, then if you make a change to this feature you should run just the 10 tests and not the whole 200. test-select automatically chooses the relevant tests based on [istanbul](https://github.com/gotwarlost/istanbul) code coverage reports. All this is done for you behind the scenes and you can work normally with just Mocha.

For more information visit [my blog](http://webservices20.blogspot.com/) or [my twitter](https://twitter.com/YaronNaveh).


## Usage

1. You should use [Mocha](http://visionmedia.github.com/mocha/) in your project to run tests. You should use git as source control.

2. You need to have Mocha installed locally and run it locally rather than globally:
`````
    $> npm install mocha
    $> ./node_moduels/mocha/bin/mocha ./tests
`````

3. You need to install test-creep:

`````
    $> npm install test-creep
`````

4. When you run mocha specify to run a special test before all other tests
`````
    $> ./node_moduels/mocha/bin/mocha ./node_modules/test-creep/first.js ./tests
`````

first.js is bundled with test-select and monkey patchs mocha with required instrumentation.

5. It is recommended to add ./.testdeps_.json to .gitignore (more on this file below)

## How does this work?

The first time you execute the command all tests run. first.js monkey patches mocha with istanbul code coverage and tracks the coverage per test (rather than per the whole process). Then in your project root the test dependency file is created (./.testdeps_.json):


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

Next time you run the test (assuming you add first.js to the command) test-creep runs 'git status' to see which files were added/deleted/modified since last commit. Then test-creep instructs mocha to only run tests that have dependency in changed files. In the example above, if you have uncommited changes only to lib/exceptions.js, then only the first test will be executed.

At any moment you can run mocha without first.js in which case all tests and not just relevant ones will run.


## limitations
* Dependency between test and code is captured at file and not function granularity. So sometimes test-select can run more tests than actually requiered (there is no harm in that).

* test-select cannot detect changes in global contexts. For example, if you have a one time global initialization of a dictionary, and some tests use this dictionary, then test-select will not mark these tests as dirty if there is a change in the initialization code. 

* If you have a test suite that runs super fast (< 2 seconds) then test-select will probably add more overhead than help. test-select sweet spot is in long running test suites, though whenever tests run for more than a couple of seconds it can save you time.

## More information
For more information visit [my blog](http://webservices20.blogspot.com/) or [my twitter](https://twitter.com/YaronNaveh).
