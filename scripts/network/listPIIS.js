require ('fs').
    readdirSync ('PIIS/').
    map (function (x) {return new Date (x.replace (/_/g,' '))}).
    sort (function (a,b) {return a>b ? 1 : a<b ? -1 : 0}).
    map (function (x) {return x.toDateString ()}).
    forEach (function (x) {process.stdout.write (x + '\n')})


    

    

