var fs = require ('fs')

var undef
var dirKnown = process.argv [2]
var dirCandidates = process.argv [3]

var knownPiiDic = {}
var nToProcess = 0

function processDir (dir, callback) {
    var fun = function (xs) {
	var x = xs.match (/(S(?:X|\d){16})/g)
	if (x !== null)
	    x.forEach (callback)
    }	    

    var files = fs.readdirSync (dir)
    nToProcess = files.length
    files.forEach (function (f) {
	var fn = dir + '/' + f
	var s = fs.createReadStream (fn, {encoding:'utf8'})
	var data = ''
	s.on ('data', function (d) {
	    data = data + d
	    var lines = data.split (/\r?\n/)
	    data = lines.pop ()
	    lines.forEach (function (l) {
		fun (l)
	    })
	})
	s.on ('end', function () {
	    fun (data)
	    nToProcess --
	})
    })
}

function toh () {
    if (nToProcess === 0) {
	processDir (dirCandidates,
		    function (x) {if (! knownPiiDic [x]) process.stdout.write (x + '\n')})
	clearInterval (ih)
    }
}
processDir (dirKnown, function (x) {knownPiiDic [x] = 1})
var ih = setInterval (toh, 0)
