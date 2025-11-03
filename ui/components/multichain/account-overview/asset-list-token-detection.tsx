import { useAssetListTokenDetection } from '../../app/assets/hooks';

/**
 * Wraps useAssetListTokenDetection to avoid unnecessary cascading re-renders
 */
export const AssetListTokenDetection = () => {
  useAssetListTokenDetection();

  return null;
};
