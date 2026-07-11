-- ============================================================
-- Migration 0009: Complete Maharashtra geography
-- All 36 districts + every taluka (tahsil). Idempotent: rows that
-- already exist (from 0006 seed) are skipped by name, not duplicated.
-- Generated 2026-07-11.
-- ============================================================

-- ── Mumbai City (1 talukas) ──
insert into districts (name_en, name_mr, code)
select 'Mumbai City', 'मुंबई शहर', 'MUM'
where not exists (select 1 from districts where name_en = 'Mumbai City');

insert into talukas (district_id, name_en, name_mr, code)
select d.id, v.name_en, v.name_mr, v.code
from districts d
cross join (values
  ('Mumbai', 'मुंबई', 'MUMBAI')
) as v(name_en, name_mr, code)
where d.name_en = 'Mumbai City'
  and not exists (
    select 1 from talukas t where t.district_id = d.id and t.name_en = v.name_en
  );

-- ── Mumbai Suburban (3 talukas) ──
insert into districts (name_en, name_mr, code)
select 'Mumbai Suburban', 'मुंबई उपनगर', 'MSU'
where not exists (select 1 from districts where name_en = 'Mumbai Suburban');

insert into talukas (district_id, name_en, name_mr, code)
select d.id, v.name_en, v.name_mr, v.code
from districts d
cross join (values
  ('Andheri', 'अंधेरी', 'ANDHER'),
  ('Borivali', 'बोरीवली', 'BORIVA'),
  ('Kurla', 'कुर्ला', 'KURLA')
) as v(name_en, name_mr, code)
where d.name_en = 'Mumbai Suburban'
  and not exists (
    select 1 from talukas t where t.district_id = d.id and t.name_en = v.name_en
  );

-- ── Thane (7 talukas) ──
insert into districts (name_en, name_mr, code)
select 'Thane', 'ठाणे', 'THN'
where not exists (select 1 from districts where name_en = 'Thane');

insert into talukas (district_id, name_en, name_mr, code)
select d.id, v.name_en, v.name_mr, v.code
from districts d
cross join (values
  ('Thane', 'ठाणे', 'THANE'),
  ('Kalyan', 'कल्याण', 'KALYAN'),
  ('Murbad', 'मुरबाड', 'MURBAD'),
  ('Bhiwandi', 'भिवंडी', 'BHIWAN'),
  ('Shahapur', 'शहापूर', 'SHAHAP'),
  ('Ulhasnagar', 'उल्हासनगर', 'ULHASN'),
  ('Ambernath', 'अंबरनाथ', 'AMBERN')
) as v(name_en, name_mr, code)
where d.name_en = 'Thane'
  and not exists (
    select 1 from talukas t where t.district_id = d.id and t.name_en = v.name_en
  );

-- ── Palghar (8 talukas) ──
insert into districts (name_en, name_mr, code)
select 'Palghar', 'पालघर', 'PAL'
where not exists (select 1 from districts where name_en = 'Palghar');

insert into talukas (district_id, name_en, name_mr, code)
select d.id, v.name_en, v.name_mr, v.code
from districts d
cross join (values
  ('Palghar', 'पालघर', 'PALGHA'),
  ('Vasai', 'वसई', 'VASAI'),
  ('Dahanu', 'डहाणू', 'DAHANU'),
  ('Talasari', 'तलासरी', 'TALASA'),
  ('Jawhar', 'जव्हार', 'JAWHAR'),
  ('Mokhada', 'मोखाडा', 'MOKHAD'),
  ('Vada', 'वाडा', 'VADA'),
  ('Vikramgad', 'विक्रमगड', 'VIKRAM')
) as v(name_en, name_mr, code)
where d.name_en = 'Palghar'
  and not exists (
    select 1 from talukas t where t.district_id = d.id and t.name_en = v.name_en
  );

-- ── Raigad (15 talukas) ──
insert into districts (name_en, name_mr, code)
select 'Raigad', 'रायगड', 'RGD'
where not exists (select 1 from districts where name_en = 'Raigad');

insert into talukas (district_id, name_en, name_mr, code)
select d.id, v.name_en, v.name_mr, v.code
from districts d
cross join (values
  ('Alibag', 'अलिबाग', 'ALIBAG'),
  ('Pen', 'पेण', 'PEN'),
  ('Murud', 'मुरुड', 'MURUD'),
  ('Panvel', 'पनवेल', 'PANVEL'),
  ('Uran', 'उरण', 'URAN'),
  ('Karjat', 'कर्जत', 'KARJAT'),
  ('Khalapur', 'खालापूर', 'KHALAP'),
  ('Mangaon', 'माणगाव', 'MANGAO'),
  ('Tala', 'तळा', 'TALA'),
  ('Roha', 'रोहा', 'ROHA'),
  ('Sudhagad', 'सुधागड', 'SUDHAG'),
  ('Mahad', 'महाड', 'MAHAD'),
  ('Poladpur', 'पोलादपूर', 'POLADP'),
  ('Shrivardhan', 'श्रीवर्धन', 'SHRIVA'),
  ('Mhasala', 'म्हसळा', 'MHASAL')
) as v(name_en, name_mr, code)
where d.name_en = 'Raigad'
  and not exists (
    select 1 from talukas t where t.district_id = d.id and t.name_en = v.name_en
  );

-- ── Ratnagiri (9 talukas) ──
insert into districts (name_en, name_mr, code)
select 'Ratnagiri', 'रत्नागिरी', 'RTN'
where not exists (select 1 from districts where name_en = 'Ratnagiri');

