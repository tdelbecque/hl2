const clone = require ('clone')
const FS = require ('../../scripts/utils/fs')
const U = require ("../../scripts/utils/utils")
const A = require ("../../scripts/utils/async")

const predicatesDir = 'predicates'

function isNoun (fields) {
    var t = fields [1]
    return (t === "NN") || (t === "NNS") ||
	(t === "NP") || (t ===  "NPS")
}

function isConcept (fields) {
    return isNoun (fields) && fields [2].startsWith ("OmniConcept")
}

function isVerb (fields) {
    var t = fields [1]
    return (t === "VB") ||
	(t === "VBD") ||
	(t === "VBG") ||
	(t === "VBN") ||
	(t === "VBP") ||
	(t === "VBZ")
}

function isVerbStrong (fields) {
    var t = fields [1]
    var l = fields [2]
    var b = (t === "VBD") || (t === "VBN") ||
	(t === "VBP") || (t === "VBZ")
    return b && (l !== "be") && (l !== "have")
}

function isVerbUnknown (fields) {
    return isVerb (fields) && fields [4] === "unk"
}

class Process {
    constructor () {
	this.Q = []
	this.S = {}
	this.canClose = false
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

    async loopPrint () {
	this.looping = true
	while (this.Q.length) {
	    let e = this.Q.shift ()
	    let hl = e.tokens.join (" ").replace (/\'/g, "''")
	    let q = []
	    q.push (e.pii)
	    q.push (e.hlno)
	    q.push (e.nTokens)
	    q.push (e.nSub)
	    q.push (e.nPred)
	    q.push (e.nObj)
	    q.push (e.nUnk)
	    q.push (e.nNouns)
	    q.push (e.nConcepts)
	    q.push (Object.keys (e.concepts).length)
	    q.push (e.nVerbs)
	    q.push (e.nVerbsStrong)
	    q.push (e.nVerbsUnknown)
	    q.push (hl)
	    console.log (q.join ("\t"))
	}
	if (this.canClose) this.client.end ()
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
		S.nTokens = 0
		S.nVerbs = 0
		S.nVerbsStrong = 0
		S.nVerbsUnknown = 0
		S.nNouns = 0
		S.nConcepts = 0
		S.nSub = 0
		S.nPred = 0
		S.nObj = 0
		S.nUnk = 0
		S.concepts = {}
		S.tokens = []
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
	    S.tokens.push (fields [0])
	    S.nTokens ++
	    if (isNoun (fields)) {
		S.nNouns ++
		S.lemmas.push (fields [2])
	    }
	    if (isConcept (fields)) {
		S.nConcepts ++
		S.concepts [fields [2]] = 1
	    }
	    if (isVerb (fields)) S.nVerbs ++
	    if (isVerbUnknown (fields)) S.nVerbsUnknown ++
	    if (isVerbStrong (fields)) S.nVerbsStrong ++
	    if (fields [4] == 'sub') S.nSub ++
	    else if (fields [4] == 'pred') S.nPred ++
	    else if (fields [4] == 'obj') S.nObj ++
	    else S.nUnk ++
	})
	if (Q.length && ! this.looping) this.loopPrint ().catch (err => U.croak (err))
     }
    
    close () {
	this.canClose = true
    }
   
}

async function main () {
    var header = "pii\thlno\tntokens\tnsub\tnpred\tnobj\tnunk\tnnouns\tnconcepts\tndistinctconc\tnverbs\tnverbsstrong\tnverbsunknown\thl"
    console.log (header)
    const p = new Process ()
    try {
	//await p.init ()
	await p.processDir ()
    }
    catch (err) {
	U.croak ('Failed ' + err)
    }
    finally {
	U.croak ('FINALLY')
	p.close ()
    }
    
}

main ().catch (err => U.croak (err))
 
