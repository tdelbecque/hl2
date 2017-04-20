const U = require ('./utils/utils')
const PG = require ('./utils/pg')
const A = require ('./utils/async')
const FS = require ('./utils/fs')

const pagesContentDir = process.env.HLDATADIR + "/out/www-resources"
const tableName = 'xml_hl'

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
	    U.croak (`Cannot open connection : ${err}`)
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
	const files = (await A.lsdir (pagesContentDir)).
	      filter (x => x.match (/\.xml$/)).
	      map (x => `${pagesContentDir}/${x}`)
	for (const f of files) {
	    U.croak (f)
	    await FS.readLines (f, this)
	}
    }

    async loop () {
	this.looping = true
	while (this.Q.length) {
	    var l = this.Q.shift ()
	    // Unicode line separator is making trouble.
	    // One way to get rid of it is:
	    // const u = require ('utf8')
	    // var r = new RegExp (u.decode ("\xe2\x80\xa8"), 'g')
	    // x = x.replace (r, " ")
	    //
	    // but a simpler way is the following:
	    // x = x.replace (/\u2028/g, " ")
	    const m = l.match (/^(S(?:X|\d){16})\t(<div(?:.|\u2028)+div>)$/)
	    if (m && ! this.dic.has (m [1])) {
		this.dic.add (m [1])
		const q = `insert into ${tableName} values ('${m[1]}', '${m[2].replace (/\'/g, "''")}')`
	        await this.client.query (q)
	    }
	}
	if (this.canClose) this.client.close ()
	this.looping = false
    }
    

    async addLinesAsync (xs) {
	var Q = this.Q
	xs.forEach (x => Q.push(x))
	this.Q.concat (xs)
	if (! this.looping) this.loop ()
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

main ()


