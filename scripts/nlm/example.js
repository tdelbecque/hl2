var m = require ('./loadDictionaryDelimited')
const u = require ('../utils/utils')

var dic
m.loadStringIndex ().then (x => {dic=x; u.sayOk()}, u.croak)
