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

      try {
        const response = await fetch(tokenURI);
        if (!response.ok) {
          return;
        }
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

    fetchRemoteTokenURI();
  }, [tokenURI]);

  return { image, name };
};

export default useFetchNftDetailsFromTokenURI;
