const NFT_ALT_TEXT_MAX_LENGTH = 100;

export const nftTruncateAltText = (text: string, maxLength: number) => {
  // if the text is shorter than or equal to maxLength, return it
  if (text.length <= maxLength) {
    return text;
  }

  const truncated = text.substring(0, maxLength);
  const lastSpaceIndex = truncated.lastIndexOf(' ');

  // If there's a space within the truncated text, cut at the last space
  if (lastSpaceIndex > 0) {
    return `${truncated.substring(0, lastSpaceIndex)}...`;
  }

  // If no space is found, return the truncated text with ellipsis
  return `${truncated}...`;
};

type NftImageAltProps = {
  name?: string | null;
  tokenId?: string | number | null;
  description?: string | null;
};
export const getNftImageAlt = ({
  name,
  tokenId,
  description,
}: NftImageAltProps) => {
  // If there is no name, tokenId, or description, return an empty string
  if (!name && !tokenId && !description) {
    return '';
  }

  // if name or tokenId is undefined, don't include them in the alt text
  const altText = description ?? `${name ?? ''} ${tokenId ?? ''}`.trim();
  return nftTruncateAltText(altText, NFT_ALT_TEXT_MAX_LENGTH);
};

type NFTImage = string | string[] | undefined | null;
export const getNftImage = (image: NFTImage): string | undefined => {
  if (typeof image === 'string') {
    return image;
  }

  if (Array.isArray(image)) {
    return image[0];
  }

  return undefined;
};
