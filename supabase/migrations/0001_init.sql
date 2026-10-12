-- =========================================================
-- 우리반 경매장 : 초기 스키마
-- Supabase 대시보드 > SQL Editor 에 통째로 붙여넣고 Run 하세요.
-- =========================================================

create extension if not exists pgcrypto;

-- ---------- 테이블 ----------
create table public.classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  join_code text not null unique,
  practice_coins int not null default 100 check (practice_coins >= 0),
  created_at timestamptz not null default now()
);

create table public.students (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  number int not null,
  name text not null,
  pin_hash text not null,
  is_active boolean not null default true,
  failed_attempts int not null default 0,
  locked_until timestamptz,
  created_at timestamptz not null default now(),
  unique (class_id, number)
);

create table public.coin_ledger (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  amount int not null,
  type text not null check (type in ('grant','deduct','auction_win','undo')),
  reason text not null default '',
  auction_id uuid,
  batch_id uuid not null default gen_random_uuid(),
  undone boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.coin_ledger (student_id);
create index on public.coin_ledger (class_id, created_at desc);

create table public.items (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  name text not null,
  description text not null default '',
  emoji text not null default '🎁',
  default_quantity int not null default 1 check (default_quantity >= 1),
  min_bid int not null default 1 check (min_bid >= 1),
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.auctions (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  title text not null,
  mode text not null check (mode in ('practice','real')),
  status text not null default 'draft' check (status in ('draft','open','closed','revealed')),
  closes_at timestamptz,
  show_winner_names boolean not null default true,
  created_at timestamptz not null default now(),
  opened_at timestamptz,
  closed_at timestamptz
);
-- 한 학급에 '입찰 중' 경매는 하나만
create unique index one_open_auction_per_class on public.auctions (class_id) where status = 'open';

create table public.auction_lots (
  id uuid primary key default gen_random_uuid(),
  auction_id uuid not null references public.auctions(id) on delete cascade,
  item_id uuid not null references public.items(id),
  quantity int not null default 1 check (quantity >= 1),
  position int not null default 0
);

create table public.bids (
  id uuid primary key default gen_random_uuid(),
  lot_id uuid not null references public.auction_lots(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  amount int not null check (amount >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lot_id, student_id)
);

create table public.lot_winners (
  id uuid primary key default gen_random_uuid(),
  lot_id uuid not null references public.auction_lots(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  amount int not null,
  rank int not null
);

create table public.inventory (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  item_id uuid not null references public.items(id),
  lot_id uuid references public.auction_lots(id) on delete set null,
  price_paid int not null,
  status text not null default 'owned' check (status in ('owned','used')),
  acquired_at timestamptz not null default now(),
  used_at timestamptz
);

-- ---------- 잔액 뷰 ----------
create view public.student_balances with (security_invoker = true) as
  select s.id as student_id, s.class_id, coalesce(sum(l.amount), 0)::int as balance
  from public.students s
  left join public.coin_ledger l on l.student_id = s.id
  group by s.id, s.class_id;

-- ---------- 권한 도우미 ----------
create or replace function public.is_class_teacher(p_class uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.classes where id = p_class and teacher_id = auth.uid());
$$;

create or replace function public.auction_class(p_auction uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select class_id from public.auctions where id = p_auction;
$$;

create or replace function public.lot_class(p_lot uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select a.class_id from public.auction_lots l join public.auctions a on a.id = l.auction_id where l.id = p_lot;
$$;

-- ---------- RLS : 교사는 자기 학급 데이터만 ----------
alter table public.classes      enable row level security;
alter table public.students     enable row level security;
alter table public.coin_ledger  enable row level security;
alter table public.items        enable row level security;
alter table public.auctions     enable row level security;
alter table public.auction_lots enable row level security;
alter table public.bids         enable row level security;
alter table public.lot_winners  enable row level security;
alter table public.inventory    enable row level security;

create policy "teacher_classes" on public.classes for all to authenticated
  using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());
create policy "teacher_students" on public.students for all to authenticated
  using (public.is_class_teacher(class_id)) with check (public.is_class_teacher(class_id));
create policy "teacher_ledger" on public.coin_ledger for all to authenticated
  using (public.is_class_teacher(class_id)) with check (public.is_class_teacher(class_id));
create policy "teacher_items" on public.items for all to authenticated
  using (public.is_class_teacher(class_id)) with check (public.is_class_teacher(class_id));
create policy "teacher_auctions" on public.auctions for all to authenticated
  using (public.is_class_teacher(class_id)) with check (public.is_class_teacher(class_id));
create policy "teacher_lots" on public.auction_lots for all to authenticated
  using (public.is_class_teacher(public.auction_class(auction_id)))
  with check (public.is_class_teacher(public.auction_class(auction_id)));
create policy "teacher_bids_read" on public.bids for select to authenticated
  using (public.is_class_teacher(public.lot_class(lot_id)));
create policy "teacher_winners_read" on public.lot_winners for select to authenticated
  using (public.is_class_teacher(public.lot_class(lot_id)));
create policy "teacher_inventory" on public.inventory for all to authenticated
  using (public.is_class_teacher(class_id)) with check (public.is_class_teacher(class_id));
-- 학생 요청은 서버(service role)로만 처리하므로 anon 정책은 없습니다.

-- ---------- 입찰 (서버 전용) ----------
create or replace function public.place_bid(p_student uuid, p_lot uuid, p_amount int)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_student public.students;
  v_lot public.auction_lots;
  v_auction public.auctions;
  v_item public.items;
  v_budget int;
  v_other int;
begin
  -- 같은 학생의 동시 입찰을 한 줄로 세움
  select * into v_student from public.students where id = p_student for update;
  if not found or not v_student.is_active then raise exception '학생 정보를 찾을 수 없어요'; end if;

  select * into v_lot from public.auction_lots where id = p_lot;
  if not found then raise exception '물건을 찾을 수 없어요'; end if;
  select * into v_auction from public.auctions where id = v_lot.auction_id;
  if v_auction.class_id <> v_student.class_id then raise exception '우리 반 경매가 아니에요'; end if;
  if v_auction.status <> 'open' then raise exception '지금은 입찰할 수 없어요'; end if;
  if v_auction.closes_at is not null and v_auction.closes_at < now() then raise exception '입찰 시간이 끝났어요'; end if;

  if p_amount is null or p_amount <= 0 then
    delete from public.bids where lot_id = p_lot and student_id = p_student;
    return json_build_object('ok', true, 'cancelled', true);
  end if;

  select * into v_item from public.items where id = v_lot.item_id;
  if p_amount < v_item.min_bid then
    raise exception '최소 % 코인부터 입찰할 수 있어요', v_item.min_bid;
  end if;

  if v_auction.mode = 'practice' then
    select practice_coins into v_budget from public.classes where id = v_auction.class_id;
  else
    select coalesce(sum(amount), 0) into v_budget from public.coin_ledger where student_id = p_student;
  end if;

  select coalesce(sum(b.amount), 0) into v_other
  from public.bids b join public.auction_lots l on l.id = b.lot_id
  where l.auction_id = v_auction.id and b.student_id = p_student and b.lot_id <> p_lot;

  if v_other + p_amount > v_budget then
    raise exception '코인이 부족해요 (쓸 수 있는 코인: %)', greatest(v_budget - v_other, 0);
  end if;

  insert into public.bids (lot_id, student_id, amount)
  values (p_lot, p_student, p_amount)
  on conflict (lot_id, student_id) do update set amount = excluded.amount, updated_at = now();

  return json_build_object('ok', true);
end $$;

-- ---------- 마감·낙찰 (교사만, 한 트랜잭션) ----------
create or replace function public.close_auction(p_auction uuid)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_auction public.auctions;
  v_lot record;
  v_bid record;
  v_rank int;
  v_winners int := 0;
begin
  select * into v_auction from public.auctions where id = p_auction for update;
  if not found then raise exception '경매를 찾을 수 없어요'; end if;
  if not public.is_class_teacher(v_auction.class_id) then raise exception '권한이 없어요'; end if;
  if v_auction.status <> 'open' then raise exception '입찰 중인 경매만 마감할 수 있어요'; end if;

  for v_lot in select l.*, i.name as item_name from public.auction_lots l join public.items i on i.id = l.item_id
               where l.auction_id = p_auction loop
    v_rank := 0;
    for v_bid in select * from public.bids where lot_id = v_lot.id
                 order by amount desc, updated_at asc limit v_lot.quantity loop
      v_rank := v_rank + 1;
      v_winners := v_winners + 1;
      insert into public.lot_winners (lot_id, student_id, amount, rank)
      values (v_lot.id, v_bid.student_id, v_bid.amount, v_rank);
      if v_auction.mode = 'real' then
        insert into public.coin_ledger (class_id, student_id, amount, type, reason, auction_id)
        values (v_auction.class_id, v_bid.student_id, -v_bid.amount, 'auction_win',
                '낙찰: ' || v_lot.item_name, p_auction);
        insert into public.inventory (class_id, student_id, item_id, lot_id, price_paid)
        values (v_auction.class_id, v_bid.student_id, v_lot.item_id, v_lot.id, v_bid.amount);
      end if;
    end loop;
  end loop;

  update public.auctions set status = 'closed', closed_at = now() where id = p_auction;
  return json_build_object('ok', true, 'winners', v_winners);
end $$;

-- 실행 권한 정리
revoke all on function public.place_bid(uuid, uuid, int) from public, anon, authenticated;
grant execute on function public.place_bid(uuid, uuid, int) to service_role;
revoke all on function public.close_auction(uuid) from public, anon;
grant execute on function public.close_auction(uuid) to authenticated;
