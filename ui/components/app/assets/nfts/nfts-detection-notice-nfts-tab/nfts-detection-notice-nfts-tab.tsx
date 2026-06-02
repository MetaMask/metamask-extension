import { useDispatch, useSelector } from 'react-redux';
import { toast } from '@metamask/design-system-react';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import {
  getAllChainsToPoll,
  getOpenSeaEnabled,
} from '../../../../../selectors';
import {
  detectNfts,
  setOpenSeaEnabled,
  setUseNftDetection,
} from '../../../../../store/actions';
import { SECOND } from '../../../../../../shared/constants/time';
import { BannerAlert } from '../../../../component-library';
import React from 'react';

const nftDetectionEnabledToastId = 'enabled-nft-auto-detection';
const autoHideToastDelay = 5 * SECOND;

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function NFTsDetectionNoticeNFTsTab() {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const isDisplayNFTMediaToggleEnabled = useSelector(getOpenSeaEnabled);
  const allChainIds = useSelector(getAllChainsToPoll);

  return (
    <BannerAlert
      className="nfts-detection-notice"
      title={t('newNFTsAutodetected')}
      actionButtonLabel={t('selectNFTPrivacyPreference')}
      actionButtonOnClick={() => {
        if (!isDisplayNFTMediaToggleEnabled) {
        dispatch(setOpenSeaEnabled(true));
      }
      dispatch(setUseNftDetection(true));
      toast({
        severity: 'success',
        title: t('nftAutoDetectionEnabled'),
        'data-testid': nftDetectionEnabledToastId,
      });
        // dispatch action to detect nfts
        dispatch(detectNfts(allChainIds));
      }}
    >
      {t('newNFTDetectedInNFTsTabMessage')}
    </BannerAlert>
  );
}
