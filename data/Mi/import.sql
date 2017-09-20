drop table if exists mi_hlstatistics_dic_full;
create table mi_hlstatistics_dic_full (
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
\copy mi_hlstatistics_dic_full from '/home/thierry/HL/data/Mi/hlstats.dicverified' with csv delimiter E'\t' quote E'\b' header;

drop table if exists mi_bests;
create table mi_bests (
       PII char(17),
       hlno int,
       proba float);
\copy mi_bests from 'MI_BESTS' with csv delimiter E'\t';

drop table if exists mi_hlstatistics_dic;
create table mi_hlstatistics_dic as (select A.* from mi_hlstatistics_dic_full A join mi_bests B on A.pii = B.pii and A.hlno = B.hlno);

drop table if exists mi_thy_dic;
create table mi_thy_dic as (select A.* from hlstatisticscell_dic A join mi_hlstatistics_dic B on A.pii = B.pii and A.hlno = 1);

alter table mi_thy_dic add factual text;
alter table mi_thy_dic add simple text;
alter table mi_thy_dic add technical text;

alter table mi_hlstatistics_dic add factual text;
alter table mi_hlstatistics_dic add simple text;
alter table mi_hlstatistics_dic add technical text;

update mi_thy_dic set factual = 'ndef';
update mi_thy_dic set simple = 'ndef';
update mi_thy_dic set technical = 'ndef';

update mi_hlstatistics_dic set factual = 'ndef';
update mi_hlstatistics_dic set simple = 'ndef';
update mi_hlstatistics_dic set technical = 'ndef';

update mi_thy_dic set factual = 'Meta' where hl like 'We %' or hl like 'Our %' or hl like 'This %' or hl like 'These  %' or hl like '%ed .' or nverbsunknown = nverbs;
update mi_thy_dic set factual = 'Factual' where factual != 'Meta' and nunk = 0;

update mi_hlstatistics_dic set factual = 'Meta' where hl like 'We %' or hl like 'Our %' or hl like 'This %' or hl like 'These  %' or hl like '%ed .' or nverbsunknown = nverbs;
update mi_hlstatistics_dic set factual = 'Factual' where factual != 'Meta' and nunk = 0;


update mi_thy_dic set simple = 'ndef';
update mi_thy_dic set simple = 'Simple' where nverbsstrong = 1 and nunk = 0 and factual != 'Meta';
update mi_thy_dic set simple = 'Multiple' where nverbsstrong > 1 and nunk = 0 and factual != 'Meta' and factual != 'Meta';

update mi_hlstatistics_dic set simple = 'ndef';
update mi_hlstatistics_dic set simple = 'Simple' where nverbsstrong = 1 and nunk = 0 and factual != 'Meta';
update mi_hlstatistics_dic set simple = 'Multiple' where nverbsstrong > 1 and nunk = 0 and factual != 'Meta';

update mi_thy_dic set technical = 'ndef';
update mi_thy_dic set technical = 'NonTech' where dicunknown::float / dicknown < 0.2 and nverbsstrong > 0 and factual != 'Meta';
update mi_thy_dic set technical = 'Tech' where dicunknown::float / dicknown > 0.5 and nverbsstrong > 0 and factual != 'Meta';

update mi_hlstatistics_dic set technical = 'ndef';
update mi_hlstatistics_dic set technical = 'NonTech' where dicunknown::float / dicknown < 0.2 and nverbsstrong > 0 and factual != 'Meta';
update mi_hlstatistics_dic set technical = 'Tech' where dicunknown::float / dicknown > 0.4 and nverbsstrong > 0 and factual != 'Meta';

drop table if exists mi_hlstatistics_common_0;
create table mi_hlstatistics_common_0 as (select A.* from mi_hlstatistics_dic A join mi_thy_dic B on A.pii = B.pii);
alter table mi_hlstatistics_common_0 add source text;
update mi_hlstatistics_common_0 set source = 'Algorithm';

drop table if exists mi_hlstatistics_common;
create table mi_hlstatistics_common as select A.*, B.proba from mi_hlstatistics_common_0 A join mi_bests B on A.pii = B.pii;

alter table mi_thy_dic add source text;
update mi_thy_dic set source = 'Author';
alter table mi_thy_dic add proba float;
update mi_thy_dic set proba = -1.0;

alter table mi_thy_dic drop column rnd;

drop table if exists mi_union;
create table mi_union as select A.*, B.title from (((select * from mi_thy_dic) union (select * from mi_hlstatistics_common)) as  A join articles B on A.pii = B.pii);

\copy (select pii, title, hlno, proba, hl, source, factual, simple, technical from mi_union order by pii, source) to hl_for_survey_2.tsv with csv delimiter E'\t' header;