insert into talukas (district_id, name_en, name_mr, code)
select d.id, v.name_en, v.name_mr, v.code
from districts d
cross join (values
  ('Mandangad', 'मंडणगड', 'MANDAN'),
  ('Dapoli', 'दापोली', 'DAPOLI'),
  ('Khed', 'खेड', 'KHED'),
  ('Chiplun', 'चिपळूण', 'CHIPLU'),
  ('Guhagar', 'गुहागर', 'GUHAGA'),
  ('Sangameshwar', 'संगमेश्वर', 'SANGAM'),
  ('Ratnagiri', 'रत्नागिरी', 'RATNAG'),
  ('Lanja', 'लांजा', 'LANJA'),
  ('Rajapur', 'राजापूर', 'RAJAPU')
) as v(name_en, name_mr, code)
where d.name_en = 'Ratnagiri'
  and not exists (
    select 1 from talukas t where t.district_id = d.id and t.name_en = v.name_en
  );

-- ── Sindhudurg (8 talukas) ──
insert into districts (name_en, name_mr, code)
select 'Sindhudurg', 'सिंधुदुर्ग', 'SIN'
where not exists (select 1 from districts where name_en = 'Sindhudurg');

insert into talukas (district_id, name_en, name_mr, code)
select d.id, v.name_en, v.name_mr, v.code
from districts d
cross join (values
  ('Devgad', 'देवगड', 'DEVGAD'),
  ('Vaibhavwadi', 'वैभववाडी', 'VAIBHA'),
  ('Kankavli', 'कणकवली', 'KANKAV'),
  ('Malvan', 'मालवण', 'MALVAN'),
  ('Sawantwadi', 'सावंतवाडी', 'SAWANT'),
  ('Kudal', 'कुडाळ', 'KUDAL'),
  ('Vengurla', 'वेंगुर्ला', 'VENGUR'),
  ('Dodamarg', 'दोडामार्ग', 'DODAMA')
) as v(name_en, name_mr, code)
where d.name_en = 'Sindhudurg'
  and not exists (
    select 1 from talukas t where t.district_id = d.id and t.name_en = v.name_en
  );

-- ── Pune (14 talukas) ──
insert into districts (name_en, name_mr, code)
select 'Pune', 'पुणे', 'PUN'
where not exists (select 1 from districts where name_en = 'Pune');

insert into talukas (district_id, name_en, name_mr, code)
select d.id, v.name_en, v.name_mr, v.code
from districts d
cross join (values
  ('Pune City', 'पुणे शहर', 'PUNECI'),
  ('Haveli', 'हवेली', 'HAVELI'),
  ('Khed', 'खेड', 'KHED'),
  ('Junnar', 'जुन्नर', 'JUNNAR'),
  ('Ambegaon', 'आंबेगाव', 'AMBEGA'),
  ('Maval', 'मावळ', 'MAVAL'),
  ('Mulshi', 'मुळशी', 'MULSHI'),
  ('Shirur', 'शिरूर', 'SHIRUR'),
  ('Purandar', 'पुरंदर', 'PURAND'),
  ('Velhe', 'वेल्हे', 'VELHE'),
  ('Bhor', 'भोर', 'BHOR'),
  ('Baramati', 'बारामती', 'BARAMA'),
  ('Indapur', 'इंदापूर', 'INDAPU'),
  ('Daund', 'दौंड', 'DAUND')
) as v(name_en, name_mr, code)
where d.name_en = 'Pune'
  and not exists (
    select 1 from talukas t where t.district_id = d.id and t.name_en = v.name_en
  );

-- ── Satara (11 talukas) ──
insert into districts (name_en, name_mr, code)
select 'Satara', 'सातारा', 'SAT'
where not exists (select 1 from districts where name_en = 'Satara');

insert into talukas (district_id, name_en, name_mr, code)
select d.id, v.name_en, v.name_mr, v.code
from districts d
cross join (values
  ('Satara', 'सातारा', 'SATARA'),
  ('Jaoli', 'जावली', 'JAOLI'),
  ('Koregaon', 'कोरेगाव', 'KOREGA'),
  ('Wai', 'वाई', 'WAI'),
  ('Mahabaleshwar', 'महाबळेश्वर', 'MAHABA'),
  ('Khandala', 'खंडाळा', 'KHANDA'),
  ('Phaltan', 'फलटण', 'PHALTA'),
  ('Man', 'माण', 'MAN'),
  ('Khatav', 'खटाव', 'KHATAV'),
  ('Patan', 'पाटण', 'PATAN'),
  ('Karad', 'कराड', 'KARAD')
) as v(name_en, name_mr, code)
where d.name_en = 'Satara'
  and not exists (
    select 1 from talukas t where t.district_id = d.id and t.name_en = v.name_en
  );

-- ── Sangli (10 talukas) ──
insert into districts (name_en, name_mr, code)
select 'Sangli', 'सांगली', 'SGL'
where not exists (select 1 from districts where name_en = 'Sangli');

insert into talukas (district_id, name_en, name_mr, code)
select d.id, v.name_en, v.name_mr, v.code
from districts d
cross join (values
  ('Miraj', 'मिरज', 'MIRAJ'),
  ('Kavathe Mahankal', 'कवठे महांकाळ', 'KAVATH'),
  ('Tasgaon', 'तासगाव', 'TASGAO'),
  ('Jat', 'जत', 'JAT'),
  ('Walwa', 'वाळवा', 'WALWA'),
  ('Shirala', 'शिराळा', 'SHIRAL'),
  ('Khanapur', 'खानापूर', 'KHANAP'),
  ('Atpadi', 'आटपाडी', 'ATPADI'),
  ('Palus', 'पलूस', 'PALUS'),
  ('Kadegaon', 'कडेगाव', 'KADEGA')
) as v(name_en, name_mr, code)
where d.name_en = 'Sangli'
  and not exists (
    select 1 from talukas t where t.district_id = d.id and t.name_en = v.name_en
  );

