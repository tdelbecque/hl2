const PG = require ('pg')

class Client {
    
    constructor (connectionString) {
	this.connectionString = connectionString
	this.client = new PG.Client (connectionString)
    }

    getClient () {return this.client}
    
    async connect () {
	return new Promise ((resolve, reject) => {
	    try {
		this.client.connect (err => {
		    if (err) reject (err)
		    else resolve (undefined)})
	    } catch (err) {reject (err)}} )}

    async query (q) {
	return new Promise ((resolve, reject) => {
	    try {
		this.client.query (q, (err, result) => {
		    if (err) reject (err)
		    else resolve (result)
		})
	    }
	    catch (err) {
		reject (err)
	    }
	})
    }
	
    end () { this.client.end () }
	    
				     
}

module.exports = Client;
