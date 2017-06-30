const CLA = require("command-line-args")
const E = require ('../network/extractPaperFeatures.js')
const fs = require ('fs')
const U = require ('../utils/utils')
const A = require ('../utils/async')

const claOptions = [
    {name: "dir", type: String, defaultValue: "."},
    {name: "fregex", type: String, defaultValue: "\\.xml$"},
    {name: "dryrun", type: Boolean}
]

async function fun (f) {
    let x = await E.extract (f, E.idToExtract)
    console.log (`${x.PII}\t${x.DOI}\t${x.PMID}\t${x.EID}`)
}

function dryRun (f) {
    console.log (f)
}

async function main () {
    const options = CLA (claOptions)
    const re = new RegExp (options.fregex)
    const files = (await A.lsdir (options.dir)).
	  filter (x => x.match (re)).
	  map (x => `${options.dir}/${x}`)
    if (options.dryrun)
	for (const f of files) dryRun (f)
    else
	for (const f of files) await fun (f)
}

main ()