-- ── Solapur (11 talukas) ──
insert into districts (name_en, name_mr, code)
select 'Solapur', 'सोलापूर', 'SOL'
where not exists (select 1 from districts where name_en = 'Solapur');

insert into talukas (district_id, name_en, name_mr, code)
select d.id, v.name_en, v.name_mr, v.code
from districts d
cross join (values
  ('Solapur North', 'सोलापूर उत्तर', 'SOLAPU'),
  ('Solapur South', 'सोलापूर दक्षिण', 'SOLAP2'),
  ('Akkalkot', 'अक्कलकोट', 'AKKALK'),
  ('Barshi', 'बार्शी', 'BARSHI'),
  ('Mangalvedha', 'मंगळवेढा', 'MANGAL'),
  ('Pandharpur', 'पंढरपूर', 'PANDHA'),
  ('Sangola', 'सांगोला', 'SANGOL'),
  ('Malshiras', 'माळशिरस', 'MALSHI'),
  ('Mohol', 'मोहोळ', 'MOHOL'),
  ('Madha', 'माढा', 'MADHA'),
  ('Karmala', 'करमाळा', 'KARMAL')
) as v(name_en, name_mr, code)
where d.name_en = 'Solapur'
  and not exists (
    select 1 from talukas t where t.district_id = d.id and t.name_en = v.name_en
  );

-- ── Kolhapur (12 talukas) ──
insert into districts (name_en, name_mr, code)
select 'Kolhapur', 'कोल्हापूर', 'KOL'
where not exists (select 1 from districts where name_en = 'Kolhapur');

insert into talukas (district_id, name_en, name_mr, code)
select d.id, v.name_en, v.name_mr, v.code
from districts d
cross join (values
  ('Karvir', 'करवीर', 'KARVIR'),
  ('Panhala', 'पन्हाळा', 'PANHAL'),
  ('Shahuwadi', 'शाहूवाडी', 'SHAHUW'),
  ('Kagal', 'कागल', 'KAGAL'),
  ('Hatkanangale', 'हातकणंगले', 'HATKAN'),
  ('Shirol', 'शिरोळ', 'SHIROL'),
  ('Radhanagari', 'राधानगरी', 'RADHAN'),
  ('Gaganbawada', 'गगनबावडा', 'GAGANB'),
  ('Bhudargad', 'भुदरगड', 'BHUDAR'),
  ('Gadhinglaj', 'गडहिंग्लज', 'GADHIN'),
  ('Chandgad', 'चंदगड', 'CHANDG'),
  ('Ajra', 'आजरा', 'AJRA')
) as v(name_en, name_mr, code)
where d.name_en = 'Kolhapur'
  and not exists (
    select 1 from talukas t where t.district_id = d.id and t.name_en = v.name_en
  );

-- ── Nashik (15 talukas) ──
insert into districts (name_en, name_mr, code)
select 'Nashik', 'नाशिक', 'NSK'
where not exists (select 1 from districts where name_en = 'Nashik');

insert into talukas (district_id, name_en, name_mr, code)
select d.id, v.name_en, v.name_mr, v.code
from districts d
cross join (values
  ('Nashik', 'नाशिक', 'NASHIK'),
  ('Igatpuri', 'इगतपुरी', 'IGATPU'),
  ('Dindori', 'दिंडोरी', 'DINDOR'),
  ('Peth', 'पेठ', 'PETH'),
  ('Trimbakeshwar', 'त्र्यंबकेश्वर', 'TRIMBA'),
  ('Kalwan', 'कळवण', 'KALWAN'),
  ('Deola', 'देवळा', 'DEOLA'),
  ('Surgana', 'सुरगाणा', 'SURGAN'),
  ('Baglan', 'बागलाण', 'BAGLAN'),
  ('Malegaon', 'मालेगाव', 'MALEGA'),
  ('Nandgaon', 'नांदगाव', 'NANDGA'),
  ('Chandwad', 'चांदवड', 'CHANDW'),
  ('Niphad', 'निफाड', 'NIPHAD'),
  ('Sinnar', 'सिन्नर', 'SINNAR'),
  ('Yeola', 'येवला', 'YEOLA')
) as v(name_en, name_mr, code)
where d.name_en = 'Nashik'
  and not exists (
    select 1 from talukas t where t.district_id = d.id and t.name_en = v.name_en
  );

-- ── Dhule (4 talukas) ──
insert into districts (name_en, name_mr, code)
select 'Dhule', 'धुळे', 'DHU'
where not exists (select 1 from districts where name_en = 'Dhule');

insert into talukas (district_id, name_en, name_mr, code)
select d.id, v.name_en, v.name_mr, v.code
from districts d
cross join (values
  ('Dhule', 'धुळे', 'DHULE'),
  ('Sakri', 'साक्री', 'SAKRI'),
  ('Sindkheda', 'शिंदखेडा', 'SINDKH'),
  ('Shirpur', 'शिरपूर', 'SHIRPU')
) as v(name_en, name_mr, code)
where d.name_en = 'Dhule'
  and not exists (
    select 1 from talukas t where t.district_id = d.id and t.name_en = v.name_en
  );

-- ── Nandurbar (6 talukas) ──
insert into districts (name_en, name_mr, code)
select 'Nandurbar', 'नंदुरबार', 'NDB'
where not exists (select 1 from districts where name_en = 'Nandurbar');

