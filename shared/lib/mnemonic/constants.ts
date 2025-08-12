/**
 * 0xffff is the max uint16 value. we use it to represent a node that is not a
 * terminal node, i.e., not the last character of a word.
 */
export const NOT_TERMINAL = 0xffff;

export const ERROR_MESSAGE =
  'Invalid mnemonic phrase: The mnemonic phrase contains an unknown word.';
