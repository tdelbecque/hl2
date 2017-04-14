const fs = require ('../utils/fs')
const A = require ('../utils/async')
const U = require ('../utils/utils')

const Features = ['PII', 'ConceptID', 'TermID', 'TermType', 'Text', 'TextEnd', 'TextOffset']

const baseDirectory = process.env.HLDATADIR + '/FP/'

class Loader {
    constructor () {
	this.dict = {}
	this.lineNo = 0
	this.delimiter = '\t'
    }
    
    async addLinesAsync (lines) {
	if (this.lineNo === 0) {
	    const firstLine = lines.shift ()
	    this.fields = firstLine.split (this.delimiter)
	    const fieldSet = this.fields.
		  reduce ((s, f) => s.add (f), new Set ())
	    U.assert (Features.every (f => fieldSet.has (f)), 'Bad header')
	    this.lineNo ++
	}
	lines.
	    map (l => l.split (this.delimiter).
		   reduce ((o, v, i) => Object.assign (o, {[this.fields[i]]: v}), {})).
	    forEach (x => {
		const pii = x.PII
		delete x.PII
		const tags = this.dict [pii]
		if (! tags) this.dict [pii] = [x]
		else tags.push (x)
		this.lineNo ++
	    })
	return false
    }
    
    async doEntry (fn) {
	if (! (await A.lstat (fn)).isFile ()) return false
	const n = await fs.readLines (fn, this)
	return true
    }
    
    async load (directory = 'core') {
	const fullDirectory = baseDirectory + directory
	await A.assertDirectory (fullDirectory)
	const dirEntries = await A.lsdir (baseDirectory + directory)
	const x = dirEntries.map (e => this.doEntry (fullDirectory + '/' + e))
	await Promise.all (x)
    }
    
}

module.exports = Loader
exports.defaultHLFile = 'core'
