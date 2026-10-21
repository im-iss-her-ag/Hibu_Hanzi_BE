import type { Character, CharacterReading, Component, PartInfo, PartKind, Word } from './types'

export function primaryReading(char: Pick<Character, 'readings'>): CharacterReading | null {
  return char.readings.find((r) => r.isPrimary) ?? char.readings[0] ?? null
}

// Picks the reading a character takes inside a word by matching the word's pinyin syllable
// at the same position (银行 "yín háng" → 行 háng). Falls back to the primary reading when
// syllables don't line up (erhua, tone sandhi on 一/不).
export function readingInWord(
  char: Pick<Character, 'readings'>,
  word: Pick<Word, 'pinyin'>,
  index: number,
): CharacterReading | null {
  const syllable = word.pinyin.trim().toLowerCase().split(/\s+/)[index]
  return char.readings.find((r) => r.pinyin.toLowerCase() === syllable) ?? primaryReading(char)
}

export function splitWord(word: string): string[] {
  return Array.from(word)
}

// A part can be a component (氵) or a character in its own right (女); components win
// because radicals carry the "bộ ..." name learners know them by.
// `radical` is the character's own radical, which is always shown as a radical.
export function describePart(
  part: string,
  components: readonly Component[],
  characters: readonly Pick<Character, 'hanzi' | 'readings'>[],
  radical: string | null = null,
): PartInfo {
  const component = components.find((c) => c.form === part)
  const char = characters.find((c) => c.hanzi === part)
  const reading = char ? primaryReading(char) : null
  const kind: PartKind =
    part === radical || (component?.isRadical && !reading) ? 'radical'
      : reading ? 'character'
        : component?.isRadical ? 'radical' : 'component'
  return {
    part,
    pinyin: component?.pinyin ?? reading?.pinyin ?? null,
    hanViet: component?.hanViet ?? reading?.hanViet ?? null,
    meaningVi: component?.meaningVi ?? reading?.meaningVi ?? null,
    label: component?.nameVi ?? null,
    kind,
  }
}
