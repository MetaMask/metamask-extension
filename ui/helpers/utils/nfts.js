export const getNftImageAlt = ({ name, tokenId, description }) => {
  return description ?? `${name} ${tokenId}`;
};
