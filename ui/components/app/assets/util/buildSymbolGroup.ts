export const buildSymbolGroup = (symbols: string[]): string => {
  if (symbols.length === 1) {
    return `${symbols[0]} only`;
  } else if (symbols.length === 2) {
    return `${symbols[0]} +${symbols.length - 1} other`;
  } else if (symbols.length > 2) {
    return `${symbols[0]} +${symbols.length - 1} others`;
  }
  return '';
};
