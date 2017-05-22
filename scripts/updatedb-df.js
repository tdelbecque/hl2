const clone = require ('clone')
const FS = require ('./utils/fs')
const U = require ("./utils/utils")
const A = require ("./utils/async")

const predicatesDir = process.env.HLDATADIR + '/out/predicates'

function isNoun (fields) {
    var t = fields [1]
    return (t === "NN") || (t === "NNS") ||
	(t === "NP") || (t ===  "NPS")
}

class Process {
    constructor () {
	this.Q = []
	this.S = {}
	this.looping = false
    }

    async init () {
    }
    
    async processDir () {
	const files = (await A.lsdir (predicatesDir)).
	      filter (x => x.match (/.tagged$/)).
	      map (x => `${predicatesDir}/${x}`)
	for (const f of files) {
	    U.croak (f)
	    await FS.readLines (f, this)
	}
    }

    async loop () {
	this.looping = true
	while (this.Q.length) {
	    let e = this.Q.shift ()
	    U.tabulate (e.lemmas.map (x => [x]), 0).forEach (
		((n,l) => console.log (`${e.pii}\t${e.hlno}\t${l}\t${n}`)))
	}
	this.looping = false
    }
    
    async addLinesAsync (xs, file) {
	var Q = this.Q
	var S = this.S [file]
	if (! S) S = this.S [file] = {}
	xs.forEach (x => {
	    var m = x.match (/^<PAPER PII="(S(?:X|\d){16})">$/)
	    if (m) {
		S.pii = m [1]
		S.hlno = 0
		return
	    } 
	    if (x.match (/^<HL/)) {
		S.hlno ++
		S.lemmas = []
		return
	    }
	    if (x.match (/^<\/HL/)) {
		Q.push (clone (S))
		return
	    }
	    if (x.match (/^<\/PAPER/)) {
		S.pii = undefined
		return
	    }
	    
	    var fields = x.split ("\t")
	    if (fields.length != 5) return
	    if (isNoun (fields)) {
		S.lemmas.push (fields [2])
	    }
	})
	if (Q.length && ! this.looping) this.loop ().catch (err => U.croak (err))
     }
   
}

async function main () {
    var header = "pii\thlno\tlemma\tn"
    console.log (header)
    const p = new Process ()
    try {
	await p.init ()
	await p.processDir ()
    }
    catch (err) {
	U.croak ('Failed ' + err)
    }
    finally {
	U.croak ('FINALLY')
    }
    
}

main ().catch (err => U.croak (err))
 
