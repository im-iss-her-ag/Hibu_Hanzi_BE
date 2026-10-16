-- Non-radical components used by the HSK1-2 character structure (data-tools/content/parts-*.txt).
-- Most are phonetic parts: knowing 曷 (hạt) explains both 喝 hát and 渴 khát, and 乍 (sạ)
-- explains 作 tác, 昨 tạc and 怎 chẩm, which is exactly the Han-Viet bridge the app teaches.
-- Safe to rerun.

INSERT INTO components (form, is_radical, han_viet, meaning_vi, stroke_count) VALUES
  ('巳', false, 'tị',    'chi Tị; vốn vẽ bào thai',          3),
  ('丷', false, 'bát',   'dạng nhỏ của 八: tách ra',          2),
  ('亥', false, 'hợi',   'chi Hợi',                          6),
  ('丂', false, 'khảo',  'hơi thở bị nghẹn lại',             2),
  ('曷', false, 'hạt',   'sao, cái gì',                      9),
  ('侯', false, 'hầu',   'tước hầu',                         9),
  ('夬', false, 'quyết', 'quyết đoán; tách ra',              4),
  ('娄', false, 'lâu',   'sao Lâu',                          9),
  ('曼', false, 'mạn',   'dài, mềm mại',                    11),
  ('戋', false, 'tiên',  'nhỏ bé (giản thể của 戔)',          5),
  ('夭', false, 'yêu',   'non trẻ; người nghiêng đầu',        4),
  ('吾', false, 'ngô',   'ta, tôi',                          7),
  ('乍', false, 'sạ',    'chợt, bỗng',                       5),
  ('氐', false, 'đê',    'gốc, đáy',                         5),
  ('奂', false, 'hoán',  'rực rỡ',                           7),
  ('佥', false, 'thiêm', 'đều, cùng nhau',                   7),
  ('妾', false, 'thiếp', 'vợ lẽ',                            8),
  ('圭', false, 'khuê',  'ngọc khuê',                        6),
  ('仑', false, 'luân',  'thứ tự, mạch lạc',                 4),
  ('丩', false, 'củ',    'dây quấn vào nhau',                2),
  ('孰', false, 'thục',  'ai, cái nào',                     11),
  ('甬', false, 'dũng',  'lối đi có tường hai bên',           7),
  ('宛', false, 'uyển',  'uốn khúc, quanh co',                8),
  ('彦', false, 'ngạn',  'người tài giỏi',                    9),
  ('卬', false, 'ngang', 'ngẩng lên',                        4),
  ('戉', false, 'việt',  'cái rìu lớn',                      5),
  ('昭', false, 'chiêu', 'sáng rõ',                          9),
  ('觜', false, 'chuỷ',  'mỏ chim',                         13)
ON CONFLICT (form) DO NOTHING;
