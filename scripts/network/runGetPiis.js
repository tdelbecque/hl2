#!/usr/bin/node

var p = require ('./getpii')
var fs = require ('fs')

var undef
var firstDateStr = process.argv [2]
var lastDateStr = process.argv [3]

var firstDate
if (firstDateStr === undef) {
    firstDate = new Date ()
    firstDate.setDate (firstDate.getDate () - 1)
} else 
    firstDate = new Date (firstDateStr)

var lastDate
if (lastDateStr === undef) {
    lastDate = new Date ()
    lastDate.setDate (lastDate.getDate () - 1)
} else
    lastDate = new Date (lastDateStr)

if (lastDate < firstDate) {
    var d = firstDate
    firstDate = lastDate
    lastDate = d
}
    
var f = new p (firstDate, lastDate)
if (! f.testValid().isValid)
    throw "ERR INITIALIZE"

function whenFinished (piis) {
    Object.keys (piis).forEach (function (k) {
	var v = piis [k]
	var fn = 'PIIS/' + k
	fs.writeFile (fn, JSON.stringify (piis [k]),
		      function (err) {
			  if (err)
			      process.stderr.write (err + '\n')})
    })
}

f.get (whenFinished)


