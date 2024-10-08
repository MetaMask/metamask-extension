import { useState, useEffect } from 'react';
import { getAssetImageURL } from '../helpers/utils/util';

const useGetAssetImageUrl = (image: string | null, ipfsGateway: string) => {
  const [imageUrl, setImageUrl] = useState<string>('');

  useEffect(() => {
    const getAssetImgUrl = async () => {
      const assetImageUrl = await getAssetImageURL(image, ipfsGateway);
      setImageUrl(assetImageUrl);
    };

    getAssetImgUrl();
  }, [image, ipfsGateway]);

  return imageUrl;
};

export default useGetAssetImageUrl;