insert into talukas (district_id, name_en, name_mr, code)
select d.id, v.name_en, v.name_mr, v.code
from districts d
cross join (values
  ('Nandurbar', 'नंदुरबार', 'NANDUR'),
  ('Navapur', 'नवापूर', 'NAVAPU'),
  ('Shahada', 'शहादा', 'SHAHAD'),
  ('Taloda', 'तळोदा', 'TALODA'),
  ('Akkalkuwa', 'अक्कलकुवा', 'AKKALK'),
  ('Akrani', 'अक्राणी (धडगाव)', 'AKRANI')
) as v(name_en, name_mr, code)
where d.name_en = 'Nandurbar'
  and not exists (
    select 1 from talukas t where t.district_id = d.id and t.name_en = v.name_en
  );

-- ── Jalgaon (15 talukas) ──
insert into districts (name_en, name_mr, code)
select 'Jalgaon', 'जळगाव', 'JLG'
where not exists (select 1 from districts where name_en = 'Jalgaon');

insert into talukas (district_id, name_en, name_mr, code)
select d.id, v.name_en, v.name_mr, v.code
from districts d
cross join (values
  ('Jalgaon', 'जळगाव', 'JALGAO'),
  ('Jamner', 'जामनेर', 'JAMNER'),
  ('Erandol', 'एरंडोल', 'ERANDO'),
  ('Dharangaon', 'धरणगाव', 'DHARAN'),
  ('Bhusawal', 'भुसावळ', 'BHUSAW'),
  ('Raver', 'रावेर', 'RAVER'),
  ('Muktainagar', 'मुक्ताईनगर', 'MUKTAI'),
  ('Bodwad', 'बोदवड', 'BODWAD'),
  ('Yawal', 'यावल', 'YAWAL'),
  ('Amalner', 'अमळनेर', 'AMALNE'),
  ('Parola', 'पारोळा', 'PAROLA'),
  ('Chopda', 'चोपडा', 'CHOPDA'),
  ('Pachora', 'पाचोरा', 'PACHOR'),
  ('Bhadgaon', 'भडगाव', 'BHADGA'),
  ('Chalisgaon', 'चाळीसगाव', 'CHALIS')
) as v(name_en, name_mr, code)
where d.name_en = 'Jalgaon'
  and not exists (
    select 1 from talukas t where t.district_id = d.id and t.name_en = v.name_en
  );

-- ── Ahmednagar (14 talukas) ──
insert into districts (name_en, name_mr, code)
select 'Ahmednagar', 'अहिल्यानगर', 'AHM'
where not exists (select 1 from districts where name_en = 'Ahmednagar');

insert into talukas (district_id, name_en, name_mr, code)
select d.id, v.name_en, v.name_mr, v.code
from districts d
cross join (values
  ('Nagar', 'नगर', 'NAGAR'),
  ('Shevgaon', 'शेवगाव', 'SHEVGA'),
  ('Pathardi', 'पाथर्डी', 'PATHAR'),
  ('Parner', 'पारनेर', 'PARNER'),
  ('Sangamner', 'संगमनेर', 'SANGAM'),
  ('Kopargaon', 'कोपरगाव', 'KOPARG'),
  ('Akole', 'अकोले', 'AKOLE'),
  ('Shrirampur', 'श्रीरामपूर', 'SHRIRA'),
  ('Nevasa', 'नेवासा', 'NEVASA'),
  ('Rahata', 'राहाता', 'RAHATA'),
  ('Rahuri', 'राहुरी', 'RAHURI'),
  ('Shrigonda', 'श्रीगोंदा', 'SHRIGO'),
  ('Karjat', 'कर्जत', 'KARJAT'),
  ('Jamkhed', 'जामखेड', 'JAMKHE')
) as v(name_en, name_mr, code)
where d.name_en = 'Ahmednagar'
  and not exists (
    select 1 from talukas t where t.district_id = d.id and t.name_en = v.name_en
  );

-- ── Aurangabad (9 talukas) ──
insert into districts (name_en, name_mr, code)
select 'Aurangabad', 'छत्रपती संभाजीनगर', 'AUR'
where not exists (select 1 from districts where name_en = 'Aurangabad');

insert into talukas (district_id, name_en, name_mr, code)
select d.id, v.name_en, v.name_mr, v.code
from districts d
cross join (values
  ('Aurangabad', 'छत्रपती संभाजीनगर', 'AURANG'),
  ('Kannad', 'कन्नड', 'KANNAD'),
  ('Soegaon', 'सोयगाव', 'SOEGAO'),
  ('Sillod', 'सिल्लोड', 'SILLOD'),
  ('Phulambri', 'फुलंब्री', 'PHULAM'),
  ('Khuldabad', 'खुलताबाद', 'KHULDA'),
  ('Vaijapur', 'वैजापूर', 'VAIJAP'),
  ('Gangapur', 'गंगापूर', 'GANGAP'),
  ('Paithan', 'पैठण', 'PAITHA')
) as v(name_en, name_mr, code)
where d.name_en = 'Aurangabad'
  and not exists (
    select 1 from talukas t where t.district_id = d.id and t.name_en = v.name_en
  );

-- ── Jalna (8 talukas) ──
insert into districts (name_en, name_mr, code)
select 'Jalna', 'जालना', 'JAL'
where not exists (select 1 from districts where name_en = 'Jalna');

