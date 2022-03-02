/* eslint-disable no-negated-condition */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { TRANSACTION_TYPES } from '../../../../../../shared/constants/transaction';
import { toChecksumHexAddress } from '../../../../../../shared/modules/hexstring-utils';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import useAddressDetails from '../../../../../hooks/useAddressDetails';

import Identicon from '../../../../ui/identicon';
import InfoTooltip from '../../../../ui/info-tooltip';
import NicknamePopovers from '../../../modals/nickname-popovers';

const ConfirmPageContainerSummary = (props) => {
  const {
    action,
    title,
    titleComponent,
    subtitleComponent,
    hideSubtitle,
    className,
    identiconAddress,
    nonce,
    origin,
    hideTitle,
    image,
    transactionType,
    toAddress,
  } = props;

  const [showNicknamePopovers, setShowNicknamePopovers] = useState(false);
  const t = useI18nContext();
  const { toName, isTrusted } = useAddressDetails(toAddress);

  const isContractTypeTransaction =
    transactionType === TRANSACTION_TYPES.CONTRACT_INTERACTION;
  const checksummedAddress = toChecksumHexAddress(toAddress);

  const renderImage = () => {
    if (image) {
      return (
        <img
          className="confirm-page-container-summary__icon"
          width={36}
          src={image}
        />
      );
    } else if (identiconAddress) {
      return (
        <Identicon
          className="confirm-page-container-summary__icon"
          diameter={36}
          address={identiconAddress}
          image={image}
        />
      );
    }
    return null;
  };

  return (
    <div className={classnames('confirm-page-container-summary', className)}>
      {origin === 'metamask' ? null : (
        <div className="confirm-page-container-summary__origin">{origin}</div>
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
          {!hideTitle ? (
            <div className="confirm-page-container-summary__title-text">
              {titleComponent || title}
            </div>
          ) : null}
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
  identiconAddress: PropTypes.string,
  nonce: PropTypes.string,
  origin: PropTypes.string.isRequired,
  hideTitle: PropTypes.bool,
  toAddress: PropTypes.string,
  transactionType: PropTypes.string,
};

export default ConfirmPageContainerSummary;
