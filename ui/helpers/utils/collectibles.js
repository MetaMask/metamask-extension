export const getCollectibleImageAlt = ({ name, tokenId, description }) => {
  return description ?? `${name} ${tokenId}`;
};
