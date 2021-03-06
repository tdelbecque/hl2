var P = require ('./getpage')

function formatDate (date) {
    var y = date.getFullYear()
    var m = date.getMonth () + 1
    var d = date.getDate ()
    return y*10000+m*100+d
}

function F (firstDate, lastDate) {
    var myself = this
    this.piis = {}
    this.firstDate = firstDate
    this.lastDate = lastDate;
    this.currentDate = firstDate

    this.APIKEY = process.env.KG_ELSAPI_APIKEY
    this.APITOKEN = process.env.KG_ELSAPI_TOKEN

    this.whenDateFinished = function (piis) {
	myself.piis [myself.currentDate.toDateString().replace (/ /g, '_')] = piis;
	myself.currentDate.setDate (myself.currentDate.getDate () + 1)
	if (myself.currentDate <= myself.lastDate) {
	    var r = new P (formatDate (myself.currentDate),
			   myself.APIKEY, myself.APITOKEN)
	    r.getPage (myself.whenDateFinished)
	} else {
	    myself.whenFinished (myself.piis)
	}
	
    }

    this.get = function (whenFinished) {
	myself.whenFinished = whenFinished
	var r = new P (formatDate (myself.currentDate),
		       myself.APIKEY, myself.APITOKEN)
	r.getPage (myself.whenDateFinished)
    }

    this.testValid = function () {
	if (myself.APIKEY === undefined)
	    return {
		isValid: false,
		errmsg: 'KG_ELSAPI_APIKEY environment variable is not defined'
	    }
	if (myself.APITOKEN === undefined)
	    return {
		isValid: false,
		errmsg: 'KG_ELSAPI_TOKEN envoronment variable is not defined'
	    }
	return {isValid: true}
    }
}

module.exports = F




