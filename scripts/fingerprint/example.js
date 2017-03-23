var m = require ('./tokenize')

sayOk = () => console.log ('ok')

var f = new m ()



f.load ().then (() => f.tokenize ()).then (sayOk)

