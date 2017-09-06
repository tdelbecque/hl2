rm MI_HLS
#rm MI_DATA
for f in *.json.*; do
    node format4pipeline $f | perl -ne 'print if /^S(X|\d){16}/' >> MI_HLS
#    node format $f perl -ne 'print if /^S(X|\d){16}/' >> MI_DATA
done
