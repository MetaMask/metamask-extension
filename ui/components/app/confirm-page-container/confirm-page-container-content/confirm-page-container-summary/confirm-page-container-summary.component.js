/* eslint-disable no-negated-condition */
import React, { useState } from 'react';
import { useSelector } from 'react-redux';

import PropTypes from 'prop-types';
import classnames from 'classnames';

import { toChecksumHexAddress } from '../../../../../../shared/modules/hexstring-utils';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import useAddressDetails from '../../../../../hooks/useAddressDetails';
import { getIpfsGateway } from '../../../../../selectors';

import Identicon from '../../../../ui/identicon';
import InfoTooltip from '../../../../ui/info-tooltip';
import NicknamePopovers from '../../../modals/nickname-popovers';
import Typography from '../../../../ui/typography';
import { TypographyVariant } from '../../../../../helpers/constants/design-system';
import { ORIGIN_METAMASK } from '../../../../../../shared/constants/app';
import SiteOrigin from '../../../../ui/site-origin';
import { getAssetImageURL } from '../../../../../helpers/utils/util';

const ConfirmPageContainerSummary = (props) => {
  const {
    action,
    title,
    titleComponent,
    subtitleComponent,
    hideSubtitle,
    className,
    nonce,
    origin,
    hideTitle,
    image,
    isContractTypeTransaction,
    contractAddress,
  } = props;

  const [showNicknamePopovers, setShowNicknamePopovers] = useState(false);
  const t = useI18nContext();
  const ipfsGateway = useSelector(getIpfsGateway);

  const { toName, isTrusted } = useAddressDetails(contractAddress);
  const checksummedAddress = toChecksumHexAddress(contractAddress);

  const renderImage = () => {
    const imagePath = getAssetImageURL(image, ipfsGateway);

    if (image) {
      return (
        <img
          className="confirm-page-container-summary__icon"
          width={36}
          src={imagePath}
        />
      );
    } else if (contractAddress) {
      return (
        <Identicon
          className="confirm-page-container-summary__icon"
          diameter={36}
          address={contractAddress}
        />
      );
    }
    return null;
  };

  return (
    <div className={classnames('confirm-page-container-summary', className)}>
      {origin === ORIGIN_METAMASK ? null : (
        <SiteOrigin
          className="confirm-page-container-summary__origin"
          siteOrigin={origin}
        />
      )}
      <div className="confirm-page-container-summary__action-row">
        <div className="confirm-page-container-summary__action">
          {isContractTypeTransaction && toName && (
            <span className="confirm-page-container-summary__action__contract-address">
              <button
                className="confirm-page-container-summary__action__contract-address-btn"
                onClick={() => setShowNicknamePopovers(true)}
                role="button"
              >
                {toName}
              </button>
              :
            </span>
          )}
          <span className="confirm-page-container-summary__action__name">
            {action}
          </span>
          {isContractTypeTransaction && isTrusted === false && (
            <InfoTooltip
              position="top"
              contentText={t('unverifiedContractAddressMessage')}
            />
          )}
        </div>
        {nonce && (
          <div className="confirm-page-container-summary__nonce">
            {`#${nonce}`}
          </div>
        )}
      </div>
      <>
        <div className="confirm-page-container-summary__title">
          {renderImage()}
          {/* {!hideTitle ? (
            <Typography
              className="confirm-page-container-summary__title-text"
              variant={
                title && title.length < 10
                  ? TypographyVariant.H1
                  : TypographyVariant.H3
              }
              title={title}
            >
              {titleComponent || title}
            </Typography>
          ) : null} */}
        </div>
        {hideSubtitle ? null : (
          <div className="confirm-page-container-summary__subtitle">
            {subtitleComponent}
          </div>
        )}
      </>
      {showNicknamePopovers && (
        <NicknamePopovers
          onClose={() => setShowNicknamePopovers(false)}
          address={checksummedAddress}
        />
      )}
    </div>
  );
};

ConfirmPageContainerSummary.propTypes = {
  action: PropTypes.string,
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  image: PropTypes.string,
  titleComponent: PropTypes.node,
  subtitleComponent: PropTypes.node,
  hideSubtitle: PropTypes.bool,
  className: PropTypes.string,
  nonce: PropTypes.string,
  origin: PropTypes.string.isRequired,
  hideTitle: PropTypes.bool,
  isContractTypeTransaction: PropTypes.bool,
  contractAddress: PropTypes.string,
};

export default ConfirmPageContainerSummary;
