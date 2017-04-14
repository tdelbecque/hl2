const A = require ('../utils/async')
const U = require ('../utils/utils')
const XP = require ('xpath')
const Parser = require ('xmldom').DOMParser

//const file = process.env.HLDATADIR + '/out/pages-xml/S037596011730292X.xml'

textContent = x => x.textContent
select = (name, ns, doc) => XP.
    select (`//*[local-name()='${name}' and namespace-uri()='${ns}']`,
	   doc).
    map (textContent) 
    
const ns_dc = "http://purl.org/dc/elements/1.1/"
const ns_prism = "http://prismstandard.org/namespaces/basic/2.0/"
const ns_xocs = "http://www.elsevier.com/xml/xocs/dtd"

const getPII = doc => {
    const p = XP.select ("//*[local-name()='pii']", doc) [0].textContent
    return p.replace (/[^a-zA-Z0-9]/g, '')
}

const getAuthors = doc => select ('creator', ns_dc, doc).join (' ')
const getTitle = doc => select ('title', ns_dc, doc).join ('')
const getISSN = doc => select ('issn', ns_prism, doc).join ('')
const getPubTime = doc => select ('coverDate', ns_prism, doc).join ('')
const getFirstPage = doc => select ('first-page', ns_xocs, doc).join ('')
const getLastPage = doc => select ('last-page', ns_xocs, doc).join ('')
const getVolume = doc => select ('vol-iss-suppl-text', ns_xocs, doc).join ('')
const getAbstract = doc => select ('description', ns_dc, doc).join ('')

async function output (x) {
    return new Promise ((resolve, reject) => {
	U.say (JSON.stringify (x))
	resolve (undefined)
    })
}

async function extract (file) {
    try {
	const data = await A.readFile (file)
	const doc = new Parser ().parseFromString (data)
	return ({
	    PII: getPII (doc),
	    Title: getTitle (doc),
	    ISSN: getISSN (doc),
	    Authors: getAuthors (doc),
	    Volume: getVolume (doc),
	    PubTime: getPubTime (doc),
	    Pages: `${getFirstPage (doc)}-${getLastPage (doc)}`,
	    Abstract: getAbstract (doc)})
    }
    catch (err) { U.croak (err) }
    
}

//main = () => getPaperFeatures (file)

exports.extract = extract
