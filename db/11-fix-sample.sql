-- Fixes three defects left by 10-sample-reviewed.sql:
--   1. 行 lost its xíng reading: the UPDATE targeted a row the importer never created
--      (it only infers one reading per character), and the INSERT that was meant to add
--      the second reading named háng, which already existed. So 行 kept only háng and
--      had no primary reading at all.
--   2. 息 is stored as xī, not xi, so its UPDATE matched nothing and the character went
--      to 'reviewed' with no Vietnamese meaning.
--   3. 亍 is a part of 行 but is not one of the 214 radicals, so it was missing from
--      components and character_parts.part could not be resolved.
-- Safe to rerun.

-- 1. 亍 as a non-radical component (DESIGN.md §7: components also holds stroke blocks).
INSERT INTO components (form, is_radical, han_viet, meaning_vi, stroke_count, origin_vi, usage_vi, mnemonic_vi)
VALUES ('亍', false, 'xúc', 'bước chân phải', 3,
        'Vẽ bàn chân phải đang bước, đối xứng với 彳 bước chân trái.',
        'Hầu như chỉ gặp trong 行 hành: 彳 và 亍 ghép thành ngã tư đường.',
        '"Xúc" đi cặp với "xích" (彳): xích trái, xúc phải.')
ON CONFLICT (form) DO NOTHING;

-- 2. 行 is the polyphone DESIGN.md §7 uses as its example. xíng is the primary reading.
INSERT INTO character_readings (char_id, pinyin, han_viet, meaning_vi, is_primary)
SELECT c.id, 'xíng', 'hành', 'đi; được, ổn', true
FROM characters c WHERE c.hanzi = '行'
ON CONFLICT (char_id, pinyin) DO UPDATE SET
  han_viet = EXCLUDED.han_viet, meaning_vi = EXCLUDED.meaning_vi, is_primary = true;

-- háng stays as the secondary reading (银行 picks it positionally, not by is_primary).
UPDATE character_readings AS r SET is_primary = false
FROM characters c WHERE c.id = r.char_id AND c.hanzi = '行' AND r.pinyin = 'háng';

-- 3. 息: match the pinyin the importer actually stored.
UPDATE character_readings AS r
   SET han_viet = 'tức', meaning_vi = 'hơi thở; nghỉ; tin tức'
FROM characters c
WHERE c.id = r.char_id AND c.hanzi = '息' AND r.pinyin IN ('xī', 'xi');
