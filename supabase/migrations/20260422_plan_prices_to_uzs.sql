alter table public.plans
rename column price_monthly_usd to price_monthly_uzs;

alter table public.plans
alter column price_monthly_uzs type numeric(12,0) using round(price_monthly_uzs * 10000);

alter table public.plans
drop constraint if exists plans_price_monthly_usd_check;

alter table public.plans
add constraint plans_price_monthly_uzs_check check (price_monthly_uzs >= 0);

update public.plans
set price_monthly_uzs = case key
  when 'free_trial' then 0
  when 'basic' then 120000
  when 'pro' then 240000
  when 'premium' then 490000
  else price_monthly_uzs
end;
