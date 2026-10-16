-- The HSK source writes some entries' pinyin with syllables run together (bùyǔ) and tags the
-- 儿 suffix "r5". readingInWord matches syllable i to character i (DESIGN.md §7), so these 29
-- rows are re-spaced by hand - one syllable per character, r5 -> r. Safe to rerun.

UPDATE words AS w SET pinyin = v.pinyin
FROM (VALUES
  ('不一会儿', 'bù yī huǐ r'),
  ('不予',     'bù yǔ'),
  ('不利于',   'bù lì yú'),
  ('不如说',   'bù rú shuō'),
  ('公益性',   'gōng yì xìng'),
  ('名牌儿',   'míng pái r'),
  ('城里',     'chéng lǐ'),
  ('大笔',     'dà bǐ'),
  ('小偷儿',   'xiǎo tōu r'),
  ('很难说',   'hěn nán shuō'),
  ('怀着',     'huái zhe'),
  ('指着',     'zhǐ zhe'),
  ('有劲儿',   'yǒu jìn r'),
  ('有空儿',   'yǒu kòng r'),
  ('没法儿',   'méi fǎ r'),
  ('电动车',   'diàn dòng chē'),
  ('眼里',     'yǎn li'),
  ('着眼于',   'zhuó yǎn yú'),
  ('离谱儿',   'lí pǔ r'),
  ('笑话儿',   'xiào hua r'),
  ('胡同儿',   'hú tòng r'),
  ('能不能',   'néng bù néng'),
  ('致力于',   'zhì lì yú'),
  ('见过',     'jiàn guò'),
  ('说起来',   'shuō qǐ lái'),
  ('贪玩儿',   'tān wán r'),
  ('趁着',     'chèn zhe'),
  ('这时候',   'zhè shí hòu'),
  ('难以想象', 'nán yǐ xiǎng xiàng')
) AS v(word, pinyin)
WHERE w.word = v.word AND w.pinyin <> v.pinyin;
