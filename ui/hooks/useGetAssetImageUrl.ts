import { useState, useEffect } from 'react';
import { getAssetImageURL } from '../helpers/utils/util';

const useGetAssetImageUrl = (
  image: string | undefined,
  ipfsGateway: string,
) => {
  const [imageUrl, setImageUrl] = useState<string>('');

  useEffect(() => {
    let isUnmounted = false;

    const getAssetImgUrl = async () => {
      try {
        const assetImageUrl = await getAssetImageURL(image, ipfsGateway);
        if (!isUnmounted) {
          setImageUrl(assetImageUrl);
        }
      } catch {
        if (!isUnmounted) {
          setImageUrl('');
        }
      }
    };

    getAssetImgUrl();

    return () => {
      isUnmounted = true;
    };
  }, [image, ipfsGateway]);

  return imageUrl;
};

export default useGetAssetImageUrl;
