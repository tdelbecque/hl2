for i in {0..19}; do
    X=$i perl -ne 'print if $. % 20 == $ENV{X}' < kristian > kristian.$i
    node getmi.js kristian.$i > kristian.json.$i 2> error.$i &
done
