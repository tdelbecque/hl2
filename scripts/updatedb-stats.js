const clone = require ('clone')
const FS = require ('./utils/fs')
const U = require ("./utils/utils")
const A = require ("./utils/async")
const PG = require ("./utils/pg")

const predicatesDir = process.env.HLDATADIR + '/out/predicates'
const tableName = 'hlstatistics'

function isNoun (fields) {
    var t = fields [1]
    return (t === "NN") || (t === "NNS") ||
	(t === "NP") || (t ===  "NPS")
}

function isVerb (fields) {
    var t = fields [1]
    return (t === "VB") || (t === "VBD") || (t === "VBG") || (t === "VBN") ||
	(t === "VBP") || (t === "VBZ")
}

function isVerbStrong (fields) {
    var t = fields [1]
    var l = fields [2]
    var b = (t === "VB") || (t === "VBD") || (t === "VBG") || (t === "VBN") ||
	(t === "VBP") || (t === "VBZ")
    return b && (l !== "be") && (l !== "have")
}

class Process {
    constructor () {
	this.Q = []
	this.S = {}
	this.client = new PG ('postgres://cg:cg@localhost/cg')
	this.canClose = false
	this.looping = false
    }

    async init () {
	try {
	    await this.client.connect ()
	}
	catch (err) {
	    U.croak (`cannot open connection : ${err}`)
	    throw 'Cannot connect'
	}
	try {
	    let c = await this.client.query (`select PII, HLNO from ${tableName}`)
	    this.dic = c.rows.reduce ((a, b) => a.add (`${b.pii} ${b.hlno}`), new Set ())
	}
	catch (err) {
	    U.croak (`Error while loading dictionary : ${err}`)
	    throw 'Cannot load'
	}
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
	    //console.error (`${e.pii}\t${e.hlno}\t${e.nTokens}\t${e.nNouns}\t${e.nVerbs}\t${e.nVerbsStrong}\t${e.tokens.join (" ")}`)
	    let k = `${e.pii} ${e.hlno}`
	    if (! this.dic.has (k)) {
		let hl = e.tokens.join (" ").replace (/\'/g, "''")
		const q = `insert into ${tableName} values ('${e.pii}', '${e.hlno}', '${hl}')`
		try {
		    await this.client.query (q)
		    this.dic.add (k)
		} catch (err) {
		    U.croak (q)
		    throw (err)
		}
	    }
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
		S.nNouns = 0
		S.nSub = 0
		S.nPred = 0
		S.nObj = 0
		S.nUnk = 0
		S.tokens = []
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
	    if (isNoun (fields)) S.nNouns ++
	    if (isVerb (fields)) S.nVerbs ++
	    if (isVerbStrong (fields)) S.nVerbsStrong ++
	    if (fields [4] == 'sub') S.nSub ++
	    else if (fields [4] == 'pred') S.nPred ++
	    else if (fields [4] == 'obj') S.nObj ++
	    else S.nUnk ++
	})
	if (Q.length && ! this.looping) this.loop ().catch (err => U.croak (err))
     }
    
    close () {
	if (! this.looping) this.client.end ()
	this.canClose = true
    }
   
}

async function main () {
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
	p.close ()
    }
    
}

main ().catch (err => U.croak (err))
 
