drop table if exists articles;
create table articles (
       pii char(17),
       title text,
       issn char(8),
       authors text,
       volume  text,
       pubtime text,
       pages   text,
       abstract	text);

\copy articles from '/home/thierry/HL/data/SD_Articles_20161128.tsv' with csv delimiter E'\t' quote E'\b' header;

alter table articles add primary key(pii);

drop table if exists xml_hl;
create table xml_hl (pii char(17), hl text, primary key (pii));

\copy xml_hl from '/home/thierry/HL/data/out/www-resources/SD_PII_Highlights.tsv.xml' with csv delimiter E'\t' quote E'\b';

drop table if exists hung_predicates;
create table hung_predicates (pii char(17), hlno integer, predicates text, primary key (pii, hlno));

\copy hung_predicates from '/home/thierry/HL/data.bk/out/foo' with csv delimiter E'\t' quote E'\b';

drop table if exists hlstatistics;
create table hlstatistics (
       PII char(17),
       hlno int,
       ntokens int,
       nsub int,
       npred int,
       nobj int,
       nunk int,
       nnouns int,
       nconcepts int,
       ndistconc int,
       nverbs int,
       nverbsstrong int,
       nverbsunknown int,
       hl text);

\copy hlstatistics from '/home/thierry/HL/data/hlstats.2' with csv delimiter E'\t' quote E'\b' header;

alter table hlstatistics add primary key(pii, hlno);

drop table if exists hlstatisticsfull;
create table hlstatisticsfull as (select A.*, B.issn, C.journal_title, D.category from hlstatistics A join articles B on A.pii = B.pii join journals_title C on B.issn = c.issn join journals_categories D on D.issn = B.issn);


drop table if exists hlnouns;
create table hlnouns (
       PII char(17),
       hlno int,
       lemma text,
       n int);

\copy hlnouns from '/home/thierry/HL/data/hlnouns' with csv delimiter E'\t' quote E'\b' header;

drop table if exists docfreqs;
create table docfreqs as (select lemma, count(*) df from hlnouns group by lemma);

drop table if exists docfreqs_perhl;
create table docfreqsperhl as (select A.*, df from hlnouns A join docfreqs B on A.lemma = B.lemma);


--drop table if exists hldffull;
--create table hldffull as (select A.*, B.issn, category from hldf A join articles B on A.pii = B.pii join journals_categories C on B.issn = C.issn);

drop table if exists celljournals;
create table celljournals (
       issn char(8),
       journal_title text);

\copy celljournals from '/home/thierry/HL/data/cellrolf.txt' with csv delimiter E'\t' quote E'\b';

drop table if exists hlstatisticscell;
create table hlstatisticscell as (select A.* from hlstatistics A join articles C on C.pii = A.pii join celljournals B on C.issn = B.issn);
alter table hlstatisticscell add column rnd float;
update hlstatisticscell set rnd = random ();

drop table if exists piicell;
create table piicell as (select distinct pii from hlstatisticscell);

drop table if exists cellnouns;
create table cellnouns as (select hlnouns.* from hlnouns join piicell on hlnouns.pii = piicell.pii);

drop table if exists celldocfreqs;
create table celldocfreqs as (select lemma, count(*) df from cellnouns group by lemma);

drop table if exists hldfcell;
create table hldfcell as (select A.* from hldffull A join celljournals B on A.issn = B.issn);

drop table if exists hlstatistics_dic;
create table hlstatistics_dic (
       PII char(17),
       hlno int,
       ntokens int,
       nsub int,
       npred int,
       nobj int,
       nunk int,
       nnouns int,
       nconcepts int,
       ndistconc int,
       nverbs int,
       nverbsstrong int,
       nverbsunknown int,
       hl text,
       dicknown int,
       dicunknown int);
\copy hlstatistics_dic from '/home/thierry/HL/data/hlstats.dicverified' with csv delimiter E'\t' quote E'\b' header;

drop table if exists hlstatisticscell_dic;
create table hlstatisticscell_dic as (select A.*, dicknown, dicunknown from hlstatisticscell A join hlstatistics_dic B on A.pii = B.pii and A.hlno = B.hlno)
