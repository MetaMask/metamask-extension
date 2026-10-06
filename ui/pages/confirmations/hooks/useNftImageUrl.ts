import { useSelector } from 'react-redux';
import { getIpfsGateway } from '../../../selectors/selectors';
import useGetAssetImageUrl from '../../../hooks/useGetAssetImageUrl';

export function useNftImageUrl(imageUrl?: string) {
  const ipfsGateway = useSelector(getIpfsGateway);
  const nftImageURL = useGetAssetImageUrl(imageUrl, ipfsGateway);

  const isImageHosted =
    typeof imageUrl === 'string' && !imageUrl.startsWith('ipfs:');
  const nftItemSrc = isImageHosted ? imageUrl : nftImageURL;

  return nftItemSrc;
}
