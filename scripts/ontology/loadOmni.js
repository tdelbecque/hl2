const fs = require ('fs')
const utils = require ('../utils/utils')
const sayOk = utils.sayOk
const croakFail = utils.croak

const mkpath = name => `${process.env.HLDATADIR}/omniscience/${name}`
const ExpectedFieldsNb = 7
const assertFieldsNb = (xs, lineno) =>
      {if (xs.length !== ExpectedFieldsNb) throw `Unexpected field number on line ${lineno} : (${xs.join ('\t')})`}

const createObjectFor = (fields, values) =>
      fields.reduce ((a, b, i) => Object.assign (a, {[b]: values [i]}), {})

function lookFor (k, v) {
    const r = this.filter (typeof v === 'function' ? v (x [k]) : x => x [k] === v)
    r.lookFor = lookFor
    return r
}
function F () {
    this.data = undefined
    this.fields = undefined

    this.load = path => new Promise ((resolve, reject) => {
	try { fs.readFile (mkpath ('OmniPROD01_17_02.csv'),
			   {encoding: 'utf8'},
			   (err, data) => {
			       try {
				   if (err) throw (err)
				   var lines = data.
				       replace (/^.*?"/, '').
				       replace (/","/g, '\t').
				       split (/[\n\r]+/).
				       filter (l => l.length > 0).
				       map (x => x.replace (/^"|"$/g, ""))
				   this.fields = lines.
				       shift ().
				       split (/\t/)
				   assertFieldsNb (this.fields, 1)
				   this.data = lines.map ((l, i) => {
				       const xs = l.split (/\t/)
				       assertFieldsNb (xs, i + 1)
				       return createObjectFor (this.fields, xs)
				   })
				   this.data.lookFor = lookFor
				   resolve (undefined)}
			       catch (err) {reject (err)}})}
	catch (err) {console.error ('arg');reject (err)}})

    this.test = () => this.load ().then (sayOk, croakFail)

    this.lookFor = (k, v) => this.data.lookFor (k + 0 === k ? this.fields[k] : k, v)

    this.lookForRelationType = (k, r) => this.lookFor ('Key UID', k).lookFor ('Relationship Type', r)
    this.prefLabel = k => this.lookForRelationType (k, 'prefLabel')
    this.isPreflabelFor = k => this.lookForRelationType (k, 'prefLabelFor')
    this.moreGeneral = k => this.lookForRelationType (k, 'BT')
    this.moreSpecific = k => this.lookForRelationType (k, 'NT')
    this.dumpLabels = () => {
	for (let s of f.lookFor ('Relationship Type', 'prefLabelFor').
		 reduce ((a, b) => a.add (`${b ['Key UID']}\t${b ['Key Descriptor']}`), new Set ()))
	    console.log (s)
    }
	
}


F.test = () => new F ().test ()
F.help = () => {
    console.log ('This module loads an ontology.')
    console.log ('const m=require ("./loadOmni")')
    console.log ('m.test () // just a run')
    console.log ('const f = new m ()')
    console.log ('f.load () // => a promise; TODO: take the path into account !')
    console.log ('f.dumpLabels')
    console.log ('')
}
module.exports=F

