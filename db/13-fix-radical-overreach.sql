-- 12-simplified-radicals.sql matched on the radical list instead of honouring Unihan's
-- apostrophe, so it also rewrote 18 characters that keep the FULL radical form even in
-- simplified script: 言 itself is radical 言 (not 讠), and 累/素/紫/繁/索/紊/絮/系/紧 carry
-- 糸 whole rather than 纟, as do 食/餐 (食, not 饣), 金 (金, not 钅) and 警/誓/誉/譬 (言).
-- Restore the Kangxi form for exactly those rows. Safe to rerun.

UPDATE characters AS c SET radical = v.radical
FROM (VALUES
  ('累', '糸'), ('系', '糸'), ('紧', '糸'), ('繁', '糸'), ('索', '糸'),
  ('紫', '糸'), ('素', '糸'), ('紊', '糸'), ('絮', '糸'),
  ('餐', '食'), ('食', '食'),
  ('言', '言'), ('警', '言'), ('誉', '言'), ('譬', '言'), ('誓', '言'),
  ('金', '金'), ('鉴', '金')
) AS v(hanzi, radical)
WHERE c.hanzi = v.hanzi AND c.deleted_at IS NULL AND c.radical <> v.radical;
