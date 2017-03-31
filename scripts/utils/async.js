const fs = require ('fs')
const U = require ('./utils')

async function lstat (fn) {
    return new Promise ((resolve, reject) => {
	fs.lstat (fn,
		  (err, stat) => {
		      if (err) {
			  reject (err)
			  return
		      }
		      resolve (stat)})})}

async function lsdir (dn) {
    return new Promise ((resolve, reject) => {
	fs.readdir (dn,
		    {encoding: 'utf8'},
		    (err, xs) => {
			if (err) {
			    reject (err)
			    return
			}
			resolve (xs)
		    })})}

async function readFile (file, options={encoding:"utf8"}) {
    return new Promise ((resolve, reject) => {
	const h = (err, data) => {
	    if (err) reject (err)
	    else resolve (data)
	}
	try {
	    fs.readFile (file, options, h)
	}
	catch (err) {
	    reject (err)
	}
    })}

async function assertDirectory (path) {
    U.assert ((await lstat (path)).isDirectory (),
	      'not a directory : ' + path)

}

exports.lstat = lstat
exports.lsdir = lsdir
exports.readFile = readFile
exports.assertDirectory = assertDirectory

