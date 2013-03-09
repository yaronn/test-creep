
var a = require("./a")

var assert = require('assert')

describe('d', function(){  
    it('should pass', function(){
      a.a1()
    })  

    it('should fail', function() {
      assert(false)
    })
})
