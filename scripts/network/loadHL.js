loadMap = file => new Promise (
    (resolve, reject) => {
	const hls = {}
	var data = ''

	try {
	    const s = require ('fs').
		  createReadStream (file, {encoding:'utf8'})

	    record = d => {
		if (d) {
		    var m = d.match (/(.+)\t(.+)/)
		    if (m) hls [m[1]] = m[2]
		}
	    }
	    
	    s.on ('data',
		  d => {const lines = (data + d).split (/\r?\n/)
			data = lines.pop ()
			lines.forEach (record)})    
	    
	    s.on ('end', () => {
		record (data)
		resolve (hls)
	    })
	}
	catch (e) {
	    reject (e)
	}
    })

exports.loadMap = loadMap
