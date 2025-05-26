import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
import { BannerAlert } from '../../../../component-library';
import { setShowNftDetectionEnablementToast } from '../../../toast-master/utils';

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
        // Show toast
        dispatch(setShowNftDetectionEnablementToast(true));
        // dispatch action to detect nfts
        dispatch(detectNfts(allChainIds));
      }}
    >
      {t('newNFTDetectedInNFTsTabMessage')}
    </BannerAlert>
  );
}
