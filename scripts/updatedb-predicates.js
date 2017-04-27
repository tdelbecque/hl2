const U = require ('./utils/utils')
const PG = require ('./utils/pg')
const A = require ('./utils/async')
const FS = require ('./utils/fs')

const predicatesDir = process.env.HLDATADIR + "/out/predicates"
const tableName = 'hung_predicates'

class Process {
    constructor () {
	this.Q = []
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
	      filter (x => x.match (/\.hung$/)).
	      map (x => `${predicatesDir}/${x}`)
	for (const f of files) {
	    U.croak (f)
	    await FS.readLines (f, this)
	}
    }

    async loop () {
	this.looping = true
	while (this.Q.length) {
	    let l = this.Q.shift ().replace (/\'/g, "''")
	    let xs = l.split ("\t")
	    if (xs.length)
		while (! xs [0].match (/^S(?:X|\d){16}$/)) xs.shift ()
	    if (xs.length === 3 && ! this.dic.has (xs [0])) {
		this.dic.add (xs [0])
		const q = `insert into ${tableName} values ('${xs[0]}', ${xs[1]}, '${xs[2]}')`
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

    async addLinesAsync (xs) {
	var Q = this.Q
	xs.forEach (x => Q.push (x))
	if (! this.looping) this.loop ().catch (err => U.croak (err))
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

main ().catch( err => U.croak (err)) 
