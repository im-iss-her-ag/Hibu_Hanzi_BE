-- Sample data for development only. Real data comes from data-tools.

INSERT INTO components (form, variant_of, is_radical, name_vi, han_viet, meaning_vi, stroke_count) VALUES
  ('女', NULL, true, 'bộ Nữ', 'nữ', 'phụ nữ', 3),
  ('子', NULL, true, 'bộ Tử', 'tử', 'con', 3),
  ('日', NULL, true, 'bộ Nhật', 'nhật', 'mặt trời', 4),
  ('月', NULL, true, 'bộ Nguyệt', 'nguyệt', 'mặt trăng', 4),
  ('亻', '人', true, 'bộ Nhân đứng', 'nhân', 'người', 2),
  ('木', NULL, true, 'bộ Mộc', 'mộc', 'cây', 4),
  ('彳', NULL, true, 'bộ Xích', 'xích', 'bước chân trái', 3),
  ('钅', '金', true, 'bộ Kim', 'kim', 'kim loại', 5),
  ('艮', NULL, true, 'bộ Cấn', 'cấn', 'dừng lại', 6),
  ('亍', NULL, false, NULL, 'xúc', 'bước chân phải', 3);

INSERT INTO characters (hanzi, traditional, radical, chiet_tu, chiet_tu_type, stroke_count, hsk2_level, status) VALUES
  ('好', NULL, '女', 'Có vợ (女) có con (子) là tốt', 'mnemonic', 6, 1, 'reviewed'),
  ('明', NULL, '日', 'Mặt trời (日) và mặt trăng (月) cùng chiếu thì sáng', 'mnemonic', 8, 1, 'reviewed'),
  ('休', NULL, '亻', 'Người (亻) dựa vào gốc cây (木) để nghỉ', 'etymology', 6, 2, 'reviewed'),
  ('行', NULL, '彳', 'Ngã tư đường: 彳 bước chân trái, 亍 bước chân phải', 'etymology', 6, 1, 'reviewed'),
  ('银', '銀', '钅', 'Kim loại (钅) màu trắng sáng: bạc', 'mnemonic', 11, 3, 'reviewed'),
  ('林', NULL, '木', 'Hai cây (木木) đứng cạnh nhau thành rừng', 'etymology', 8, NULL, 'draft');

INSERT INTO character_readings (char_id, pinyin, han_viet, meaning_vi, is_primary)
SELECT c.id, r.pinyin, r.han_viet, r.meaning_vi, r.is_primary
FROM (VALUES
  ('好', 'hǎo', 'hảo', 'tốt, hay', true),
  ('明', 'míng', 'minh', 'sáng, rõ', true),
  ('休', 'xiū', 'hưu', 'nghỉ ngơi', true),
  ('行', 'xíng', 'hành', 'đi; được, ổn', true),
  ('行', 'háng', 'hàng', 'hàng lối; ngành nghề', false),
  ('银', 'yín', 'ngân', 'bạc', true),
  ('林', 'lín', 'lâm', 'rừng', true)
) AS r(hanzi, pinyin, han_viet, meaning_vi, is_primary)
JOIN characters c ON c.hanzi = r.hanzi;

INSERT INTO character_parts (char_id, position, part)
SELECT c.id, p.position, p.part
FROM (VALUES
  ('好', 1, '女'), ('好', 2, '子'),
  ('明', 1, '日'), ('明', 2, '月'),
  ('休', 1, '亻'), ('休', 2, '木'),
  ('行', 1, '彳'), ('行', 2, '亍'),
  ('银', 1, '钅'), ('银', 2, '艮'),
  ('林', 1, '木'), ('林', 2, '木')
) AS p(hanzi, position, part)
JOIN characters c ON c.hanzi = p.hanzi;

INSERT INTO words (word, traditional, pinyin, han_viet, meaning_vi, hsk2_level, hsk3_level, status) VALUES
  ('银行', '銀行', 'yín háng', 'ngân hàng', 'ngân hàng', 3, 2, 'reviewed'),
  ('休息', NULL, 'xiū xi', 'hưu tức', 'nghỉ ngơi', 2, 1, 'reviewed'),
  ('明天', NULL, 'míng tiān', 'minh thiên', 'ngày mai', 1, 1, 'reviewed');
