const m = require ('./loadOmni')
const u = require ('../utils/utils')

const defor = u.definedOr
const croak = u.croak

function F () {
    this.prefLabelForMap = new Map ()
    this.isPrefLabelForMap = new Map ()
    this.generalForMap = new Map ()
    this.specificForMap = new Map ()

    this.omni = new m ()

    this.load = () => new Promise ((resolve, reject) => {
	let addLabelRelation = (objUID, labUID, label) => {
	    this.prefLabelForMap.set (objUID, {UID: labUID, label: label})
	    const forCol = defor (this.isPrefLabelForMap.get (label), {UID: labUID, for: new Set ()})
	    forCol.for.add (objUID)
	    this.isPrefLabelForMap.set (label, forCol)
	}
	let addHierarchyRelation = (bottomUID, topUID) => {
	    this.generalForMap.set (bottomUID,
				    defor (this.generalForMap.get (bottomUID), new Set ()).add (topUID))
	    this.specificForMap.set (topUID,
				    defor (this.specificForMap.get (topUID), new Set ()).add (bottomUID))
	}
	let fswitch = u.fswitch ({
	    prefLabel: x => addLabelRelation (x ['Key UID'], x ['Related UID'], x ['Related Descriptor']),
	    prefLabelFor: x => addLabelRelation (x ['Related UID'], x ['Key UID'], x ['Key Descriptor']),
	    BT: x => addHierarchyRelation (x ['Key UID'], x ['Related UID']),
	    NT: x => addHierarchyRelation (x ['Related UID'], x ['Key UID']),
	    "_" : _ => undefined })

	this.omni.load ().then (
	    x => {
		try {
		    this.omni.data.forEach (x => fswitch [x ['Relationship Type']] (x))
		    resolve (x)
		}
		catch (err) {reject (err)}
	    },
	    reject)
    })
}

const setToArray = s => {
    var xs = []
    for (let i of s) xs.push (i)
    return xs
}

const mapToObject = m => {
    var o = {}
    for (let [k, v] of m.entries ()) o [k] = v
    return o
}

Set.prototype.toString = function () {
    return JSON.stringify (setToArray (this))
}
Map.prototype.toString = function () {
    return JSON.stringify (mapToObject (this))
}

F.test = () => {
    var f = new F ()
    f.load ().then (() => {
	for (let [k, v] of f.prefLabelForMap) console.log (`prefLabelForMap\t${k}\t${v}`)
	for (let [k, v] of f.isPrefLabelForMap) console.log (`isPrefLabelForMap\t${k}\t${v}`)
	for (let [k, v] of f.generalForMap) console.log (`generalForMap\t${k}\t${v}`)
	for (let [k, v] of f.specificForMap) console.log (`specificForMap\t${k}\t${v}`)
    }, croak)
}
module.exports = F


/*
f.load ().then (_ => {
    f.lookFor ('Relationship Type', 'BT').
	forEach (x => delete x.Depth)

    let fun = (xs) => {
	xs.forEach (x => {
	    console.error (x['Key UID'])
	    if (x.Depth === undefined) {
		let xs = f.moreGeneral (x ['Key UID'])
		fun (xs)
		x.Depth = xs.reduce (Math.max, 0)
	    } 
	})}
    
    fun (f.data)
    console.log (JSON.stringify (f.data, null, 2))
}).catch (u.croak)
*/
