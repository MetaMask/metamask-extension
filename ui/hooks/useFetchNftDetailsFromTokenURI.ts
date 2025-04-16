import { useState, useEffect } from 'react';

const useFetchNftDetailsFromTokenURI = (
  tokenURI: string | undefined | null,
) => {
  const [image, setImage] = useState<string>('');
  const [name, setName] = useState<string>('');

  useEffect(() => {
    const fetchRemoteTokenURI = async () => {
      if (!tokenURI) {
        return;
      }

      const response = await fetch(tokenURI);
      if (!response.ok) {
        return;
      }
      try {
        let rawData = await response.text();
        // Remove trailing commas before parsing
        // eslint-disable-next-line require-unicode-regexp
        rawData = rawData.replace(/,\s*}/g, '}').replace(/,\s*\]/g, ']');

        // Try parsing JSON
        const data = JSON.parse(rawData);
        setImage(data.image);
        setName(data.name);
      } catch {
        // ignore
      }
    };

    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31878
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    fetchRemoteTokenURI();
  }, [tokenURI]);

  return { image, name };
};

export default useFetchNftDetailsFromTokenURI;
