import PropTypes from 'prop-types';
import React from 'react';
import { useHistory } from 'react-router-dom';

import { SECURITY_ROUTE } from '../../../../../helpers/constants/routes';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { BannerAlert } from '../../../../component-library';

type NftsDetectionNoticeImportNFTsProps = {
  onActionButtonClick: () => void;
};

export default function NftsDetectionNoticeImportNFTs({
  onActionButtonClick,
}: NftsDetectionNoticeImportNFTsProps) {
  const t = useI18nContext();
  const history = useHistory();

  return (
    <BannerAlert
      className="nfts-detection-notice"
      actionButtonLabel={t('selectEnableDisplayMediaPrivacyPreference')}
      actionButtonOnClick={(e) => {
        e.preventDefault();
        history.push(`${SECURITY_ROUTE}#display-nft-media`);
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
