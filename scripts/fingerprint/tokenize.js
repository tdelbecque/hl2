const hlm=require ('../network/loadHL')
const dm = require ('./digest')

tokenize = (l, outputFun) =>
    ` ${l} `.
    replace (/\s+/g, ' ').
    replace (/\.{3}/g, '\n...\n').
    replace (/[,;:@#\$%&!?"]/g, '\n$&\n').
    replace (/([^.])([.])([])}>"']*\)\s*$/g, '$1\n$2$3\n').
    replace (/[][(){}<>]/g, '\n$&\n').
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
    replace (/FP(\d+)PF/g, (x, i) =>outputFun (i)).
    split (/\n/)

const defaultHLFile = '../../data/in/HL/SD_PII_Highlights.tsv'
const defaultPathToFPDir = process.env.HLDATADIR + '/FP'

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
		if (hl.slice (tag.TextOffset, tag.TextEnd) !== tag.Text) {
		    let err = `ERROR ${pii}\t${i}: expected (${tag.Text}) found (${hl.slice (cursor, tag.TextOffset)})`
		    throw (err)
		}
		if (tag.TextOffset > cursor) slices.push (hl.slice (cursor, tag.TextOffset))
		slices.push (tag.Thesaurus.match (/^Idiom/) ? tag.Text : `FP${i}PF`)
		cursor = tag.TextEnd
	    })
	    if (hl.length > cursor) slices.push (hl.slice (cursor))
	    let outputNthTag = d => {
		const tag = tags [d]
		const term = tag.Text
		const postag = term.match (/s$/) ? 'NNS' : 'NN'
		const lemma = `OmniConceptID_${tag.ConceptID}`
		return `${term}\t${postag}\t${lemma}`
	    }
	    let simplehl = slices.join ('').split (/\s*\u2022\s*/).
		map (x => x.trim ()).
		filter (l => l.length > 0).
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
