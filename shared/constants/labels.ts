// The character limit on ENS names, nicknames and addresses before we truncate
export const TRUNCATED_NAME_CHAR_LIMIT = 11;

// The number of characters to slice from the beginning of an EVM address for truncated format.
// Includes the "0x" prefix, so this is 5 address characters plus "0x":
// `${TRUNCATED_ADDRESS_START_CHARS}...${TRUNCATED_ADDRESS_END_CHARS}`
export const TRUNCATED_ADDRESS_START_CHARS = 7;

// Non-EVM addresses have no "0x" prefix, so the truncated prefix is 5 characters.
export const TRUNCATED_NON_EVM_ADDRESS_START_CHARS = 5;

// The number of characters to slice from the end of an address for truncated format:
// `${TRUNCATED_ADDRESS_START_CHARS}...${TRUNCATED_ADDRESS_END_CHARS}`
export const TRUNCATED_ADDRESS_END_CHARS = 5;
