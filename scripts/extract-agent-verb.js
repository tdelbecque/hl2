const CLA = require("command-line-args")
const U = require ('./utils/utils')
const PG = require ('./utils/pg')
const A = require ('./utils/async')
const FS = require ('./utils/fs')
const E = require ('./network/extractPaperFeatures.js')

const claOptions = [
    {name: "dir", type: String, defaultValue: "."},
    {name: "fregex", type: String, defaultValue: "\\.xml$"},
    {name: "dryrun", type: Boolean}
]

async function fun (f) {
    let x = await E.extract (f, ["PII", "Abstract"])
    if (x.Abstract) {
	var ms = x.Abstract.match (/([^\s]+-[a-z]+e(d|n))\b/g)
	if (ms) {
	    for (m of ms) console.log (`${x.PII}\t${m}`)
	}
    }
}

async function main () {
    const options = CLA (claOptions)
    const re = new RegExp (options.fregex)
    const files = (await A.lsdir (options.dir)).
	  filter (x => x.match (re)).
	  map (x => `${options.dir}/${x}`)
    for (const f of files) await fun (f)
}

main ()
