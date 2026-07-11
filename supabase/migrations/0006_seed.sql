-- ============================================================
-- Migration 0006: Seed data — Maharashtra districts (sample set)
-- and demo talukas for Pune. Full 36-district list can be
-- extended the same way.
-- ============================================================

insert into districts (name_en, name_mr, code) values
  ('Pune',        'पुणे',       'PUN'),
  ('Mumbai City', 'मुंबई शहर',  'MUM'),
  ('Nagpur',      'नागपूर',     'NAG'),
  ('Nashik',      'नाशिक',      'NSK'),
  ('Aurangabad',  'छत्रपती संभाजीनगर', 'AUR'),
  ('Kolhapur',    'कोल्हापूर',   'KOL'),
  ('Satara',      'सातारा',     'SAT'),
  ('Solapur',     'सोलापूर',    'SOL'),
  ('Ahmednagar',  'अहिल्यानगर', 'AHM'),
  ('Thane',       'ठाणे',       'THN');

insert into talukas (district_id, name_en, name_mr, code)
select d.id, t.name_en, t.name_mr, t.code
from districts d,
(values
  ('Haveli',    'हवेली',    'HAV'),
  ('Mulshi',    'मुळशी',    'MUL'),
  ('Baramati',  'बारामती',  'BAR'),
  ('Junnar',    'जुन्नर',   'JUN'),
  ('Shirur',    'शिरूर',    'SHI')
) as t(name_en, name_mr, code)
where d.code = 'PUN';
