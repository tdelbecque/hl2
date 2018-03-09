const PG = require ('./utils/pg')
const U = require ('./utils/utils')
const M = require ('./network/extractPaperFeatures.js')
const A = require ('./utils/async')
const client = new PG ('postgres://cg:cg@localhost/cg')

const pagesContentDir = process.env.HLDATADIR + "/out/pages-xml"
const tableName = 'articles'

function listen (dic) {
    const doLine = l => {
	try {
	    const x = JSON.parse (l)
	    if (dic.has (x.PII))
		U.croak ('FOUND')
	    else
		U.croak ('NOT FOUND')
	}
	catch (err) {
	    U.croak (err)
	}
    }
    var str = '';
    process.stdin.on ('data', d => {
	const lines = (str + d.toString ('utf8')).split (/\r?\n/)
	str = lines.pop ()
	lines.forEach (doLine)
    })
    process.stdin.on ('end', d => {
	if (str !== '') doLine (str)
    })
}

async function insert () {
    return Promise.Resolve (1)
}

const e = x => x.replace (/'/g, "''")

async function main () {
    try {
	await client.connect ()
	console.log ('connect')
	let c = await client.query ("select PII from articles")
	const dic = c.rows.reduce ((a, b) => a.add (b.pii), new Set ())

	const filesToInsert = (await A.lsdir (pagesContentDir)).
	      map (x => {
		  var m = x.match (/S(X|\d){16}/)
		  return m === null ? undefined : m [0]
	      }).
	      filter (U.identity).
	      filter (x => ! dic.has (x)).
	      map (x => `${pagesContentDir}/${x}.xml`)
	for (const file of filesToInsert) {
    		const f = await M.extract (file)
		if (f === undefined) continue
	    const q = `insert into ${tableName} values ('${e(f.PII)}', '${e(f.Title)}', '${e(f.ISSN)}', '${e(f.Authors)}', '${e(f.Volume)}', '${e(f.PubTime)}', '${e(f.Pages)}', '${e(f.Abstract)}')`
	    try {
		await client.query (q)
		process.stderr.write ('+')
	    }
	    catch (e) {
		console.error (q)
		throw e
	    }
	}

    }
    catch (err) {
	console.error (err)
    }
    finally {
	client.end ()
    }

}

main ()
