begin;

create function public.rankova_is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from auth.users
    where id = auth.uid() and not is_anonymous
      and raw_app_meta_data -> 'rankova_admin' = 'true'::jsonb
  );
$$;
revoke all on function public.rankova_is_admin() from public, anon, authenticated;
grant execute on function public.rankova_is_admin() to authenticated;

create table public.rankova_assets (
  id uuid primary key,
  name text not null check (char_length(name) between 1 and 160),
  path text not null unique,
  mime text not null check (mime in ('image/jpeg','image/png','image/webp')),
  size integer not null check (size between 1 and 2097152),
  deleting boolean not null default false
);

create table public.rankova_content (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('home','notice','valorant','overwatch-2','coach','review','status','faq','settings')),
  title text not null check (char_length(title) between 1 and 200),
  body text not null default '' check (char_length(body) <= 8000),
  published boolean not null default false,
  sort_order integer not null default 0 check (sort_order between 0 and 999999),
  image_id uuid references public.rankova_assets(id) on delete restrict,
  image_alt text not null default '' check (char_length(image_alt) <= 200),
  group_key text not null default '',
  game text not null default '' check (game in ('','valorant','overwatch-2')),
  source text not null default '' check (source in ('','customer','operator')),
  amount integer check (amount between 0 and 100000000),
  check (kind <> 'review' or (game <> '' and source <> '')),
  check (kind not in ('valorant','overwatch-2') or
    (kind = 'valorant' and group_key in ('win','duo','tier','placement')) or
    (kind = 'overwatch-2' and group_key in ('win','duo','tier')))
);
create index rankova_content_listing on public.rankova_content(kind, sort_order, id);
create index rankova_content_asset on public.rankova_content(image_id);

alter table public.rankova_content enable row level security;
alter table public.rankova_assets enable row level security;
revoke all on public.rankova_content, public.rankova_assets from public, anon, authenticated;
grant select on public.rankova_content, public.rankova_assets to anon, authenticated;
grant insert, update, delete on public.rankova_content to authenticated;
grant insert, delete on public.rankova_assets to authenticated;
create policy rankova_published_content on public.rankova_content for select to anon, authenticated using (published);
create policy rankova_manage_content on public.rankova_content for all to authenticated
  using ((select public.rankova_is_admin())) with check ((select public.rankova_is_admin()));
create policy rankova_published_asset on public.rankova_assets for select to anon, authenticated using (
  not deleting and exists (select 1 from public.rankova_content where image_id = rankova_assets.id and published)
);
create policy rankova_manage_assets on public.rankova_assets for all to authenticated
  using ((select public.rankova_is_admin())) with check ((select public.rankova_is_admin()));

-- Serialize attachment and deletion with a lock on the asset row.
create function public.rankova_check_asset_reference() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.image_id is not null then
    perform 1 from public.rankova_assets where id = new.image_id and not deleting for share;
    if not found then raise exception 'Image is unavailable'; end if;
  end if;
  return new;
end;
$$;
create trigger rankova_check_asset_reference before insert or update of image_id on public.rankova_content
for each row execute function public.rankova_check_asset_reference();
revoke all on function public.rankova_check_asset_reference() from public, anon, authenticated;

create function public.rankova_mark_asset_for_deletion(asset_id uuid)
returns setof public.rankova_assets language plpgsql security definer set search_path = '' as $$
begin
  if not public.rankova_is_admin() then raise exception 'Forbidden' using errcode = '42501'; end if;
  perform 1 from public.rankova_assets where id = asset_id for update;
  if exists(select 1 from public.rankova_content where image_id = asset_id) then
    raise exception 'Image is referenced' using errcode = '23503';
  end if;
  return query update public.rankova_assets set deleting = true where id = asset_id returning *;
end;
$$;
revoke all on function public.rankova_mark_asset_for_deletion(uuid) from public, anon, authenticated;
grant execute on function public.rankova_mark_asset_for_deletion(uuid) to authenticated;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('rankova-media', 'rankova-media', false, 2097152, array['image/jpeg','image/png','image/webp']);

create policy rankova_media_admin_read on storage.objects for select to authenticated
using (bucket_id = 'rankova-media' and (select public.rankova_is_admin()));
create policy rankova_media_admin_insert on storage.objects for insert to authenticated
with check (bucket_id = 'rankova-media' and (select public.rankova_is_admin()));
create policy rankova_media_admin_remove on storage.objects for delete to authenticated
using (bucket_id = 'rankova-media' and (select public.rankova_is_admin()) and not exists (
  select 1 from public.rankova_assets where path = storage.objects.name and not deleting
));

