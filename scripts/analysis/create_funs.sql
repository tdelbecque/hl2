create or replace function create_F_tables () returns void as $create_F_tables$
begin
       drop table if exists F3 cascade;
       create  table F3 as (
       	       select count(*) n, pos
	       from tokens_ctx1_in
	       where pos in ('VBP', 'VBZ', 'VBD', 'NN', 'NNS', 'NP', 'NPS', 'JJ', 'RB')
	       group by pos);

       drop table if exists F1 cascade;
       create table F1 as (
       	      select count(*) n, statbef, pos, stataft
	      from tokens_ctx1_in A
	      join verbs_curated B on A.token = B.token
	      where pos in (select pos from F3)
	      group by pos, statbef, stataft);
       alter table F1 add primary key (statbef, pos, stataft);

       create index F1_statbef_idx on F1(statbef);
       create index F1_pos_idx on F1(pos);
       create index F1_stataft_idx on F1(stataft);

       drop table if exists F2 cascade;
       create table F2 as (
       	      select count(*) n, A.token, pos
	      from tokens_ctx1_in A
	      join verbs_curated B on B.token = A.token
	      where pos in (select pos from F3)
	      group by A.token, pos);
       alter table F2 add primary key (token, pos);
       create index F2_token_idx on F2(token);
       create index F2_pos_idx on F2(pos);

       drop table if exists F4 cascade;
       create table F4 as (
       	      select count(*) n, statbef, A.token, stataft
	      from tokens_ctx1_in A
	      join verbs_curated B on B.token = A.token
	      group by statbef, A.token, stataft);

       alter table F4 add primary key (statbef, token, stataft);
       create index F4_statbef_idx on F4(statbef);
       create index F4_token_idx on F4(token);
       create index F4_stataft_idx on F4(stataft);

       drop table if exists F5 cascade;
       create table F5 as (
       	      select (F1.n::real * F2.n)/(F3.n * F4.n) score, F1.statbef, F2.token, F3.pos, F1.stataft
	      from F3
	      join F1 on F3.pos = F1.pos
	      join F2 on F2.pos = F3.pos
	      join F4 on F1.statbef = F4.statbef and F1.stataft = F4.stataft and F4.token = F2.token);
end $create_F_tables$ language plpgsql;

create or replace function compute_failures () returns void as $compute_failures$
begin
    drop table if exists token_ctx_left cascade;
    create table token_ctx_left as (
      select A.gtokno, A.pii, A.hlno, A.tokno, A.klass,
        B.pos posbef, A.pos, B.token tokbef , A.token
        from tokens A
        left outer join tokens B on A.gtokno = B.gtokno + 1);
    alter table token_ctx_left add primary key (gtokno);

    drop table if exists tokens_ctx1 cascade;
    create table tokens_ctx1 as (
      select A.*,  B.pos posaft, B.token tokaft
      from token_ctx_left A
      left outer join tokens B on B.gtokno = A.gtokno + 1);
      
    alter table tokens_ctx1 add primary key (gtokno);
    create index tokens_ctx1_tok_idx on tokens_ctx1(token);
    create index tokens_ctx1_pos_idx on tokens_ctx1(pos);
    create index tokens_ctx1_posbef_idx on tokens_ctx1(posbef);
    create index tokens_ctx1_posaft_idx on tokens_ctx1(posaft);

    update tokens_ctx1 set posbef='NIL', tokbef='' where tokbef is null;
    update tokens_ctx1 set posaft='NIL', tokaft='' where tokaft is null;

    -- this table is used to take apart analysis according to whether we believe
    --   they are successful or not.
    -- A successful analysis led to a 'predicate', in which case U <> size.
    drop table if exists success cascade;
    create table success as (
      select pii, hlno, count(*) size,
             sum (case when klass='unk' then 1 else 0 end) U,
             sum (case when pos in ('VBP', 'VBZ', 'VBD') then 1 else 0 end) V
      from tokens group by pii, hlno);

    drop table if exists fail_verbs cascade;
    create table fail_verbs as (
      select distinct pii, hlno
      from tokens A
      join verbs_curated B on A.token = B.token
      where klass='unk' and pos not like 'V%');

    drop table if exists bar cascade;
    create table bar as
      select distinct A.pii, A.hlno
      from success A
      join fail_verbs B on A.pii = B.pii and A.hlno = B.hlno where v = 0 and size=u;

    drop view if exists failures;
    create view failures as (select X.pii, X.hlno, A.tokno,
                  case when B.posbef = 'IN' then 'IN_' || B.tokbef else posbef end statbef,
                  case when B.posaft = 'IN' then 'IN_' || B.tokaft else B.posaft end stataft,
                  A.pos, A.token, A.lemma
           from bar X
           join  tokens A on A.pii = X.pii and A.hlno = X.hlno
           join  tokens_ctx1 B on B.pii = X.pii and B.hlno = X.hlno and A.tokno = B.tokno);
end $compute_failures$ language plpgsql;