insert into talukas (district_id, name_en, name_mr, code)
select d.id, v.name_en, v.name_mr, v.code
from districts d
cross join (values
  ('Jalna', 'जालना', 'JALNA'),
  ('Bhokardan', 'भोकरदन', 'BHOKAR'),
  ('Jafrabad', 'जाफराबाद', 'JAFRAB'),
  ('Badnapur', 'बदनापूर', 'BADNAP'),
  ('Ambad', 'अंबड', 'AMBAD'),
  ('Ghansawangi', 'घनसावंगी', 'GHANSA'),
  ('Partur', 'परतूर', 'PARTUR'),
  ('Mantha', 'मंठा', 'MANTHA')
) as v(name_en, name_mr, code)
where d.name_en = 'Jalna'
  and not exists (
    select 1 from talukas t where t.district_id = d.id and t.name_en = v.name_en
  );

-- ── Parbhani (9 talukas) ──
insert into districts (name_en, name_mr, code)
select 'Parbhani', 'परभणी', 'PBN'
where not exists (select 1 from districts where name_en = 'Parbhani');

insert into talukas (district_id, name_en, name_mr, code)
select d.id, v.name_en, v.name_mr, v.code
from districts d
cross join (values
  ('Parbhani', 'परभणी', 'PARBHA'),
  ('Sonpeth', 'सोनपेठ', 'SONPET'),
  ('Gangakhed', 'गंगाखेड', 'GANGAK'),
  ('Palam', 'पालम', 'PALAM'),
  ('Purna', 'पूर्णा', 'PURNA'),
  ('Sailu', 'सेलू', 'SAILU'),
  ('Jintur', 'जिंतूर', 'JINTUR'),
  ('Manwath', 'मानवत', 'MANWAT'),
  ('Pathri', 'पाथरी', 'PATHRI')
) as v(name_en, name_mr, code)
where d.name_en = 'Parbhani'
  and not exists (
    select 1 from talukas t where t.district_id = d.id and t.name_en = v.name_en
  );

-- ── Hingoli (5 talukas) ──
insert into districts (name_en, name_mr, code)
select 'Hingoli', 'हिंगोली', 'HIN'
where not exists (select 1 from districts where name_en = 'Hingoli');

insert into talukas (district_id, name_en, name_mr, code)
select d.id, v.name_en, v.name_mr, v.code
from districts d
cross join (values
  ('Hingoli', 'हिंगोली', 'HINGOL'),
  ('Sengaon', 'सेनगाव', 'SENGAO'),
  ('Kalamnuri', 'कळमनुरी', 'KALAMN'),
  ('Basmath', 'वसमत', 'BASMAT'),
  ('Aundha Nagnath', 'औंढा नागनाथ', 'AUNDHA')
) as v(name_en, name_mr, code)
where d.name_en = 'Hingoli'
  and not exists (
    select 1 from talukas t where t.district_id = d.id and t.name_en = v.name_en
  );

-- ── Beed (11 talukas) ──
insert into districts (name_en, name_mr, code)
select 'Beed', 'बीड', 'BED'
where not exists (select 1 from districts where name_en = 'Beed');

insert into talukas (district_id, name_en, name_mr, code)
select d.id, v.name_en, v.name_mr, v.code
from districts d
cross join (values
  ('Beed', 'बीड', 'BEED'),
  ('Ashti', 'आष्टी', 'ASHTI'),
  ('Patoda', 'पाटोदा', 'PATODA'),
  ('Shirur Kasar', 'शिरूर कासार', 'SHIRUR'),
  ('Georai', 'गेवराई', 'GEORAI'),
  ('Majalgaon', 'माजलगाव', 'MAJALG'),
  ('Wadwani', 'वडवणी', 'WADWAN'),
  ('Kaij', 'केज', 'KAIJ'),
  ('Dharur', 'धारूर', 'DHARUR'),
  ('Parli', 'परळी', 'PARLI'),
  ('Ambajogai', 'अंबाजोगाई', 'AMBAJO')
) as v(name_en, name_mr, code)
where d.name_en = 'Beed'
  and not exists (
    select 1 from talukas t where t.district_id = d.id and t.name_en = v.name_en
  );

-- ── Nanded (16 talukas) ──
insert into districts (name_en, name_mr, code)
select 'Nanded', 'नांदेड', 'NND'
where not exists (select 1 from districts where name_en = 'Nanded');

insert into talukas (district_id, name_en, name_mr, code)
select d.id, v.name_en, v.name_mr, v.code
from districts d
cross join (values
  ('Nanded', 'नांदेड', 'NANDED'),
  ('Ardhapur', 'अर्धापूर', 'ARDHAP'),
  ('Mudkhed', 'मुदखेड', 'MUDKHE'),
  ('Bhokar', 'भोकर', 'BHOKAR'),
  ('Umri', 'उमरी', 'UMRI'),
  ('Loha', 'लोहा', 'LOHA'),
  ('Kandhar', 'कंधार', 'KANDHA'),
  ('Kinwat', 'किनवट', 'KINWAT'),
  ('Himayatnagar', 'हिमायतनगर', 'HIMAYA'),
  ('Hadgaon', 'हदगाव', 'HADGAO'),
  ('Mahur', 'माहूर', 'MAHUR'),
  ('Deglur', 'देगलूर', 'DEGLUR'),
  ('Mukhed', 'मुखेड', 'MUKHED'),
  ('Dharmabad', 'धर्माबाद', 'DHARMA'),
  ('Biloli', 'बिलोली', 'BILOLI'),
  ('Naigaon', 'नायगाव', 'NAIGAO')
) as v(name_en, name_mr, code)
where d.name_en = 'Nanded'
  and not exists (
    select 1 from talukas t where t.district_id = d.id and t.name_en = v.name_en
  );