grant select, update on public.rankova_orders, public.rankova_products to authenticated;
grant insert on public.rankova_products to authenticated;
grant select, update, delete on public.rankova_inquiries to authenticated;
grant execute on function public.rankova_stats() to authenticated;
create policy rankova_admin_orders on public.rankova_orders for all to authenticated
using ((select public.rankova_is_admin())) with check ((select public.rankova_is_admin()));
create policy rankova_admin_products on public.rankova_products for all to authenticated
using ((select public.rankova_is_admin())) with check ((select public.rankova_is_admin()));
create policy rankova_admin_inquiries on public.rankova_inquiries for all to authenticated
using ((select public.rankova_is_admin())) with check ((select public.rankova_is_admin()));

insert into public.rankova_content(kind,title,body,published,sort_order,group_key,amount) values
('valorant','아이언','',true,10,'win',5000),
('valorant','브론즈','',true,20,'win',5000),
('valorant','실버','',true,30,'win',6000),
('valorant','골드','',true,40,'win',7000),
('valorant','플래티넘','',true,50,'win',9000),
('valorant','다이아 1','',true,60,'win',12000),
('valorant','다이아 2','',true,70,'win',13000),
('valorant','다이아 3','',true,80,'win',14000),
('valorant','초월자 1','',true,90,'win',17000),
('valorant','초월자 2','',true,100,'win',19000),
('valorant','초월자 3','',true,110,'win',21000),
('valorant','불멸 1','',true,120,'win',32000),
('valorant','불멸 2','',true,130,'win',37000),
('valorant','불멸 3','',true,140,'win',42000),
('valorant','레디언트','',true,150,'win',null),
('valorant','아이언','',true,10,'duo',5000),
('valorant','브론즈','',true,20,'duo',5000),
('valorant','실버','',true,30,'duo',6000),
('valorant','골드','',true,40,'duo',7000),
('valorant','플래티넘','',true,50,'duo',9000),
('valorant','다이아','',true,60,'duo',13000),
('valorant','초월자 1','',true,70,'duo',17000),
('valorant','초월자 2','',true,80,'duo',19000),
('valorant','초월자 3','',true,90,'duo',21000),
('valorant','불멸 1','',true,100,'duo',32000),
('valorant','불멸 2','',true,110,'duo',37000),
('valorant','불멸 3','',true,120,'duo',42000),
('valorant','레디언트','',true,130,'duo',null),
('valorant','아이언','',true,10,'tier',16000),
('valorant','브론즈','',true,20,'tier',18000),
('valorant','실버','',true,30,'tier',19000),
('valorant','골드','',true,40,'tier',23000),
('valorant','플래티넘','',true,50,'tier',35000),
('valorant','다이아 1','',true,60,'tier',46000),
('valorant','다이아 2','',true,70,'tier',50000),
('valorant','다이아 3','',true,80,'tier',53000),
('valorant','초월자 1','',true,90,'tier',65000),
('valorant','초월자 2','',true,100,'tier',75000),
('valorant','초월자 3','',true,110,'tier',83000),
('valorant','불멸 1','',true,120,'tier',140000),
('valorant','불멸 2','',true,130,'tier',140000),
('valorant','불멸 3','',true,140,'tier',190000),
('valorant','레디언트','',true,150,'tier',null),
('valorant','아이언','',true,10,'placement',11000),
('valorant','브론즈','',true,20,'placement',11000),
('valorant','실버','',true,30,'placement',11000),
('valorant','골드','',true,40,'placement',11000),
('valorant','플래티넘','',true,50,'placement',11000),
('valorant','다이아','',true,60,'placement',14000),
('valorant','초월자','',true,70,'placement',17000),
('valorant','불멸','',true,80,'placement',19000),
('valorant','레디언트','',true,90,'placement',25000),
('overwatch-2','브론즈','',true,10,'tier',20000),
('overwatch-2','실버','',true,20,'tier',20000),
('overwatch-2','골드','',true,30,'tier',22000),
('overwatch-2','플래티넘','',true,40,'tier',25000),
('overwatch-2','다이아 5~4','',true,50,'tier',29000),
('overwatch-2','다이아 3~1','',true,60,'tier',34000),
('overwatch-2','마스터 5~4','',true,70,'tier',46000),
('overwatch-2','마스터 3~2','',true,80,'tier',59000),
('overwatch-2','마스터 1','',true,90,'tier',75000),
('overwatch-2','그랜드마스터','',true,100,'tier',null),
('overwatch-2','챔피언','',true,110,'tier',null),
('overwatch-2','브론즈','',true,10,'win',4500),
('overwatch-2','실버','',true,20,'win',4500),
('overwatch-2','골드','',true,30,'win',4500),
('overwatch-2','플래티넘','',true,40,'win',5500),
('overwatch-2','다이아 5~4','',true,50,'win',7000),
('overwatch-2','다이아 3~1','',true,60,'win',8000),
('overwatch-2','마스터 5~4','',true,70,'win',10000),
('overwatch-2','마스터 3~2','',true,80,'win',13500),
('overwatch-2','마스터 1','',true,90,'win',16500),
('overwatch-2','그랜드마스터','',true,100,'win',null),
('overwatch-2','챔피언','',true,110,'win',null),
('overwatch-2','브론즈','',true,10,'duo',3500),
('overwatch-2','실버','',true,20,'duo',3500),
('overwatch-2','골드','',true,30,'duo',4000),
('overwatch-2','플래티넘','',true,40,'duo',5000),
('overwatch-2','다이아 5~4','',true,50,'duo',6000),
('overwatch-2','다이아 3~1','',true,60,'duo',6000),
('overwatch-2','마스터 5~4','',true,70,'duo',8000),
('overwatch-2','마스터 3~2','',true,80,'duo',9000),
('overwatch-2','마스터 1','',true,90,'duo',9000),
('overwatch-2','그랜드마스터','',true,100,'duo',null),
('overwatch-2','챔피언','',true,110,'duo',null),
('home','발로란트 | 오버워치 대리는 RANKOVA','발로란트 | 오버워치 희망하시는 게임을 선택해주세요',true,10,'',null),
('notice','[공지] RANKOVA 기사 운영 원칙 및 1000배 책임 보상 정책','안녕하세요. RANKOVA입니다.

RANKOVA는 고객 여러분께 신뢰할 수 있는 서비스를 제공하기 위해 엄격한 기사 선발 기준과 운영 원칙을 적용하고 있습니다.

01. 프로 1군 출신 기사 운영

RANKOVA의 모든 기사는 프로 1군 출신 인력으로 구성되어 있으며, 검증된 실력과 풍부한 경험을 바탕으로 서비스를 제공합니다.

02. 불법 프로그램 및 어뷰징 절대 금지

RANKOVA는 서비스 진행 과정에서 다음 행위를 엄격하게 금지합니다.

• 핵 및 불법 프로그램 사용

• 어뷰징 및 부정행위

• 게임 운영 정책을 위반하는 비정상적인 플레이

위 행위에 대해서는 어떠한 예외도 허용하지 않으며, 모든 기사는 해당 운영 원칙을 준수해야 합니다.

03. 제재 발생 시 1000배 책임 보상

RANKOVA 기사 측의 핵 프로그램 사용 또는 어뷰징 행위가 객관적인 증거로 확인되고, 해당 행위로 인해 고객 계정에 제재가 발생한 경우 결제금액의 최대 1000배를 보상하는 책임 보상 정책을 운영합니다.

보상 적용 여부 및 지급 기준은 별도 보상 약관에 따릅니다.

04. 고객 신뢰 최우선

RANKOVA는 단순한 서비스 제공을 넘어, 고객과의 약속을 지키는 것을 가장 중요한 운영 원칙으로 삼겠습니다.

실력은 기본, 신뢰는 원칙.

RANKOVA 드림',true,10,'',null),
('faq','어떤 게임을 지원하나요?','발로란트와 오버워치 2를 지원합니다. 위에서 게임을 선택하면 각 게임의 서비스 페이지로 이동합니다.',true,10,'',null),
('faq','상품과 가격은 어디서 확인할 수 있나요?','게임별 가격표에서 서비스 유형과 티어별 가격을 확인할 수 있습니다.',true,20,'',null),
('settings','RANKOVA | 경쟁전 서비스 플랫폼','발로란트와 오버워치 2를 위한 통합 경쟁전 서비스 플랫폼',true,10,'',null);

commit;
