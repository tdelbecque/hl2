exports.say = x => {console.log (x); return x}
exports.croak = x => {console.error (x); return x}
exports.sayOk = () => console.log ('ok')
exports.croakFail = () => console.error ('fail')
exports.definedOr = definedOr = (x, y) => x === undefined ? y : x

exports.tabulate = (xs, field) =>
    xs.reduce ((a, b) => a.set (b[field],definedOr (a.get (b[field]), 0) + 1), new Map ())

exports.fswitch = alternatives => new Proxy (
    alternatives,
    {
	get (receiver, name) {
	    return receiver [name in receiver ? name : "_"]
	}
    }
)

const isNothing = x => (x === null) || (x === undefined)
const isSomething = x => ! isNothing (x)
const identity = x => x
const isWeaklyTrue = x => x ? true : false

const firstF = (fs, x, test=isSomething) => {
    var r
    for (let f of fs) {
	r = f (x)
	if (test (r)) return r
    }	
}

const firstA = (xs, f, test=isSomething) => {
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

loadDictionary = (file, handler) => new Promise (
    (resolve, reject) => {
	const data = new Map ()
	var str = ''
	try {
	    const s = require ('fs').
		  createReadStream (file, {encoding:'utf8'})

	    record = d => {
		if (d) {
		    var {key, value} = handler (d)
		    if (key !== undefined) data.set(key, value)
		}
	    }
	    
	    s.on ('data',
		  d => {const lines = (str + d).split (/\r?\n/)
			str = lines.pop ()
			lines.forEach (record)})    
	    
	    s.on ('end', () => {
		record (str)
		resolve (data)
	    })
	}
	catch (e) {
	    reject (e)
	}
    })

exports.loadDictionary = loadDictionary

const flatten = xs => xs.reduce ((a, b) => {
    if (b === undefined || b === null) return a
    return a.concat (Array.isArray (b) ? flatten (b) : [b])}, [])

exports.flatten = flatten
