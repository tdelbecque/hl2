var fs = require ('fs')

var undef
var dir = process.argv [2]
var piiDic = {}

function outputPiis (xs) {
    var x = xs.match (/(S(?:X|\d){16})/g)
    if (x !== null)
	x.forEach (
	    function (x) {
		if (piiDic [x] === undef) {
		    piiDic [x] = 1
		    process.stdout.write (x + '\n')
		}
	    })	    
}

files = fs.readdirSync (dir)
files.forEach (function (f) {
    var fn = dir + '/' + f
    var s = fs.createReadStream (fn, {encoding:'utf8'})
    var data = ''
    s.on ('data', function (d) {
	data = data + d
	var lines = data.split (/\r?\n/)
	data = lines.pop ()
	lines.forEach (function (l) {
	    outputPiis (l)
	})
    })
    s.on ('end', function () {
	outputPiis (data)
    })
})


