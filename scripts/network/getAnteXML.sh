ls ~/HL/data/out/pages-xml-ante/ | perl -pe 's/.xml//' > foo
cat ~/HL/data/piis-ante | perl getAnteXML.pl > ~/HL/data/piis-ante-2
# node runGetHLPar.js /home/thierry/HL/data/piis-ante-2 /home/thierry/HL/data/out/pages-xml-ante/ >> /home/thierry/HL/data/hls-ante-2

