const m = require ('./loadOmni')

const f = new m ();

f.load ().then (_ => {
    f.lookFor ('Relationship Type', 'prefLabelFor').
	forEach (x => process.stdout.write (`${x['Key Descriptor']}|${x['Key UID']}\n`))
})
