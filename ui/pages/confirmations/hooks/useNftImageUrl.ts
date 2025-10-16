import { useSelector } from 'react-redux';
import { getIpfsGateway } from '../../../selectors';
import useGetAssetImageUrl from '../../../hooks/useGetAssetImageUrl';

export function useNftImageUrl(imageUrl: string) {
  const ipfsGateway = useSelector(getIpfsGateway);
  const nftImageURL = useGetAssetImageUrl(imageUrl, ipfsGateway);

  const isImageHosted = imageUrl && !imageUrl.startsWith('ipfs:');
  const nftItemSrc = isImageHosted ? imageUrl : nftImageURL;

  return nftItemSrc;
}
