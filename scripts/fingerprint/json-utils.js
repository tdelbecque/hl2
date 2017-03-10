exports.stringify = data =>
    JSON.stringify (
	data,
	(() => {
	    var cache = []
	    return (key, value) => {
		if (typeof value === 'object' && value !== null) {
		    if (cache.indexOf(value) !== -1) return
		    cache.push (value)
		}
		return value
	    }}) (),
	2)
