const fs = require ('fs')

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

exports.lstat = lstat
exports.lsdir = lsdir
