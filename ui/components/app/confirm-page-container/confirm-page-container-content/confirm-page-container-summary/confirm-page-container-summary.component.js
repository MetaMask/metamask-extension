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
import Typography from '../../../../ui/typography';
import { TYPOGRAPHY } from '../../../../../helpers/constants/design-system';
import { ORIGIN_METAMASK } from '../../../../../../shared/constants/app';
import SiteOrigin from '../../../../ui/site-origin';

const ConfirmPageContainerSummary = (props) => {
  const {
    action,
    title,
    titleComponent,
    subtitleComponent,
    hideSubtitle,
    className,
    tokenAddress,
    toAddress,
    nonce,
    origin,
    hideTitle,
    image,
    transactionType,
  } = props;

  const [showNicknamePopovers, setShowNicknamePopovers] = useState(false);
  const t = useI18nContext();

  const contractInitiatedTransactionType = [
    TRANSACTION_TYPES.CONTRACT_INTERACTION,
    TRANSACTION_TYPES.TOKEN_METHOD_TRANSFER,
    TRANSACTION_TYPES.TOKEN_METHOD_TRANSFER_FROM,
    TRANSACTION_TYPES.TOKEN_METHOD_SAFE_TRANSFER_FROM,
  ];
  const isContractTypeTransaction = contractInitiatedTransactionType.includes(
    transactionType,
  );
  let contractAddress;
  if (isContractTypeTransaction) {
    // If the transaction is TOKEN_METHOD_TRANSFER or TOKEN_METHOD_TRANSFER_FROM
    // the contract address is passed down as tokenAddress, if it is anyother
    // type of contract interaction it is passed as toAddress
    contractAddress =
      transactionType === TRANSACTION_TYPES.TOKEN_METHOD_TRANSFER ||
      transactionType === TRANSACTION_TYPES.TOKEN_METHOD_TRANSFER_FROM ||
      transactionType === TRANSACTION_TYPES.TOKEN_METHOD_SAFE_TRANSFER_FROM ||
      transactionType === TRANSACTION_TYPES.TOKEN_METHOD_SET_APPROVAL_FOR_ALL
        ? tokenAddress
        : toAddress;
  }

  const { toName, isTrusted } = useAddressDetails(contractAddress);
  const checksummedAddress = toChecksumHexAddress(contractAddress);

  const renderImage = () => {
    if (image) {
      return (
        <img
          className="confirm-page-container-summary__icon"
          width={36}
          src={image}
        />
      );
    } else if (contractAddress) {
      return (
        <Identicon
          className="confirm-page-container-summary__icon"
          diameter={36}
          address={contractAddress}
          image={image}
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
          {!hideTitle ? (
            <Typography
              className="confirm-page-container-summary__title-text"
              variant={
                title && title.length < 10 ? TYPOGRAPHY.H1 : TYPOGRAPHY.H3
              }
              title={title}
            >
              {titleComponent || title}
            </Typography>
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
  tokenAddress: PropTypes.string,
  toAddress: PropTypes.string,
  nonce: PropTypes.string,
  origin: PropTypes.string.isRequired,
  hideTitle: PropTypes.bool,
  transactionType: PropTypes.string,
};

export default ConfirmPageContainerSummary;
