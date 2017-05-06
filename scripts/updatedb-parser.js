const U = require ('./utils/utils')
const PG = require ('./utils/pg')
const A = require ('./utils/async')
const FS = require ('./utils/fs')

const predicatesDir = process.env.HLDATADIR + '/out/predicates'
const tableName = 'parsing'

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
	    let c = await this.client.query (`select PII from ${tableName}`)
	    this.dic = c.rows.reduce ((a, b) => a.add (b.pii), new Set ())
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
	    if (! this.dic.has (e.pii)) {
		let data = e.data.join("\n").replace (/\'/g, "''")
		this.dic.add (e.pii)
		const q = `insert into ${tableName} values ('${e.pii}', '${data}')`
		try {
		    await this.client.query (q)
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
		if (S.pii && S.data.length) Q.push ({pii: S.pii, data: S.data})
		S.pii = m [1]
		S.data = []
	    } else {
		if (x.match (/^<\/PAPER>$/)) {
		    Q.push ({pii: S.pii, data: S.data})
		    S.pii = null
		    S.data = []
		}
		if (S.pii) S.data.push (x)
	    }
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
    