-- ── Latur (10 talukas) ──
insert into districts (name_en, name_mr, code)
select 'Latur', 'लातूर', 'LAT'
where not exists (select 1 from districts where name_en = 'Latur');

insert into talukas (district_id, name_en, name_mr, code)
select d.id, v.name_en, v.name_mr, v.code
from districts d
cross join (values
  ('Latur', 'लातूर', 'LATUR'),
  ('Renapur', 'रेणापूर', 'RENAPU'),
  ('Ahmedpur', 'अहमदपूर', 'AHMEDP'),
  ('Jalkot', 'जळकोट', 'JALKOT'),
  ('Chakur', 'चाकूर', 'CHAKUR'),
  ('Shirur Anantpal', 'शिरूर अनंतपाळ', 'SHIRUR'),
  ('Ausa', 'औसा', 'AUSA'),
  ('Nilanga', 'निलंगा', 'NILANG'),
  ('Deoni', 'देवणी', 'DEONI'),
  ('Udgir', 'उदगीर', 'UDGIR')
) as v(name_en, name_mr, code)
where d.name_en = 'Latur'
  and not exists (
    select 1 from talukas t where t.district_id = d.id and t.name_en = v.name_en
  );

-- ── Dharashiv (8 talukas) ──
insert into districts (name_en, name_mr, code)
select 'Dharashiv', 'धाराशिव', 'DSV'
where not exists (select 1 from districts where name_en = 'Dharashiv');

insert into talukas (district_id, name_en, name_mr, code)
select d.id, v.name_en, v.name_mr, v.code
from districts d
cross join (values
  ('Dharashiv', 'धाराशिव', 'DHARAS'),
  ('Tuljapur', 'तुळजापूर', 'TULJAP'),
  ('Bhum', 'भूम', 'BHUM'),
  ('Paranda', 'परंडा', 'PARAND'),
  ('Washi', 'वाशी', 'WASHI'),
  ('Kalamb', 'कळंब', 'KALAMB'),
  ('Lohara', 'लोहारा', 'LOHARA'),
  ('Umarga', 'उमरगा', 'UMARGA')
) as v(name_en, name_mr, code)
where d.name_en = 'Dharashiv'
  and not exists (
    select 1 from talukas t where t.district_id = d.id and t.name_en = v.name_en
  );

-- ── Amravati (14 talukas) ──
insert into districts (name_en, name_mr, code)
select 'Amravati', 'अमरावती', 'AMR'
where not exists (select 1 from districts where name_en = 'Amravati');

insert into talukas (district_id, name_en, name_mr, code)
select d.id, v.name_en, v.name_mr, v.code
from districts d
cross join (values
  ('Amravati', 'अमरावती', 'AMRAVA'),
  ('Bhatkuli', 'भातकुली', 'BHATKU'),
  ('Nandgaon Khandeshwar', 'नांदगाव खंडेश्वर', 'NANDGA'),
  ('Dharni', 'धारणी', 'DHARNI'),
  ('Chikhaldara', 'चिखलदरा', 'CHIKHA'),
  ('Achalpur', 'अचलपूर', 'ACHALP'),
  ('Chandur Bazar', 'चांदूर बाजार', 'CHANDU'),
  ('Morshi', 'मोर्शी', 'MORSHI'),
  ('Warud', 'वरुड', 'WARUD'),
  ('Teosa', 'तिवसा', 'TEOSA'),
  ('Chandur Railway', 'चांदूर रेल्वे', 'CHAND2'),
  ('Dhamangaon Railway', 'धामणगाव रेल्वे', 'DHAMAN'),
  ('Anjangaon Surji', 'अंजनगाव सुर्जी', 'ANJANG'),
  ('Daryapur', 'दर्यापूर', 'DARYAP')
) as v(name_en, name_mr, code)
where d.name_en = 'Amravati'
  and not exists (
    select 1 from talukas t where t.district_id = d.id and t.name_en = v.name_en
  );

-- ── Akola (7 talukas) ──
insert into districts (name_en, name_mr, code)
select 'Akola', 'अकोला', 'AKL'
where not exists (select 1 from districts where name_en = 'Akola');

insert into talukas (district_id, name_en, name_mr, code)
select d.id, v.name_en, v.name_mr, v.code
from districts d
cross join (values
  ('Akola', 'अकोला', 'AKOLA'),
  ('Akot', 'अकोट', 'AKOT'),
  ('Telhara', 'तेल्हारा', 'TELHAR'),
  ('Balapur', 'बाळापूर', 'BALAPU'),
  ('Patur', 'पातूर', 'PATUR'),
  ('Murtijapur', 'मूर्तिजापूर', 'MURTIJ'),
  ('Barshitakli', 'बार्शीटाकळी', 'BARSHI')
) as v(name_en, name_mr, code)
where d.name_en = 'Akola'
  and not exists (
    select 1 from talukas t where t.district_id = d.id and t.name_en = v.name_en
  );

-- ── Washim (6 talukas) ──
insert into districts (name_en, name_mr, code)
select 'Washim', 'वाशिम', 'WSM'
where not exists (select 1 from districts where name_en = 'Washim');

insert into talukas (district_id, name_en, name_mr, code)
select d.id, v.name_en, v.name_mr, v.code
from districts d
cross join (values
  ('Washim', 'वाशिम', 'WASHIM'),
  ('Malegaon', 'मालेगाव', 'MALEGA'),
  ('Risod', 'रिसोड', 'RISOD'),
  ('Mangrulpir', 'मंगरुळपीर', 'MANGRU'),
  ('Karanja', 'कारंजा', 'KARANJ'),
  ('Manora', 'मानोरा', 'MANORA')
) as v(name_en, name_mr, code)
where d.name_en = 'Washim'
  and not exists (
    select 1 from talukas t where t.district_id = d.id and t.name_en = v.name_en
  );

