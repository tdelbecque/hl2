const fs = require ('fs')

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
				   console.error (this.data.length)
				   this.data.lookFor = lookFor
				   resolve (undefined)}
			       catch (err) {reject (err)}})}
	catch (err) {console.error ('arg');reject (err)}})

    this.test = () => this.load ().then (x => console.log ('ok'), err => console.error (err))

    this.lookFor = (k, v) => this.data.lookFor (k, v)
}


F.test = () => new F ().test ()
module.exports=F
