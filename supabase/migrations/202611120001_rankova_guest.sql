begin;

create table public.rankova_products (
  id text primary key check (id ~ '^[a-z0-9-]{1,64}$'),
  game text not null check (game in ('valorant','overwatch-2')),
  name text not null check (char_length(name) between 1 and 80),
  description text not null check (char_length(description) between 1 and 500),
  base_price integer not null check (base_price between 0 and 9999999),
  tier_step integer not null check (tier_step between 0 and 9999999),
  active boolean not null default true
);

create table public.rankova_orders (
  number text primary key check (number ~ '^RV-[A-F0-9]{20}$'),
  lookup_hash text not null check (lookup_hash ~ '^[a-f0-9]{64}$'),
  game text not null check (game in ('valorant','overwatch-2')),
  product_id text not null references public.rankova_products(id),
  product_name text not null,
  tier text not null,
  amount integer not null check (amount >= 0),
  contact text not null check (char_length(contact) between 1 and 120),
  status text not null default '접수' check (status in ('접수','진행 중','완료','취소')),
  created_at timestamptz not null default now()
);

create table public.rankova_inquiries (
  id uuid primary key default gen_random_uuid(),
  game text not null check (game in ('valorant','overwatch-2')),
  contact text not null check (char_length(contact) between 1 and 120),
  message text not null check (char_length(message) between 1 and 1000),
  status text not null default '접수' check (status in ('접수','확인 중','답변 완료')),
  created_at timestamptz not null default now()
);

create index rankova_orders_recent on public.rankova_orders (created_at desc, number desc);
create index rankova_inquiries_recent on public.rankova_inquiries (created_at desc, id desc);

alter table public.rankova_products enable row level security;
alter table public.rankova_orders enable row level security;
alter table public.rankova_inquiries enable row level security;
revoke all on public.rankova_products, public.rankova_orders, public.rankova_inquiries from public, anon, authenticated;
grant select, insert, update on public.rankova_products, public.rankova_orders, public.rankova_inquiries to service_role;

create function public.rankova_validate_order() returns trigger
language plpgsql set search_path = '' as $$
declare
  product public.rankova_products%rowtype;
  tier_index integer;
begin
  select * into product from public.rankova_products where id = new.product_id for share;
  if not found or not product.active then raise exception 'Product unavailable'; end if;
  tier_index := array_position(
    case product.game when 'valorant'
      then array['아이언','브론즈','실버','골드','플래티넘','다이아몬드','초월자','불멸','레디언트']
      else array['브론즈','실버','골드','플래티넘','다이아몬드','마스터','그랜드마스터','챔피언']
    end, new.tier
  ) - 1;
  if tier_index is null or new.amount <> product.base_price + product.tier_step * tier_index then
    raise exception 'Quote changed';
  end if;
  new.game := product.game;
  new.product_name := product.name;
  return new;
end;
$$;

create trigger rankova_validate_order before insert on public.rankova_orders
for each row execute function public.rankova_validate_order();
revoke execute on function public.rankova_validate_order() from public, anon, authenticated;

create function public.rankova_stats()
returns table(order_count bigint, completed_count bigint, completed_quote bigint)
language sql stable set search_path = '' as $$
  select count(*), count(*) filter (where status = '완료'),
    coalesce(sum(amount) filter (where status = '완료'), 0)
  from public.rankova_orders;
$$;

revoke execute on function public.rankova_stats() from public, anon, authenticated;
grant execute on function public.rankova_stats() to service_role;

insert into public.rankova_products (id, game, name, description, base_price, tier_step) values
('valorant-vod','valorant','라운드 리플레이 분석','첫 교전, 포지셔닝, 라운드 운영을 검토합니다.',15000,1000),
('valorant-coaching','valorant','요원별 1:1 코칭','요원의 스킬 사용, 팀 연계, 맵별 운영을 점검합니다.',30000,2000),
('overwatch-2-vod','overwatch-2','팀 교전 리플레이 분석','진입 타이밍, 궁극기 사용, 팀 합류 판단을 살펴봅니다.',15000,1000),
('overwatch-2-coaching','overwatch-2','역할별 1:1 코칭','주력 역할의 영웅 선택과 교전 운영을 점검합니다.',30000,2000);

commit;

