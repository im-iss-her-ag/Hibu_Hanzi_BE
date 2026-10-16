-- Two positional radical variants the learner sees but components did not have:
--   ⺼ (U+2EBC) = 肉 written as 月: 脑, 脸, 胃, 背. Shown as 月, it would otherwise be
--     explained as "moon", which is wrong.
--   ⻏ (U+2ECF) = 邑 written as 阝 on the right: 都, 部, 那. The plain 阝 already stands for
--     阜 (the left-hand "mound"), and components.form is unique, so the city form uses the
--     dedicated Unicode radical codepoint. Both render the same as 月 / 阝.
-- Characters are then moved onto the variant, except where the full form is visible
-- (肉 itself, 腐). Reviewed rows are left alone. Safe to rerun.

INSERT INTO components (form, variant_of, is_radical, name_vi, han_viet, meaning_vi, stroke_count, position, origin_vi, usage_vi, mnemonic_vi) VALUES
  ('⺼', '肉', true, 'bộ Nhục đứng (dạng 月)', 'nhục', 'thịt, bộ phận cơ thể', 4, 'left',
   'Chữ 肉 vẽ miếng thịt có thớ; khi làm bộ thủ thu gọn lại, viết giống hệt 月.',
   'Chữ có ⺼ phần lớn chỉ bộ phận cơ thể: 脑 não, 脸 mặt, 脚 chân, 胃 dạ dày, 背 lưng.',
   'Trông như 月 (trăng) nhưng là thịt: gặp 月 trong chữ về cơ thể thì đó là "nhục".'),
  ('⻏', '邑', true, 'bộ Ấp (阝 bên phải)', 'ấp', 'thành ấp, vùng đất có người ở', 2, 'right',
   'Chữ 邑 vẽ vùng đất có người quỳ bên dưới: thành ấp; làm bộ thủ thu gọn thành 阝 đặt bên phải.',
   'Luôn đứng bên phải, chữ thường liên quan đến địa danh, vùng đất: 都 đô, 部 bộ, 郊 giao, 郭 quách.',
   '阝 phải là "ấp" (thành), 阝 trái là "phụ" (gò đất): phải thành, trái gò.')
ON CONFLICT (form) DO NOTHING;

UPDATE characters SET radical = '⺼'
WHERE radical = '肉' AND hanzi NOT IN ('肉', '腐') AND deleted_at IS NULL AND status <> 'reviewed';

UPDATE characters SET radical = '⻏'
WHERE radical = '邑' AND hanzi <> '邑' AND deleted_at IS NULL AND status <> 'reviewed';
