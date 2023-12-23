/* eslint-disable no-negated-condition */
import React, { useEffect, useState } from 'react';
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
import PulseLoader from '../../../../ui/pulse-loader/pulse-loader';
import { getSymbolAndDecimalsAndName } from '../../../../../helpers/utils/token-util';
import { Numeric } from '../../../../../../shared/modules/Numeric';

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
    networkName,
  } = props;

  const [showNicknamePopovers, setShowNicknamePopovers] = useState(false);
  const [transactionDecodeResult, setTransactionDecodeResult] =
    useState(undefined);
  const [transactionDecodeFetching, setTransactionDecodeFetching] =
    useState(false);
  const [tokenIn, setTokenIn] = useState(undefined);
  const [tokenOut, setTokenOut] = useState(undefined);

  const t = useI18nContext();
  const ipfsGateway = useSelector(getIpfsGateway);

  const txData = useSelector(txDataSelector);
  const { txParams = {} } = txData;
  const { to: txParamsToAddress } = txParams;

  useEffect(() => {
    const fetchData = async (url) => {
      setTransactionDecodeFetching(true);
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(response.statusText);
        }
        const json = await response.json();

        setTransactionDecodeResult(json);
        setTransactionDecodeFetching(false);
      } catch (err) {
        setTransactionDecodeFetching(false);
      }
    };
    if (transactionType === TransactionType.contractInteraction) {
      const { to, data, value } = txParams;
      const url = `http://localhost:3000/transaction?${new URLSearchParams({
        address: to,
        data,
        network: networkName,
        ...(value ? { value } : {}),
      }).toString()}`;

      setTransactionDecodeFetching(true);
      fetchData(url);
    }
  }, [transactionType, txParams, networkName]);

  useEffect(() => {
    const decodeResult = async () => {
      const [x, y] = await Promise.all([
        getSymbolAndDecimalsAndName(transactionDecodeResult.tokenIn),
        getSymbolAndDecimalsAndName(transactionDecodeResult.tokenOut),
      ]);

      const amountOut = new Numeric(
        transactionDecodeResult.amountOutMin,
        10,
        'WEI',
      )
        .toDenomination('ETH')
        .toString();
      const amountIn = new Numeric(transactionDecodeResult.amountIn, 10, 'WEI')
        .toDenomination('ETH')
        .toString();

      setTokenIn({ ...x, amount: amountIn });
      setTokenOut({ ...y, amount: amountOut });
      if (
        transactionDecodeResult.tokenIn ===
        '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
      ) {
        setTokenIn({
          symbol: 'ETH',
          decimals: 18,
          amount: amountIn,
        });
      }

      if (
        transactionDecodeResult.tokenOut ===
        '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
      ) {
        setTokenOut({
          symbol: 'ETH',
          decimals: 18,
          amount: amountOut,
        });
      }
    };

    if (transactionDecodeResult) {
      decodeResult();
    }
  }, [transactionDecodeResult]);

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

  console.log('transactionDecodeResult', transactionDecodeResult);
  console.log('transactionDecodeFetching', transactionDecodeFetching);
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

      {isContractTypeTransaction && transactionDecodeFetching && (
        <div className="confirm-page-container-summary__action-row">
          <PulseLoader />
        </div>
      )}
      {isContractTypeTransaction &&
        !transactionDecodeFetching &&
        transactionDecodeResult &&
        transactionDecodeResult.amountIn &&
        transactionDecodeResult.amountOutMin &&
        tokenIn &&
        tokenOut && (
          <div>
            <div className="confirm-page-container-summary__action-row">
              <div className="confirm-page-container-summary__action">
                <span>
                  Pay {tokenIn.amount} {tokenIn.symbol}
                </span>
              </div>
            </div>
            <div className="confirm-page-container-summary__action-row">
              <div className="confirm-page-container-summary__action">
                <span>
                  Receive minimum {tokenOut.amount} {tokenOut.symbol}
                </span>
              </div>
            </div>
          </div>
        )}
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
  networkName: PropTypes.string,
};

export default ConfirmPageContainerSummary;