-- ── Buldhana (13 talukas) ──
insert into districts (name_en, name_mr, code)
select 'Buldhana', 'बुलढाणा', 'BUL'
where not exists (select 1 from districts where name_en = 'Buldhana');

insert into talukas (district_id, name_en, name_mr, code)
select d.id, v.name_en, v.name_mr, v.code
from districts d
cross join (values
  ('Buldhana', 'बुलढाणा', 'BULDHA'),
  ('Chikhli', 'चिखली', 'CHIKHL'),
  ('Deulgaon Raja', 'देऊळगाव राजा', 'DEULGA'),
  ('Jalgaon Jamod', 'जळगाव जामोद', 'JALGAO'),
  ('Sangrampur', 'संग्रामपूर', 'SANGRA'),
  ('Malkapur', 'मलकापूर', 'MALKAP'),
  ('Motala', 'मोताळा', 'MOTALA'),
  ('Nandura', 'नांदुरा', 'NANDUR'),
  ('Khamgaon', 'खामगाव', 'KHAMGA'),
  ('Shegaon', 'शेगाव', 'SHEGAO'),
  ('Mehkar', 'मेहकर', 'MEHKAR'),
  ('Sindkhed Raja', 'सिंदखेड राजा', 'SINDKH'),
  ('Lonar', 'लोणार', 'LONAR')
) as v(name_en, name_mr, code)
where d.name_en = 'Buldhana'
  and not exists (
    select 1 from talukas t where t.district_id = d.id and t.name_en = v.name_en
  );

-- ── Yavatmal (16 talukas) ──
insert into districts (name_en, name_mr, code)
select 'Yavatmal', 'यवतमाळ', 'YVT'
where not exists (select 1 from districts where name_en = 'Yavatmal');

insert into talukas (district_id, name_en, name_mr, code)
select d.id, v.name_en, v.name_mr, v.code
from districts d
cross join (values
  ('Yavatmal', 'यवतमाळ', 'YAVATM'),
  ('Babhulgaon', 'बाभूळगाव', 'BABHUL'),
  ('Kalamb', 'कळंब', 'KALAMB'),
  ('Darwha', 'दारव्हा', 'DARWHA'),
  ('Digras', 'दिग्रस', 'DIGRAS'),
  ('Ner', 'नेर', 'NER'),
  ('Pusad', 'पुसद', 'PUSAD'),
  ('Umarkhed', 'उमरखेड', 'UMARKH'),
  ('Mahagaon', 'महागाव', 'MAHAGA'),
  ('Arni', 'आर्णी', 'ARNI'),
  ('Ghatanji', 'घाटंजी', 'GHATAN'),
  ('Kelapur', 'केळापूर', 'KELAPU'),
  ('Ralegaon', 'राळेगाव', 'RALEGA'),
  ('Maregaon', 'मारेगाव', 'MAREGA'),
  ('Zari Jamani', 'झरी जामणी', 'ZARIJA'),
  ('Wani', 'वणी', 'WANI')
) as v(name_en, name_mr, code)
where d.name_en = 'Yavatmal'
  and not exists (
    select 1 from talukas t where t.district_id = d.id and t.name_en = v.name_en
  );

-- ── Nagpur (14 talukas) ──
insert into districts (name_en, name_mr, code)
select 'Nagpur', 'नागपूर', 'NAG'
where not exists (select 1 from districts where name_en = 'Nagpur');

insert into talukas (district_id, name_en, name_mr, code)
select d.id, v.name_en, v.name_mr, v.code
from districts d
cross join (values
  ('Nagpur Urban', 'नागपूर शहर', 'NAGPUR'),
  ('Nagpur Rural', 'नागपूर ग्रामीण', 'NAGPU2'),
  ('Kamptee', 'कामठी', 'KAMPTE'),
  ('Hingna', 'हिंगणा', 'HINGNA'),
  ('Katol', 'काटोल', 'KATOL'),
  ('Narkhed', 'नरखेड', 'NARKHE'),
  ('Savner', 'सावनेर', 'SAVNER'),
  ('Kalameshwar', 'कळमेश्वर', 'KALAME'),
  ('Ramtek', 'रामटेक', 'RAMTEK'),
  ('Mauda', 'मौदा', 'MAUDA'),
  ('Parseoni', 'पारशिवनी', 'PARSEO'),
  ('Umred', 'उमरेड', 'UMRED'),
  ('Kuhi', 'कुही', 'KUHI'),
  ('Bhiwapur', 'भिवापूर', 'BHIWAP')
) as v(name_en, name_mr, code)
where d.name_en = 'Nagpur'
  and not exists (
    select 1 from talukas t where t.district_id = d.id and t.name_en = v.name_en
  );

-- ── Wardha (8 talukas) ──
insert into districts (name_en, name_mr, code)
select 'Wardha', 'वर्धा', 'WRD'
where not exists (select 1 from districts where name_en = 'Wardha');

insert into talukas (district_id, name_en, name_mr, code)
select d.id, v.name_en, v.name_mr, v.code
from districts d
cross join (values
  ('Wardha', 'वर्धा', 'WARDHA'),
  ('Deoli', 'देवळी', 'DEOLI'),
  ('Seloo', 'सेलू', 'SELOO'),
  ('Arvi', 'आर्वी', 'ARVI'),
  ('Ashti', 'आष्टी', 'ASHTI'),
  ('Karanja', 'कारंजा', 'KARANJ'),
  ('Hinganghat', 'हिंगणघाट', 'HINGAN'),
  ('Samudrapur', 'समुद्रपूर', 'SAMUDR')
) as v(name_en, name_mr, code)
where d.name_en = 'Wardha'
  and not exists (
    select 1 from talukas t where t.district_id = d.id and t.name_en = v.name_en
  );

