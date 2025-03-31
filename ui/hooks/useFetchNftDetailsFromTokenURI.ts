import { useState, useEffect } from 'react';

const useFetchNftDetailsFromTokenURI = (
  tokenURI: string | undefined | null,
) => {
  const [image, setImage] = useState<string>('');
  const [name, setName] = useState<string>('');

  useEffect(() => {
    const useFetchImage = async () => {
      if (!tokenURI) {
        return;
      }

      const response = await fetch(tokenURI);
      if (!response.ok) {
        return;
      }
      try {
        let rawData = await response.text();
        console.log('Raw Response:', rawData);
        // Remove trailing commas before parsing
        // eslint-disable-next-line require-unicode-regexp
        rawData = rawData.replace(/,\s*}/g, '}').replace(/,\s*\]/g, ']');

        // Try parsing JSON
        const data = JSON.parse(rawData);
        console.log('Parsed JSON:', data);
        console.log('🚀 ~ useFetchImage ~ data::::::::::::', data);
        setImage(data.image);
        setName(data.name);
      } catch {
        // ignore
      }
    };

    useFetchImage();
  }, [tokenURI]);

  return { image, name };
};

export default useFetchNftDetailsFromTokenURI;
