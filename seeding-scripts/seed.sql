-- Sweety mock data for the Docker Postgres.
-- Safe to re-run: it first removes earlier mock accounts (emails ending in @sweety.test)
-- and leaves every other account untouched.
--
-- Accounts (password for all: Password@123)
--   Doctors : ananya.mehta@sweety.test, vikram.rao@sweety.test
--   Patients: rahul.sharma, priya.nair, arjun.verma   -> Dr. Ananya Mehta
--             sneha.iyer, mohit.gupta, kabir.singh    -> Dr. Vikram Rao
--   (kabir.singh has no readings, to show the empty states)
--
-- Readings: the last 90 days up to now (Asia/Kolkata), ~85% of slots filled,
-- each patient with a different level of control.

\set ON_ERROR_STOP on
\set pw '$2b$10$4Bvb.TnsyfB/VjSzrBWpweN0gpAGYlB6EDqZM2p6y7uERp2io8VSC'

begin;

-- Patients before doctors: assigned_doctor references users.id. Readings cascade.
delete from users where email like '%@sweety.test' and role_id = 1;
delete from users where email like '%@sweety.test';

insert into users (full_name, email, password_hash, phone_number, gender, role_id) values
  ('Dr. Ananya Mehta', 'ananya.mehta@sweety.test', :'pw', '+91 98100 11001', 'female', 2),
  ('Dr. Vikram Rao',   'vikram.rao@sweety.test',   :'pw', '+91 98100 11002', 'male',   2);

insert into users (full_name, email, password_hash, phone_number, date_of_birth, gender, blood_group, height_cm, role_id, assigned_doctor)
select p.full_name, p.email, :'pw', p.phone, p.dob::date, p.gender, p.blood_group, p.height_cm, 1, d.id
from (values
  ('Rahul Sharma', 'rahul.sharma@sweety.test', '+91 98200 22001', '1968-04-12', 'male',   'B+',  172.0, 'ananya.mehta@sweety.test'),
  ('Priya Nair',   'priya.nair@sweety.test',   '+91 98200 22002', '1975-09-03', 'female', 'O+',  160.5, 'ananya.mehta@sweety.test'),
  ('Arjun Verma',  'arjun.verma@sweety.test',  '+91 98200 22003', '1959-12-21', 'male',   'A-',  168.0, 'ananya.mehta@sweety.test'),
  ('Sneha Iyer',   'sneha.iyer@sweety.test',   '+91 98200 22004', '1988-06-30', 'female', 'AB+', 158.0, 'vikram.rao@sweety.test'),
  ('Mohit Gupta',  'mohit.gupta@sweety.test',  '+91 98200 22005', '1964-02-14', 'male',   'O-',  175.5, 'vikram.rao@sweety.test'),
  ('Kabir Singh',  'kabir.singh@sweety.test',  '+91 98200 22006', '1992-11-08', 'male',   'B-',  180.0, 'vikram.rao@sweety.test')
) as p(full_name, email, phone, dob, gender, blood_group, height_cm, doctor_email)
join users d on d.email = p.doctor_email;

-- offset_mgdl shifts a patient's typical values: negative = well controlled / prone to lows.
with profile(email, offset_mgdl) as (values
  ('rahul.sharma@sweety.test', -10),
  ('priya.nair@sweety.test',     5),
  ('arjun.verma@sweety.test',   55),
  ('sneha.iyer@sweety.test',   -35),
  ('mohit.gupta@sweety.test',   25)
),
slots(time_slot, base, at) as (values
  (0, 100, time '07:30'),  -- Morning (fasting)
  (1, 150, time '10:00'),  -- After breakfast
  (2, 155, time '14:30'),  -- After lunch
  (3, 145, time '21:00')   -- After dinner
),
days as (
  select d::date as reading_date
  from generate_series((now() at time zone 'Asia/Kolkata')::date - 90,
                       (now() at time zone 'Asia/Kolkata')::date, interval '1 day') d
),
rows as (
  select u.id as user_id, days.reading_date, s.time_slot,
         least(600, greatest(40, s.base + p.offset_mgdl + floor(random() * 61 - 30)::int)) as glucose_value,
         ((days.reading_date + s.at + make_interval(mins => floor(random() * 40)::int))
           at time zone 'Asia/Kolkata') as recorded_at
  from profile p
  join users u on u.email = p.email
  cross join days
  cross join slots s
  where random() > 0.15
)
insert into glucose_reading (user_id, reading_date, time_slot, glucose_value, created_at, updated_at)
select user_id, reading_date, time_slot, glucose_value, recorded_at, recorded_at
from rows
where recorded_at <= now();

commit;

select u.full_name, r.role_name, count(g.id) as readings
from users u
join roles r on r.id = u.role_id
left join glucose_reading g on g.user_id = u.id
where u.email like '%@sweety.test'
group by u.id, u.full_name, r.role_name
order by r.role_name desc, u.full_name;