-- ── Bhandara (7 talukas) ──
insert into districts (name_en, name_mr, code)
select 'Bhandara', 'भंडारा', 'BHN'
where not exists (select 1 from districts where name_en = 'Bhandara');

insert into talukas (district_id, name_en, name_mr, code)
select d.id, v.name_en, v.name_mr, v.code
from districts d
cross join (values
  ('Bhandara', 'भंडारा', 'BHANDA'),
  ('Tumsar', 'तुमसर', 'TUMSAR'),
  ('Mohadi', 'मोहाडी', 'MOHADI'),
  ('Sakoli', 'साकोली', 'SAKOLI'),
  ('Lakhani', 'लाखनी', 'LAKHAN'),
  ('Lakhandur', 'लाखांदूर', 'LAKHA2'),
  ('Pauni', 'पवनी', 'PAUNI')
) as v(name_en, name_mr, code)
where d.name_en = 'Bhandara'
  and not exists (
    select 1 from talukas t where t.district_id = d.id and t.name_en = v.name_en
  );

-- ── Gondia (8 talukas) ──
insert into districts (name_en, name_mr, code)
select 'Gondia', 'गोंदिया', 'GND'
where not exists (select 1 from districts where name_en = 'Gondia');

insert into talukas (district_id, name_en, name_mr, code)
select d.id, v.name_en, v.name_mr, v.code
from districts d
cross join (values
  ('Gondia', 'गोंदिया', 'GONDIA'),
  ('Tirora', 'तिरोडा', 'TIRORA'),
  ('Goregaon', 'गोरेगाव', 'GOREGA'),
  ('Arjuni Morgaon', 'अर्जुनी मोरगाव', 'ARJUNI'),
  ('Deori', 'देवरी', 'DEORI'),
  ('Amgaon', 'आमगाव', 'AMGAON'),
  ('Salekasa', 'सालेकसा', 'SALEKA'),
  ('Sadak Arjuni', 'सडक अर्जुनी', 'SADAKA')
) as v(name_en, name_mr, code)
where d.name_en = 'Gondia'
  and not exists (
    select 1 from talukas t where t.district_id = d.id and t.name_en = v.name_en
  );

-- ── Chandrapur (15 talukas) ──
insert into districts (name_en, name_mr, code)
select 'Chandrapur', 'चंद्रपूर', 'CHN'
where not exists (select 1 from districts where name_en = 'Chandrapur');

insert into talukas (district_id, name_en, name_mr, code)
select d.id, v.name_en, v.name_mr, v.code
from districts d
cross join (values
  ('Chandrapur', 'चंद्रपूर', 'CHANDR'),
  ('Saoli', 'सावली', 'SAOLI'),
  ('Mul', 'मूल', 'MUL'),
  ('Ballarpur', 'बल्लारपूर', 'BALLAR'),
  ('Pombhurna', 'पोंभुर्णा', 'POMBHU'),
  ('Gondpipri', 'गोंडपिपरी', 'GONDPI'),
  ('Warora', 'वरोरा', 'WARORA'),
  ('Chimur', 'चिमूर', 'CHIMUR'),
  ('Bhadravati', 'भद्रावती', 'BHADRA'),
  ('Brahmapuri', 'ब्रह्मपुरी', 'BRAHMA'),
  ('Nagbhid', 'नागभीड', 'NAGBHI'),
  ('Sindewahi', 'सिंदेवाही', 'SINDEW'),
  ('Rajura', 'राजुरा', 'RAJURA'),
  ('Korpana', 'कोरपना', 'KORPAN'),
  ('Jiwati', 'जिवती', 'JIWATI')
) as v(name_en, name_mr, code)
where d.name_en = 'Chandrapur'
  and not exists (
    select 1 from talukas t where t.district_id = d.id and t.name_en = v.name_en
  );

-- ── Gadchiroli (12 talukas) ──
insert into districts (name_en, name_mr, code)
select 'Gadchiroli', 'गडचिरोली', 'GAD'
where not exists (select 1 from districts where name_en = 'Gadchiroli');

insert into talukas (district_id, name_en, name_mr, code)
select d.id, v.name_en, v.name_mr, v.code
from districts d
cross join (values
  ('Gadchiroli', 'गडचिरोली', 'GADCHI'),
  ('Dhanora', 'धानोरा', 'DHANOR'),
  ('Chamorshi', 'चामोर्शी', 'CHAMOR'),
  ('Mulchera', 'मुलचेरा', 'MULCHE'),
  ('Desaiganj', 'देसाईगंज (वडसा)', 'DESAIG'),
  ('Armori', 'आरमोरी', 'ARMORI'),
  ('Kurkheda', 'कुरखेडा', 'KURKHE'),
  ('Korchi', 'कोरची', 'KORCHI'),
  ('Aheri', 'अहेरी', 'AHERI'),
  ('Bhamragad', 'भामरागड', 'BHAMRA'),
  ('Etapalli', 'एटापल्ली', 'ETAPAL'),
  ('Sironcha', 'सिरोंचा', 'SIRONC')
) as v(name_en, name_mr, code)
where d.name_en = 'Gadchiroli'
  and not exists (
    select 1 from talukas t where t.district_id = d.id and t.name_en = v.name_en
  );

-- Totals: 36 districts, 359 talukas.
