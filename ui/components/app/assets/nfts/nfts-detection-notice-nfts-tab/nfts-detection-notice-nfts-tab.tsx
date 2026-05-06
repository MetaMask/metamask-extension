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
import { SECOND } from '../../../../../../shared/constants/time';
import { toast, ToastContent } from '../../../../ui/toast/toast';
import { BannerAlert } from '../../../../component-library';

const NFT_DETECTION_ENABLED_TOAST_ID = 'enabled-nft-auto-detection';
const AUTO_HIDE_TOAST_DELAY = 5 * SECOND;

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
        toast.success(
          <ToastContent
            dataTestId={NFT_DETECTION_ENABLED_TOAST_ID}
            title={t('nftAutoDetectionEnabled')}
          />,
          {
            id: NFT_DETECTION_ENABLED_TOAST_ID,
            duration: AUTO_HIDE_TOAST_DELAY,
          },
        );
        // dispatch action to detect nfts
        dispatch(detectNfts(allChainIds));
      }}
    >
      {t('newNFTDetectedInNFTsTabMessage')}
    </BannerAlert>
  );
}
