var omni = require ("./loadOmni");
var finger = require ('../fingerprint/digest')

var f = new omni ()
var g = new finger ()

Promise.all ([f.load (), g.load ()]).then (
    xs => {
	const concepts = new Set ()
	const FPConcepts = new Map ()
	f.data.forEach (x => concepts.add (x ['Key UID']))
	Object.keys (g.dict).forEach (
	    x => g.dict [x].forEach (x => FPConcepts.set (x.ConceptID, `(${x.TermType})\t(${x.Text})\t(${x.Thesaurus})`)))
	for (let  [k, v] of FPConcepts.entries ()) console.log (`${k}\t${v}\t${concepts.has(k) ? 'FOUND' : 'NOT'}`)
			    
    }
).catch (err => console.error (err))

    
