-- The 24 characters with no reading after the HSK import: surnames and place names
-- (邓 Đặng, 浙 Chiết, 粤 Việt...). They never stand alone as a word and never line up
-- syllable-for-syllable inside a compound, so the importer cannot infer them.
-- Entered by hand. Han-Viet and meaning are left for the team (DESIGN.md §9).
-- Safe to rerun.

INSERT INTO character_readings (char_id, pinyin, han_viet, is_primary)
SELECT c.id, v.pinyin, v.han_viet, true
FROM (VALUES
  ('澳', 'ào',    'úc'),
  ('曹', 'cáo',   'tào'),
  ('邓', 'dèng',  'đặng'),
  ('冯', 'féng',  'phùng'),
  ('郭', 'guō',   'quách'),
  ('韩', 'hán',   'hàn'),
  ('杭', 'háng',  'hàng'),
  ('沪', 'hù',    'hộ'),
  ('淮', 'huái',  'hoài'),
  ('刘', 'liú',   'lưu'),
  ('吕', 'lǚ',    'lữ'),
  ('孟', 'mèng',  'mạnh'),
  ('潘', 'pān',   'phan'),
  ('浦', 'pǔ',    'phố'),
  ('秦', 'qín',   'tần'),
  ('蜀', 'shǔ',   'thục'),
  ('宋', 'sòng',  'tống'),
  ('魏', 'wèi',   'ngụy'),
  ('吴', 'wú',    'ngô'),
  ('渝', 'yú',    'du'),
  ('袁', 'yuán',  'viên'),
  ('粤', 'yuè',   'việt'),
  ('赵', 'zhào',  'triệu'),
  ('浙', 'zhè',   'chiết')
) AS v(hanzi, pinyin, han_viet)
JOIN characters c ON c.hanzi = v.hanzi
ON CONFLICT (char_id, pinyin) DO NOTHING;
