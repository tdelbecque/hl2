--
-- Tagset for TreeTagger
--

module TreeTagger where
data PoS = CC -- 	coordinating conjunction 	and, but, or, &
         | CD -- 	cardinal number 	1, three
         | DT -- 	determiner 	the
         | EX --	existential there 	there is
         | FW --	foreign word 	d'œuvre
         | IN --	preposition/subord. conj. 	in,of,like,after,whether
         | IN_that --	complementizer	that
         | JJ --	adjective 	green
         | JJR --	adjective, comparative 	greener
         | JJS --	adjective, superlative 	greenest
         | LS --	list marker 	(1),
         | MD --	modal 	could, will
         | NN --	noun, singular or mass 	table
         | NNS --	noun plural 	tables
         | NP --	proper noun, singular 	John
         | NPS --	proper noun, plural 	Vikings
         | PDT --	predeterminer 	both the boys
         | POS --	possessive ending 	friend's
         | PP --	personal pronoun 	I, he, it
         | PP_DOL -- 	possessive pronoun 	my, his
         | RB --	adverb 	however, usually, here, not
         | RBR --	adverb, comparative 	better
         | RBS --	adverb, superlative 	best
         | RP --	particle 	give up
         | SENT --	end punctuation	?, !, .
         | SYM --	symbol	@, +, *, ^, |, =
         | TO --	to 	to go, to him
         | UH --	interjection 	uhhuhhuhh
         | VB --	verb be, base form 	be
         | VBD --	verb be, past 	was|were
         | VBG --	verb be, gerund/participle 	being
         | VBN --	verb be, past participle 	been
         | VBZ --	verb be, pres, 3rd p. sing 	is
         | VBP --	verb be, pres non-3rd p. 	am|are
         | VD --	verb do, base form 	do
         | VDD --	verb do, past 	did
         | VDG --	verb do gerund/participle	doing
         | VDN --	verb do, past participle 	done
         | VDZ --	verb do, pres, 3rd per.sing	does
         | VDP --	verb do, pres, non-3rd per. 	do
         | VH --	verb have, base form 	have
         | VHD --	verb have, past 	had
         | VHG --	verb have, gerund/participle 	having
         | VHN --	verb have, past participle 	had
         | VHZ --	verb have, pres 3rd per.sing	has
         | VHP --	verb have, pres non-3rd per.	have
         | VV --	verb, base form 	take
         | VVD --	verb, past tense 	took
         | VVG --	verb, gerund/participle 	taking
         | VVN --	verb, past participle 	taken
         | VVP --	verb, present, non-3rd p. 	take
         | VVZ --	verb, present 3d p. sing. 	takes
         | WDT --	wh-determiner 	which
         | WP --	wh-pronoun 	who, what
         | WP_DOL -- 	possessive wh-pronoun 	whose
         | WRB --	wh-abverb 	where, when
         | COLON --	general joiner	;, -, --
         | CURCY --	currency symbol	$, £
         | OPAR --      (
         | CPAR --      )
         | OQUOTE
         | CQUOTE
         | SHARP
         | PUNC 
           deriving (Show, Eq)

strToPos :: String -> Maybe PoS
strToPos "CC" = Just CC
strToPos "CD" = Just CD
strToPos "DT" = Just DT
strToPos "EX" = Just EX
strToPos "FW" = Just FW
strToPos "IN" = Just IN
strToPos "IN/that" = Just IN_that
strToPos "JJ" = Just JJ
strToPos "JJR" = Just JJR
strToPos "JJS" = Just JJS
strToPos "LS" = Just LS
strToPos "MD" = Just MD
strToPos "NN" = Just NN
strToPos "NNS" = Just NNS
strToPos "NP" = Just NP
strToPos "NPS" = Just NPS
strToPos "PDT" = Just PDT
strToPos "POS" = Just POS
strToPos "PP" = Just PP
strToPos "PP$" = Just PP_DOL
strToPos "RB" = Just RB
strToPos "RBR" = Just RBR
strToPos "RBS" = Just RBS
strToPos "RP" = Just RP
strToPos "SENT" = Just SENT
strToPos "SYM" = Just SYM
strToPos "TO" = Just TO
strToPos "UH" = Just UH
strToPos "VB" = Just VB
strToPos "VBD" = Just VBD
strToPos "VBG" = Just VBG
strToPos "VBN" = Just VBN
strToPos "VBZ" = Just VBZ
strToPos "VBP" = Just VBP
strToPos "VD" = Just VD
strToPos "VDD" = Just VDD
strToPos "VDG" = Just VDG
strToPos "VDN" = Just VDN
strToPos "VDZ" = Just VDZ
strToPos "VDP" = Just VDP
strToPos "VH" = Just VH
strToPos "VHD" = Just VHD
strToPos "VHG" = Just VHG
strToPos "VHN" = Just VHN
strToPos "VHZ" = Just VHZ
strToPos "VHP" = Just VHP
strToPos "VV" = Just VV
strToPos "VVD" = Just VVD
strToPos "VVG" = Just VVG
strToPos "VVN" = Just VVN
strToPos "VVP" = Just VVP
strToPos "VVZ" = Just VVZ
strToPos "WDT" = Just WDT
strToPos "WP" = Just WP
strToPos "WP$" = Just WP_DOL
strToPos "WRB" = Just WRB
strToPos ":" = Just COLON
strToPos "$" = Just CURCY
strToPos "(" = Just OPAR
strToPos ")" = Just CPAR
strToPos "," = Just PUNC
strToPos "''" = Just CQUOTE
strToPos "``" = Just OQUOTE
strToPos "#" = Just SHARP
strToPos _ = Nothing

simpleShow :: PoS -> String
simpleShow VB = "verb"
simpleShow VBD = "verb"
simpleShow VBG = "verb"
simpleShow VBN = "verb"
simpleShow VBZ = "verb"
simpleShow VBP = "verb"
simpleShow VD = "verb"
simpleShow VDD = "verb"
simpleShow VDG = "verb"
simpleShow VDN = "verb"
simpleShow VDZ = "verb"
simpleShow VDP = "verb"
simpleShow VH = "verb"
simpleShow VHD = "verb"
simpleShow VHG = "verb"
simpleShow VHN = "verb"
simpleShow VHZ = "verb"
simpleShow VHP = "verb"
simpleShow VV = "verb"
simpleShow VVD = "verb"
simpleShow VVG = "verb"
simpleShow VVN = "verb"
simpleShow VVP = "verb"
simpleShow VVZ = "verb"
simpleShow NN = "noun"
simpleShow NNS = "noun"
simpleShow NP = "noun"
simpleShow NPS = "noun"
simpleShow JJ = "adj"
simpleShow JJR = "adj"
simpleShow JJS = "adj"
simpleShow RB = "adv"
simpleShow RBR = "adv"
simpleShow RBS = "adv"
simpleShow _ = "other"
