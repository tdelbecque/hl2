const fs = require ('fs')
const U = require ('./utils')

async function readLines (file, handler) {
    return new Promise ((resolve, reject) => {
	var str = '', nbLines = 0, fd
	try {
	    const s = fs.createReadStream (file, {encoding: 'utf8'})
	    s.on ('open', x => fd = x)
	    s.on ('data',
		  async function (d) {
		      const lines = (str + d).split (/\r?\n/)
		      str = lines.pop ()
		      nbLines += lines.length
		      try {
			  const rc = await handler.addLinesAsync (lines, file)
			  if (rc) s.close ()
		      } catch (err) {
			  s.close ()
			  reject (err)
		      } })
	    s.on ('close', () =>  {
//		U.croak ('Close')
	    })
	    s.on ('end',
		  async function () {
		      if (str !== '') {
			  nbLines ++
			  await handler.addLinesAsync ([str], file)
		      }
		      resolve (nbLines) })
	} catch (err) {
	    reject (err)
	}
    })}

exports.readLines = readLines
