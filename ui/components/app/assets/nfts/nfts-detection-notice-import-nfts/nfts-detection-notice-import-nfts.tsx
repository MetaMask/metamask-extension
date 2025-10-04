import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom-v5-compat';
import { BannerAlert } from '../../../../component-library';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { SECURITY_ROUTE } from '../../../../../helpers/constants/routes';

type NftsDetectionNoticeImportNFTsProps = {
  onActionButtonClick: () => void;
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function NftsDetectionNoticeImportNFTs({
  onActionButtonClick,
}: NftsDetectionNoticeImportNFTsProps) {
  const t = useI18nContext();
  const navigate = useNavigate();

  return (
    <BannerAlert
      className="nfts-detection-notice"
      actionButtonLabel={t('selectEnableDisplayMediaPrivacyPreference')}
      actionButtonOnClick={(e) => {
        e.preventDefault();
        navigate(`${SECURITY_ROUTE}#display-nft-media`);
        onActionButtonClick?.();
      }}
    >
      {t('newNFTDetectedInImportNFTsMsg', [
        <b key="new-nft-detected-in-import-nfts-message-strong-text">
          {t('newNFTDetectedInImportNFTsMessageStrongText')}
        </b>,
      ])}
    </BannerAlert>
  );
}

NftsDetectionNoticeImportNFTs.propTypes = {
  onActionButtonClick: PropTypes.func.isRequired,
};
