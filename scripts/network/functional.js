var isNothing = x => (x === null) || (x === undefined)
var isSomething = x => ! isNothing (x)
var identity = x => x
var isWeaklyTrue = x => x ? true : false

var firstF = (fs, x, test=isSomething) => {
    var r
    for (let f of fs) {
	r = f (x)
	if (test (r)) return r
    }	
}

var firstA = (xs, f, test=isSomething) => {
    var r
    for (let x of xs) {
	r = f (x)
	if (test (r)) return r
    }
}

exports.isNothing = isNothing
exports.isSomething = isSomething
exports.identity = identity
exports.isWeaklyTrue = isWeaklyTrue
exports.firstA = firstA
exports.firstF = firstF
