var omni = require ("./loadOmni");
var finger = require ('../fingerprint/digest')

var f = new omni ()
var g = new finger ()

Promise.all ([f.load (), g.load ()]).then (
    xs => {
	const concepts = new Set ()
	const FPConcepts = new Set ()
	f.data.forEach (x => concepts.add (x ['Key UID']))
	Object.keys (g.dict).forEach (
	    x => g.dict [x].forEach (x => FPConcepts.add (x ['ConceptID'])))
	FPConcepts.forEach (x => console.log (`${x}\t${concepts.has(x) ? 'FOUND' : 'NOT'}`))
			    
    }
)
