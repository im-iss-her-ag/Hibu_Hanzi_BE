// Mirrors the server schema in DESIGN.md §7. Server-only columns (status, deleted_at, updated_at) are left out.

export type HskLevel = 1 | 2 | 3 | 4 | 5 | 6
// HSK 3.0 groups its advanced levels 7–9 into one band, stored as 7.
export type Hsk3Level = HskLevel | 7
export type HskStandard = '2.0' | '3.0'

// 'mnemonic' = folk memory aid, 'etymology' = real origin. The UI labels them differently.
export type ChietTuType = 'mnemonic' | 'etymology'

// Anything that is not a standalone character: the 214 radicals, their variants (氵), and shapes like 卩.
export interface Component {
  id: number
  form: string
  variantOf: string | null
  isRadical: boolean
  nameVi: string | null
  hanViet: string | null
  meaningVi: string | null
  strokeCount: number | null
}

export interface CharacterReading {
  pinyin: string
  hanViet: string | null
  meaningVi: string
  isPrimary: boolean
}

export interface CharacterPart {
  part: string
  position: number
}

export interface Character {
  id: number
  hanzi: string
  traditional: string | null
  radical: string | null
  chietTu: string | null
  chietTuType: ChietTuType | null
  strokeCount: number | null
  hsk2Level: HskLevel | null
  hsk3Level: Hsk3Level | null
  readings: CharacterReading[]
  parts: CharacterPart[]
}

export interface Word {
  id: number
  word: string
  traditional: string | null
  pinyin: string
  hanViet: string | null
  meaningVi: string
  hsk2Level: HskLevel | null
  hsk3Level: Hsk3Level | null
}

// --- API responses (DESIGN.md §6) ---

export interface PartInfo {
  part: string
  hanViet: string | null
  meaningVi: string | null
  label: string | null
}

export interface CharacterDetail {
  character: Character
  radical: PartInfo | null
  parts: PartInfo[]
  words?: Word[]
}

export interface WordCharacter {
  hanzi: string
  character: Character | null
  // The reading this character takes inside the word (行 in 银行 → háng).
  reading: CharacterReading | null
}

export interface WordDetail {
  word: Word
  characters: WordCharacter[]
}

// Basic bundle: characters carry readings and levels only; chiet tu and parts come from /characters/:hanzi.
export type BundleCharacter = Pick<Character, 'hanzi' | 'traditional' | 'hsk2Level' | 'hsk3Level' | 'readings'>

export interface Bundle {
  version: string
  characters: BundleCharacter[]
  words: Word[]
  // Rows removed from the bundle since `since`; the client deletes them from its local copy.
  removed: { characters: string[]; words: string[] }
}
