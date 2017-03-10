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

const extractForPii = (pii, doc) => 
    xpath.select ("//*[local-name(.)='Annotation']", doc).map (
	((e, i) => `${pii}\t${i+1}\t${Features.map (f => getFeature (f, e)).join ('\t')}`)
    ).join ('\n')

const extractTermsForFile = file => new Promise ((resolve, reject) => {
    const pii = extractPiiFromPath (file)
    if (! pii) reject (`Cannot extract pii from ${file}`)
    try { fs.readFile (file,
		       {encoding: 'utf8'},
		       (err, data) => {
			   try { if (err) throw (err)
				 const doc = new xmldom.DOMParser ().parseFromString (data)
				 resolve (extractForPii (pii, doc))}
			   catch (err) {reject (err) }})
	} catch (err) {reject (e)}})

const flatten = xs => xs.reduce ((a, b) => {
    if (b === undefined) return a
    return a.concat (Array.isArray (b) ? flatten (b) : [b])}, [])

const browseDirectory = d => new Promise ((resolve, reject) => {
    try { fs.readdir (d,
		      {encoding: 'utf8'},
		      (err, xs) => {
			  try { if (err) throw (err)
				resolve (xs.map (name => {
				    var fullname = `${d}/${name}`
				    var stat = fs.lstatSync (fullname)
				    if (! stat.isDirectory() && stat.isFile () && extractPiiFromPath (name))
					return extractTermsForFile (fullname)
				    else if (stat.isDirectory ()) {
					return browseDirectory (fullname) }}))}
			  catch (err) {reject (err)}})}
    catch (err) {reject (err)}})

const whenErr = console.error
const whenString = console.log

const digest = fun =>
      x => { if (Array.isArray (x)) 
	  flatten (x).forEach (digest (fun))
	     else if (x.then === Promise.prototype.then) 
		 x ['then'] (digest (fun)) ['catch'] (whenErr)
	     else fun (x) }

browseDirectory (process.argv [2] || '/home/thierry/HL/data/FP').
    then (digest (whenString)).
    catch (whenErr)

