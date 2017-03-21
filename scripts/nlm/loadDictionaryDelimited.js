const u = require ('../utils/utils')

handler = d => {
    const m = d.match (/(?:.+?)\|(.+?)\|(.*)/)
    return m ? {key: m[1], value: m[2]} : {}
}

exports.loadStringIndex = () => u.loadDictionary ('/home/thierry/UMLS/2016AB/META/MRXNS_ENG.RRF', handler)

