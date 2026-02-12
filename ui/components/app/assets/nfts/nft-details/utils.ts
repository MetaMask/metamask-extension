export const MAX_TOKEN_ID_LENGTH = 15;
export const renderShortTokenId = (text: string, chars: number) => {
  if (text.length <= MAX_TOKEN_ID_LENGTH) {
    return text;
  }
  return `${text.slice(0, chars)}...${text.slice(-chars)}`;
};
