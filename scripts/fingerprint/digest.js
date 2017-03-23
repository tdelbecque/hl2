const fs = require ('fs')
const xmldom = require ('xmldom')
const xpath = require ('xpath')
const u = require ('../utils/utils')
const async = require ('../utils/async')

const Features = ['ConceptID', 'TermID', 'TermType', 'Text', 'TextEnd', 'TextOffset', 'Thesaurus']

const getFeature = (f, e) => {
    const p = `.//*[local-name(.)='${f}']`
    const x = xpath.select (p, e). 
	  map (x => x.textContent).
	  join ()
    return (f === 'TextOffset') || (f === 'TextEnd') ? parseInt(x) : x
}

const extractPiiFromPath = path => {
    const m = path.match (/(S(?:X|\d){16})\.xml$/)
    return m && m [1] }

const extractForPii = (pii, doc, features=Features) => 
      xpath.select ("//*[local-name(.)='Annotation']", doc).map (
	  ((e, i) => `${pii}\t${i+1}\t${features.map (f => getFeature (f, e)).join ('\t')}`)
      ).join ('\n')

const extractObjectsForPii = (pii, doc) =>
      ({pii: pii,
	values:xpath.select ("//*[local-name(.)='Annotation']", doc).
	map ((e, i) => Features.reduce ((a, f) => Object.assign (a, {[f]: getFeature (f, e)}),{})).
	sort ((a,b) => (a.TextOffset - b.TextOffset) || (b.TextEnd - a.TextEnd))})

const extractTermsForFile = (file, extractor=extractObjectsForPii) => new Promise ((resolve, reject) => {
    const pii = extractPiiFromPath (file)
    if (! pii) reject (`Cannot extract pii from ${file}`)
    try { fs.readFile (file,
		       {encoding: 'utf8'},
		       (err, data) => {
			   try { if (err) throw (err)
				 const doc = new xmldom.DOMParser ().parseFromString (data)
				 resolve (extractor (pii, doc))}
			   catch (err) {reject (err) }})
	} catch (err) {reject (e)}})

async function doElt (x) {
    const s = await async.lstat (x)
    if (s.isDirectory ()) return browseDirectory (x)
    if (s.isFile () && extractPiiFromPath (x)) return extractTermsForFile (x)
    return Promise.resolve (undefined)
}
    
async function browseDirectory (d) {
    return Promise.all ((await async.lsdir (d)).map (x => doElt (`${d}/${x}`)))
}

module.exports = function () {
    this.dict = {}

    this.load = async function (path='/home/thierry/HL/data/FP') {
	u.flatten ((await browseDirectory (path))).
	    forEach (x => {
		const pii = x.pii
		if (pii) { if (this.dict [pii]) throw (`Duplicate FP for ${pii}`)
			   this.dict [pii] = x.values
			 } })}

    this.output = () => {
	console.log (`pii\t${Features.join ('\t')}`)
	Object.keys (this.dict).forEach (
	    d => 
		console.log (
		    this.dict [d].map (
			x => `${d}\t${Features.reduce (
			    (a, b) => a.concat ([x [b]]), []).join ('\t')}`).
			join ('\n'))) }
}


