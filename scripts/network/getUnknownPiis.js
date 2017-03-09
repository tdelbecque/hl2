const fs = require ('fs')

const dirKnown = process.argv [2]
const dirCandidates = process.argv [3]

if ((dirKnown === undefined) || (dirCandidates === undefined)) {
    process.stderr.write ("\nusage: node " +
			  __filename.replace (process.cwd(), '.') + 
			  " (source dir of knowns piis up to new)" +
			  " (source dir of new piis)\n")
    process.exit (1)
}

const println = x => process.stdout.write (x + '\n')

function F (dicIn, dir) {
    const files = fs.readdirSync (dir)

    return Promise.all (files.map (f => new Promise ( (resolve, reject) => {
	const fn = dir + '/' + f
	const s = fs.createReadStream (fn, {encoding:'utf8'})
	var data = ''
	var dicOut = {}
	
	fun = l => {const xs = l.match (/(S(?:X|\d){16})/g)
		    xs && xs.forEach (x => dicIn [x] || (dicOut [x] = 1))}
	
	s.on ('data',
	      d => {const lines = (data + d).split (/\r?\n/)
		    data = lines.pop ()
		    lines.forEach (fun)})
	      
	s.on ('end', () => {fun (data); resolve (dicOut)})
    }))).then (xs => xs.reduce ((a, b) => Object.assign (a, b), {}))
}

F ({}, dirKnown).
    then (dic => F (dic, dirCandidates)).
    then (dic => Object.keys (dic).forEach (println)).
    catch (e => process.stderr.write (e + "\n"))

