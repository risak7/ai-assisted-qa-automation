/** Curated invalid program name inputs — static sets, not generated. */
export const BLANK_PROGRAM_NAME = '';
export const WHITESPACE_ONLY_PROGRAM_NAME = '   ';
export const OVERLONG_PROGRAM_NAME = 'P'.repeat(256);

export const PROGRAM_NAME_EDGE_CASES = [
  BLANK_PROGRAM_NAME,
  WHITESPACE_ONLY_PROGRAM_NAME,
  'a',
  OVERLONG_PROGRAM_NAME,
] as const;
