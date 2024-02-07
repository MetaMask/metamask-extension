/* eslint-disable no-negated-condition */
import React, { useState } from 'react';
import { useSelector } from 'react-redux';

import PropTypes from 'prop-types';
import classnames from 'classnames';

import { TransactionType } from '@metamask/transaction-controller';
import { toChecksumHexAddress } from '../../../../../../shared/modules/hexstring-utils';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import useAddressDetails from '../../../../../hooks/useAddressDetails';
import { getIpfsGateway, txDataSelector } from '../../../../../selectors';

import Identicon from '../../../../ui/identicon';
import InfoTooltip from '../../../../ui/info-tooltip';
import NicknamePopovers from '../../../modals/nickname-popovers';
import { ORIGIN_METAMASK } from '../../../../../../shared/constants/app';
import SiteOrigin from '../../../../ui/site-origin';
import { getAssetImageURL } from '../../../../../helpers/utils/util';

const ConfirmPageContainerSummary = (props) => {
  const {
    action,
    titleComponent,
    subtitleComponent,
    className,
    tokenAddress,
    nonce,
    origin,
    image,
    transactionType,
  } = props;

  const [showNicknamePopovers, setShowNicknamePopovers] = useState(false);
  const t = useI18nContext();
  const ipfsGateway = useSelector(getIpfsGateway);

  const txData = useSelector(txDataSelector);
  const { txParams = {} } = txData;
  const { to: txParamsToAddress } = txParams;

  const contractInitiatedTransactionType = [
    TransactionType.contractInteraction,
    TransactionType.tokenMethodTransfer,
    TransactionType.tokenMethodTransferFrom,
    TransactionType.tokenMethodSafeTransferFrom,
  ];
  const isContractTypeTransaction =
    contractInitiatedTransactionType.includes(transactionType);
  let contractAddress;
  if (isContractTypeTransaction) {
    // If the transaction is TOKEN_METHOD_TRANSFER or TOKEN_METHOD_TRANSFER_FROM
    // the contract address is passed down as tokenAddress, if it is anyother
    // type of contract interaction it is "to" from txParams

    contractAddress =
      transactionType === TransactionType.tokenMethodTransfer ||
      transactionType === TransactionType.tokenMethodTransferFrom ||
      transactionType === TransactionType.tokenMethodSafeTransferFrom ||
      transactionType === TransactionType.tokenMethodSetApprovalForAll
        ? tokenAddress
        : txParamsToAddress;
  }

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
          {titleComponent}
        </div>
        {subtitleComponent}
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
  image: PropTypes.string,
  titleComponent: PropTypes.node,
  subtitleComponent: PropTypes.node,
  className: PropTypes.string,
  tokenAddress: PropTypes.string,
  nonce: PropTypes.string,
  origin: PropTypes.string.isRequired,
  transactionType: PropTypes.string,
};

export default ConfirmPageContainerSummary;
