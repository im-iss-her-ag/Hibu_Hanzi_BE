-- Word-level pinyin errors from the HSK source, found by matching every syllable of the
-- HSK1-2 words against the hand-written readings (data-tools/content/readings-*.txt).
-- Safe to rerun.

-- 1. Single-character words took the source's first listed reading, which is sometimes a
--    surname or rare one (听 yǐn, 读 dòu, 鸟 diǎo, 过 Guō, 上 shǎng). Where a one-character
--    word's pinyin matches none of the character's readings, use its primary reading.
UPDATE words AS w SET pinyin = r.pinyin
FROM characters c
JOIN character_readings r ON r.char_id = c.id AND r.is_primary AND r.deleted_at IS NULL
WHERE c.hanzi = w.word
  AND char_length(w.word) = 1
  AND w.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM character_readings x
    WHERE x.char_id = c.id AND x.deleted_at IS NULL AND x.pinyin = lower(w.pinyin)
  );

-- 2. 便宜 is pián yi (cheap), not biàn yí.
UPDATE words SET pinyin = 'pián yi' WHERE word = '便宜' AND pinyin <> 'pián yi';

-- 3. 好 also reads hào in 爱好 (hobby). 好 is already reviewed, so it is added here
--    rather than through the content files, which skip reviewed characters.
INSERT INTO character_readings (char_id, pinyin, han_viet, meaning_vi, is_primary)
SELECT id, 'hào', 'hiếu', 'thích, ham (爱好 sở thích; 好奇 tò mò)', false
FROM characters WHERE hanzi = '好'
ON CONFLICT (char_id, pinyin) DO NOTHING;
