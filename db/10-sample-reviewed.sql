-- A worked example of finished editorial content: the Vietnamese meaning, Han-Viet, chiet tu
-- and parts for six characters and three words, flipped to 'reviewed' so the full lookup chain
-- (word -> characters -> radical and parts -> meaning) can be exercised end to end.
-- This is the shape every row should reach; see data-tools/README.md for the remaining work.
-- Safe to rerun.

-- Radical, chiet tu and stroke count.
UPDATE characters AS c SET
  radical       = v.radical,
  chiet_tu      = v.chiet_tu,
  chiet_tu_type = v.chiet_tu_type,
  stroke_count  = v.stroke_count,
  status        = 'reviewed'
FROM (VALUES
  ('好', '女', 'Có vợ (女) có con (子) là tốt',                        'mnemonic',  6),
  ('明', '日', 'Mặt trời (日) và mặt trăng (月) cùng chiếu thì sáng',   'mnemonic',  8),
  ('休', '亻', 'Người (亻) dựa vào gốc cây (木) để nghỉ',               'etymology', 6),
  ('行', '彳', 'Ngã tư đường: 彳 bước chân trái, 亍 bước chân phải',    'etymology', 6),
  ('银', '钅', 'Kim loại (钅) màu trắng sáng: bạc',                     'mnemonic', 11),
  ('天', '大', 'Người (大) có một vạch trên đầu: khoảng trời phía trên','etymology', 4),
  ('息', '心', 'Hơi thở từ mũi (自) xuống tim (心): nghỉ, tin tức',     'etymology', 10)
) AS v(hanzi, radical, chiet_tu, chiet_tu_type, stroke_count)
WHERE c.hanzi = v.hanzi;

-- Parts. Entered by hand (DESIGN.md §9: not derived from Make Me a Hanzi).
DELETE FROM character_parts WHERE char_id IN (SELECT id FROM characters WHERE hanzi IN ('好','明','休','行','银','天','息'));
INSERT INTO character_parts (char_id, position, part)
SELECT c.id, v.position, v.part
FROM (VALUES
  ('好', 1, '女'), ('好', 2, '子'),
  ('明', 1, '日'), ('明', 2, '月'),
  ('休', 1, '亻'), ('休', 2, '木'),
  ('行', 1, '彳'), ('行', 2, '亍'),
  ('银', 1, '钅'), ('银', 2, '艮'),
  ('天', 1, '一'), ('天', 2, '大'),
  ('息', 1, '自'), ('息', 2, '心')
) AS v(hanzi, position, part)
JOIN characters c ON c.hanzi = v.hanzi;

-- Readings. 行 is the polyphone DESIGN.md §7 uses as its example: xíng is the primary one.
UPDATE character_readings AS r SET han_viet = v.han_viet, meaning_vi = v.meaning_vi, is_primary = v.is_primary
FROM (VALUES
  ('好', 'hǎo',  'hảo',   'tốt, hay',                 true),
  ('明', 'míng', 'minh',  'sáng, rõ',                 true),
  ('休', 'xiū',  'hưu',   'nghỉ ngơi',                true),
  ('行', 'xíng', 'hành',  'đi; được, ổn',             true),
  ('行', 'háng', 'hàng',  'hàng lối; ngành nghề',     false),
  ('银', 'yín',  'ngân',  'bạc',                      true),
  ('天', 'tiān', 'thiên', 'trời; ngày',               true),
  ('息', 'xi',   'tức',   'hơi thở; nghỉ; tin tức',   true)
) AS v(hanzi, pinyin, han_viet, meaning_vi, is_primary)
JOIN characters c ON c.hanzi = v.hanzi
WHERE r.char_id = c.id AND r.pinyin = v.pinyin;

-- 行 needs its second reading; the import only created the primary one.
INSERT INTO character_readings (char_id, pinyin, han_viet, meaning_vi, is_primary)
SELECT c.id, 'háng', 'hàng', 'hàng lối; ngành nghề', false
FROM characters c WHERE c.hanzi = '行'
ON CONFLICT (char_id, pinyin) DO NOTHING;

UPDATE words AS w SET han_viet = v.han_viet, meaning_vi = v.meaning_vi, status = 'reviewed'
FROM (VALUES
  ('银行', 'ngân hàng',   'ngân hàng (nơi gửi tiền)'),
  ('休息', 'hưu tức',     'nghỉ ngơi'),
  ('明天', 'minh thiên',  'ngày mai')
) AS v(word, han_viet, meaning_vi)
WHERE w.word = v.word;
