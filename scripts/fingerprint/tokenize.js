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

function F () {
    this.JOIN = new Map ()

    this.set = (k, v) => this.JOIN.set (k, v)
    this.get = k => this.JOIN.get (k)
    this.entries = () => this.JOIN.entries ()
    
    this.load = (hlfile=defaultHLFile) => new Promise ((resolve, reject) => {   
	const f = new dm ()
	f.load ().
	    then (() => hlm.loadMap (hlfile)).
	    then (x => {
		Object.keys(x).forEach (pii => {
		    const e = f.dict [pii]
		    if (e) this.set (pii ,[x [pii], e])})
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
		const lemma = `OmniTermID_${tag.TermID}`
		return `${term}\t${postag}\t${lemma}`
	    }
	    let simplehl = slices.join ('').split (/\s*\u2022\s*/).
		map (x => x.trim ()).
		filter (l => l.length > 0).
		map (l => tokenize (l, outputNthTag))
	    
	    this.set (pii, this.get (pii).concat ([simplehl]))
	}
    }
}

module.exports = F
