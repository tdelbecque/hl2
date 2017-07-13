/*
drop table if exists semmed_citations;
create table semmed_citations (
 PMID varchar(20) NOT NULL,
  ISSN char(8) DEFAULT NULL,
  DP varchar(50) DEFAULT NULL,
  EDAT varchar(50) DEFAULT NULL,
  PYEAR int DEFAULT NULL,
  PRIMARY KEY (PMID)
);

drop table if exists semmed_predications;
create table semmed_predications (
  PREDICATION_ID int NOT NULL,
  SENTENCE_ID int NOT NULL,
  PMID varchar(20) DEFAULT NULL,
  PREDICATE varchar(50) DEFAULT NULL,
  SUBJECT_CUI varchar(255) DEFAULT NULL,
  SUBJECT_NAME varchar(999) DEFAULT NULL,
  SUBJECT_SEMTYPE varchar(50) DEFAULT NULL,
  SUBJECT_NOVELTY smallint DEFAULT NULL,
  OBJECT_CUI varchar(255) DEFAULT NULL,
  OBJECT_NAME varchar(999) DEFAULT NULL,
  OBJECT_SEMTYPE varchar(50) DEFAULT NULL,
  OBJECT_NOVELTY smallint DEFAULT NULL,
  PRIMARY KEY (PREDICATION_ID));
*/

/*
drop table if exists pmids;
create table pmids (
       PII char(17),
       doi varchar(50),
       pmid varchar(9),
       eid varchar(19));
*/

/*
create table predications as (
       select pii, B.* from pmids A join semmed_predications B on A.pmid = B.pmid);
       
create index predications_idx on predications (pii);

*/

drop table if exists semmed_sentences;
create table semmed_sentences (
       SENTENCE_ID int NOT NULL,
       PMID varchar(20) DEFAULT NULL,
       type char(2),
       number int,
       sentence text);
       
create table sentences as (
       select pii, B.* from pmids A join semmed_sentences B on A.pmid = B.pmid);
       

create index sentences_idx on sentences (pii);
create index sentences_sent_idx on sentences (sentence_id);
