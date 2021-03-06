const hlm=require ('../network/loadHL')
//const dm = require ('./digest')
const dm = require ('./digest-delimited')
const fs = require ('fs')
const u = require ('../utils/utils')

const croak = u.croak

tokenize = (l, outputFun) =>
    ` ${l}. `.
    replace (/\s+/g, ' ').
    replace (/[!?,;:. ]+$/, '. ').   // force an unique dot at the end
    replace (/\.{3}/g, '\n...\n').
    replace (/[,;:@#\$%&!?"‘’]/g, '\n$&\n').
    replace (/([^.])([.])([\]\)}>"']*)\s*$/g, '$1\n$2$3\n').
    replace (/[\]\[\(\){}<>]/g, '\n$&\n').
    replace (/--/g, '\n--\n').
    replace (/([^'])'\s+/g, "$1\n'\n").
    replace (/'([sSmMdD])\s+/g, "\n'$1\n").
    replace (/'(ll|re|ve)\s+/gi, "\n'$1\n").
    replace (/(n't)\s+/gi, '\n$1\n').
    replace (/\s+(can)(not)\s+/gi, '\n$1\n$2\n').
    replace (/^\s+/, '').
    replace (/\s+$/, '').
    replace (/\s+/g, '\n').
    replace (/\n+/g, '\n').
    replace (/\n([^a-zA-Z])(.+)(ing)\n/i, "\n$1$2$3\tVVG\n").
    replace (/FP(\d+)PF/g, (x, i) =>outputFun (i)).
    split (/\n/)

const defaultHLFile = '../../data/in/HL/SD_PII_Highlights.tsv'
const defaultPathToFPDir = dm.defaultPathToFPDir

function F (pathToFPDir = defaultPathToFPDir) {
    this.JOIN = new Map ()

    this.set = (k, v) => this.JOIN.set (k, v)
    this.get = k => this.JOIN.get (k)
    this.entries = () => this.JOIN.entries ()
    this.clear = () => this.JOIN.clear ()
    
    this.load = (hlfile=defaultHLFile) => new Promise ((resolve, reject) => {   
	const f = new dm ()
	f.load (pathToFPDir).
	    then (() => hlm.loadMap (hlfile)).
	    then (x => {
		Object.keys(x).forEach (pii => 
		    this.set (pii ,[x [pii], f.dict [pii] || []]))
		resolve (undefined)}).
	    catch (reject)
    })
    
    this.verify = () => {
	for (let [pii, [hl, fps]] of this.entries ()) {
	    fps.forEach (x => {
		console.log (`(${x.Text})\t(${hl.slice (x.TextOffset, x.TextEnd)})`)
	    })
	}
    }

    this.tokenize = () => {
	
	for (let [pii, [hl, tags]] of this.entries ()) {
	    let slices = []
	    let cursor = 0
	    tags.forEach ((tag, i) => {
		try {
		    if (tag.TextOffset < cursor) return
		    if (hl.slice (tag.TextOffset, tag.TextEnd) !== tag.Text) {
			let err = `ERROR ${pii}\t${i}: expected (${tag.Text}) found (${hl.slice (tag.TextOffset, tag.TextEnd)})\n` +
			    `cursor = ${cursor}\n` +
			    `tag = ${JSON.stringify(tag)}\nhl = ${hl}`
			throw (err)
		    }
		    if (tag.TextOffset > cursor)
			slices.push (hl.slice (cursor, tag.TextOffset))
		    /* 
		       tags are ordered by increasing TextOffset and then decreasing TextEnd 
		       It occurs sometime that more than one tag is attributed to a given TextOffset.
		       We cope with this situation by insuring that the current tag.TextOffset value 
		       is not less than the current cursor value.
		    */
		    if (tag.TextOffset >= cursor)
			slices.push ((tag.Thesaurus !== undefined) && tag.Thesaurus.match (/^Idiom/) ?
				     tag.Text : ` FP${i}PF `)
		    cursor = tag.TextEnd
		} catch (err) {u.croak (err)} })
	    if (hl.length > cursor) slices.push (hl.slice (cursor))
	    let outputNthTag = d => {
		const tag = tags [d]
		const term = tag.Text
		const postag = term.match (/s$/) ? 'NNS' : 'NN'
		const lemma = `OmniConceptID_${tag.ConceptID}`
		return `${term} ${lemma}\t${postag}`
	    }

	    let simplehl = slices.join ('').split (/\s*\u2022\s*/).
		map (x => x.trim ()).
		filter (l => l.length > 0).
		// make sure the ending dot, otherwise the chunker may badly behave.
		map (l => l.match (/\.$/) ? l : `${l}.`).
		map (l => tokenize (l, outputNthTag))
	    
	    this.set (pii, this.get (pii).concat ([simplehl]))
	}
    }
    this.output = path => {
	const fd = path ? fs.openSync (path, 'w') : process.stdout.fd
	const println = s => fs.writeSync (fd, s + '\n')
	const printhl = xs => {
	    println ('<HL>')
	    xs.forEach (println)
	    println ('</HL>')
	}
	
	for (let [pii, [hl, tags, tokens]] of this.entries ()) {
	    println (`<PAPER PII="${pii}">`)
	    tokens.forEach (printhl)
	    fs.writeSync (fd, '</PAPER>\n')
	}

	if (fd !== process.stdout.fd) fs.closeSync (fd)
    }
}

module.exports = F
