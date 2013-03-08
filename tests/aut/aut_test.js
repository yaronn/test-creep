require("../../selective.js")

var a = require("./a")

describe('c', function(){  
    it('should show a,b,c,e', function(){
      a.a1()
    }) 

    it('should show a,b,c,e again', function(){
      a.a1()
    })   
})

describe('d', function(){  
    it('should show a,b,d,e', function(){
      a.a2()
    })  
})
