import { useState, useEffect } from 'react';
import { getAssetImageURL } from '../helpers/utils/util';

const useGetAssetImageUrl = (
  image: string | undefined,
  ipfsGateway: string,
) => {
  const [imageUrl, setImageUrl] = useState<string>('');

  useEffect(() => {
    const getAssetImgUrl = async () => {
      const assetImageUrl = await getAssetImageURL(image, ipfsGateway);
      setImageUrl(assetImageUrl);
    };

    // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31878
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    getAssetImgUrl();
  }, [image, ipfsGateway]);

  return imageUrl;
};

export default useGetAssetImageUrl;
