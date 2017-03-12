const fs = require ('fs')
const xmldom = require ('xmldom')
const xpath = require ('xpath')
const js = require ('./json-utils')

const Features = ['ConceptID', 'TermID', 'TermType', 'Text', 'TextEnd', 'TextOffset', 'Thesaurus']

const getFeature = (f, e) => {
    const p = `.//*[local-name(.)='${f}']`
    return xpath.select (p, e). 
	map (x => x.textContent).join () }

const extractPiiFromPath = path => {
    const m = path.match (/(S(?:X|\d){16})/)
    return m && m [1] }

const extractForPii = (pii, doc, features=Features) => 
      xpath.select ("//*[local-name(.)='Annotation']", doc).map (
	  ((e, i) => `${pii}\t${i+1}\t${features.map (f => getFeature (f, e)).join ('\t')}`)
      ).join ('\n')

const extractObjectsForPii = (pii, doc, features=Features) =>
      ({pii: pii,
	values: xpath.select ("//*[local-name(.)='Annotation']", doc).map (
	    (e, i) => features.reduce ((a, f) => Object.assign (a, {[f]: getFeature (f, e)}),{}))})

const extractTermsForFile = (file, extractor=extractForPii) => new Promise ((resolve, reject) => {
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

const flatten = xs => xs.reduce ((a, b) => {
    if (b === undefined || b === null) return a
    return a.concat (Array.isArray (b) ? flatten (b) : [b])}, [])

const browseDirectory = (d, extractor=extractForPii) => new Promise ((resolve, reject) => {
    try { fs.readdir (d,
		      {encoding: 'utf8'},
		      (err, xs) => {
			  try { if (err) throw (err)
				resolve (xs.map (name => new Promise ((resolve, reject) => {
				    const fullname = `${d}/${name}`
				    const stat = fs.lstat (
					fullname,
					(err, stat) => {
					    try { if (err) throw (err)
						  if (! stat.isDirectory() && stat.isFile () && extractPiiFromPath (name))
						      extractTermsForFile (fullname, extractor).then (resolve).catch(reject)
							  else if (stat.isDirectory ())
							      browseDirectory (fullname,
									       extractor).then (ps => Promise.all (ps)).then (resolve).catch(reject)
										   else resolve (null)}
					    catch (err) {reject (err)}})})))}
			  catch (err) {reject (err)}})}
    catch (err) {reject (err)}})

module.exports = function () {
    const myself = this
    this.dict = {}
   
    this.load = (path='/home/thierry/HL/data/FP') =>
	  browseDirectory (path, extractObjectsForPii).
	  then (ps => Promise.all (ps)).
	  then (xs => flatten (xs).forEach (x => {
	      const pii = x.pii
	      if (pii) { const e = myself.dict [pii]
			 if (! e) myself.dict [pii] = x.values
			 else e.push (x.values)
		       } }))

    this.output = () => {
	console.log (`pii\t${Features.join ('\t')}`)
	Object.keys (myself.dict).forEach (
	    d => 
		console.log (
		    myself.dict [d].map (
			x => `${d}\t${Features.reduce (
			    (a, b) => a.concat ([x [b]]), []).join ('\t')}`).
			join ('\n'))) }
}
