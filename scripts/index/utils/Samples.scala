package com.sodad.lucene.utils

object Samples {
  def Ulysse = "Heureux qui comme Ulysse a fait un beau voyage"

  def parser =
    """<PAPER PII="S1350417717302079">
<HL>
<NC>
The	DT	the	1	sub
reaction	NN	reaction	2	sub
rate	NN	rate	3	sub
</NC>
<VC type="PASSIVE">
was	VBD	be	4	pred
significantly	RB	significantly	5	obj
accelerated	VBN	accelerate	6	pred
</VC>
<PC type="by">
by	IN	by	7	obj
<NC>
ultrasound	NN	ultrasound	8	obj
irradiation	NN	irradiation	9	obj
</NC>
</PC>
.	SENT	.	10	obj
</HL>
<HL>
<NC>
Direct	JJ	direct	1	unk
functionalization	NN	functionalization	2	unk
</NC>
<PC type="of">
of	IN	of	3	unk
<NC>
carbon	NN	carbon	4	unk
nanotubes	NNS	nanotubes	5	unk
</NC>
</PC>
<PC type="in">
in	IN	in	6	unk
<NC>
water	NN	water	7	unk
</NC>
</PC>
<PC type="without">
without	IN	without	8	unk
<NC>
catalyst	NN	catalyst	9	unk
</NC>
</PC>
.	SENT	.	10	unk
</HL>
<HL>
<NC>
The	DT	the	1	sub
process	NN	process	2	sub
</NC>
<VC type="BE">
is	VBZ	be	3	pred
</VC>
<ADJC>
simple	JJ	simple	4	obj
</ADJC>
and	CC	and	5	pred
<VC>
is	VBZ	be	6	pred
not	RB	not	7	obj
involving	VBG	involve	8	pred
</VC>
<NC>
any	DT	any	9	obj
hazardous	JJ	hazardous	10	obj
chemicals	NNS	chemical	11	obj
</NC>
.	SENT	.	12	obj
</HL>
</PAPER>"""
}
