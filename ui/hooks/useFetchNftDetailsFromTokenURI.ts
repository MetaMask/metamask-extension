import { useQuery } from '@tanstack/react-query';

type NftTokenURIDetails = {
  image: string;
  name: string;
};

async function fetchNftDetailsFromTokenURI(
  tokenURI: string,
): Promise<NftTokenURIDetails> {
  const response = await fetch(tokenURI);
  if (!response.ok) {
    throw new Error(`Failed to fetch token URI: ${response.status}`);
  }

  let rawData = await response.text();
  // Remove trailing commas before parsing
  // eslint-disable-next-line require-unicode-regexp
  rawData = rawData.replace(/,\s*}/g, '}').replace(/,\s*\]/g, ']');

  const data = JSON.parse(rawData);

  return {
    image: typeof data.image === 'string' ? data.image : '',
    name: typeof data.name === 'string' ? data.name : '',
  };
}

const EMPTY_RESULT: NftTokenURIDetails = { image: '', name: '' };

const useFetchNftDetailsFromTokenURI = (
  tokenURI: string | undefined | null,
) => {
  const { data = EMPTY_RESULT, ...rest } = useQuery({
    queryKey: ['nftTokenURIDetails', tokenURI],
    queryFn: () => fetchNftDetailsFromTokenURI(tokenURI as string),
    enabled: Boolean(tokenURI),
    staleTime: Infinity,
    cacheTime: 30 * 60 * 1000,
    retry: false,
  });

  return { ...data, ...rest };
};

export default useFetchNftDetailsFromTokenURI;
