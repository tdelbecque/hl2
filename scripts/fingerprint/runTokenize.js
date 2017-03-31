const u = require ('../utils/utils')

if (!process.argv [2]) {
    u.croak ('Missing argument: file to tokenize')
    process.exit (-1)
}
const FPDirectory = process.argv [3]

const hlfile = process.argv [2]
const m = require ('./tokenize')
const f = new m (FPDirectory)

f.load (hlfile).
    then (() =>
	  {
	      f.tokenize ()
	      f.output ()
	  }).
    catch (u.croak)


