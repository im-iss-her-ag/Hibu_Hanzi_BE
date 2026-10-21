-- Links positional variants added with the HSK1-6 content to their base radical, so the radical
-- filter groups them (bộ Thủy lists characters with 水, 氵 and 氺). Safe to rerun.

UPDATE components SET variant_of = v.base
FROM (VALUES ('氺', '水'), ('⺌', '小'), ('⻊', '足'), ('𧾷', '足')) AS v(form, base)
WHERE components.form = v.form AND components.variant_of IS DISTINCT FROM v.base;
