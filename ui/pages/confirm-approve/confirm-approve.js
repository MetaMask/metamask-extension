import React, { useEffect, useRef, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import ConfirmTransactionBase from '../confirm-transaction-base';
import { EDIT_GAS_MODES } from '../../../shared/constants/gas';
import {
  showModal,
  updateCustomNonce,
  getNextNonce,
} from '../../store/actions';
import {
  calcTokenAmount,
  getTokenApprovedParam,
} from '../../helpers/utils/token-util';
import { readAddressAsContract } from '../../../shared/modules/contract-utils';
import { GasFeeContextProvider } from '../../contexts/gasFee';
import { TransactionModalContextProvider } from '../../contexts/transaction-modal';
import {
  getNativeCurrency,
  isAddressLedger,
} from '../../ducks/metamask/metamask';
import {
  getCurrentCurrency,
  getSubjectMetadata,
  getUseNonceField,
  getCustomNonceValue,
  getNextSuggestedNonce,
  getCurrentChainId,
  getRpcPrefsForCurrentProvider,
  getIsMultiLayerFeeNetwork,
  checkNetworkAndAccountSupports1559,
  getEIP1559V2Enabled,
} from '../../selectors';
import { useApproveTransaction } from '../../hooks/useApproveTransaction';
import AdvancedGasFeePopover from '../../components/app/advanced-gas-fee-popover';
import EditGasFeePopover from '../../components/app/edit-gas-fee-popover';
import EditGasPopover from '../../components/app/edit-gas-popover/edit-gas-popover.component';
import Loading from '../../components/ui/loading-screen';
import { ERC20, ERC1155, ERC721 } from '../../helpers/constants/common';
import { parseStandardTokenTransactionData } from '../../../shared/modules/transaction.utils';
import { getCustomTxParamsData } from './confirm-approve.util';
import ConfirmApproveContent from './confirm-approve-content';

const isAddressLedgerByFromAddress = (address) => (state) => {
  return isAddressLedger(state, address);
};

export default function ConfirmApprove({
  assetStandard,
  assetName,
  userBalance,
  tokenSymbol,
  decimals,
  tokenImage,
  tokenAmount,
  tokenId,
  userAddress,
  toAddress,
  tokenAddress,
  transaction,
  ethTransactionTotal,
  fiatTransactionTotal,
  hexTransactionTotal,
  isSetApproveForAll,
}) {
  const dispatch = useDispatch();
  const { txParams: { data: transactionData } = {} } = transaction;

  const currentCurrency = useSelector(getCurrentCurrency);
  const nativeCurrency = useSelector(getNativeCurrency);
  const subjectMetadata = useSelector(getSubjectMetadata);
  const useNonceField = useSelector(getUseNonceField);
  const nextNonce = useSelector(getNextSuggestedNonce);
  const customNonceValue = useSelector(getCustomNonceValue);
  const chainId = useSelector(getCurrentChainId);
  const rpcPrefs = useSelector(getRpcPrefsForCurrentProvider);
  const isMultiLayerFeeNetwork = useSelector(getIsMultiLayerFeeNetwork);
  const networkAndAccountSupports1559 = useSelector(
    checkNetworkAndAccountSupports1559,
  );
  const fromAddressIsLedger = useSelector(
    isAddressLedgerByFromAddress(userAddress),
  );
  const [customPermissionAmount, setCustomPermissionAmount] = useState('');
  const [submitWarning, setSubmitWarning] = useState('');
  const [isContract, setIsContract] = useState(false);

  const eip1559V2Enabled = useSelector(getEIP1559V2Enabled);
  const supportsEIP1559V2 = eip1559V2Enabled && networkAndAccountSupports1559;

  const previousTokenAmount = useRef(tokenAmount);
  const {
    approveTransaction,
    showCustomizeGasPopover,
    closeCustomizeGasPopover,
  } = useApproveTransaction();

  useEffect(() => {
    if (customPermissionAmount && previousTokenAmount.current !== tokenAmount) {
      setCustomPermissionAmount(tokenAmount);
    }
    previousTokenAmount.current = tokenAmount;
  }, [customPermissionAmount, tokenAmount]);

  const prevNonce = useRef(nextNonce);
  const prevCustomNonce = useRef(customNonceValue);
  useEffect(() => {
    if (
      prevNonce.current !== nextNonce ||
      prevCustomNonce.current !== customNonceValue
    ) {
      if (nextNonce !== null && customNonceValue > nextNonce) {
        setSubmitWarning(
          `Nonce is higher than suggested nonce of ${nextNonce}`,
        );
      } else {
        setSubmitWarning('');
      }
    }
    prevCustomNonce.current = customNonceValue;
    prevNonce.current = nextNonce;
  }, [customNonceValue, nextNonce]);

  const checkIfContract = useCallback(async () => {
    const { isContractAddress } = await readAddressAsContract(
      global.eth,
      toAddress,
    );
    setIsContract(isContractAddress);
  }, [setIsContract, toAddress]);

  useEffect(() => {
    checkIfContract();
  }, [checkIfContract]);

  const { origin } = transaction;
  const formattedOrigin = origin || '';

  const { iconUrl: siteImage = '' } = subjectMetadata[origin] || {};

  let tokensText;
  if (assetStandard === ERC20) {
    tokensText = `${Number(tokenAmount)} ${tokenSymbol}`;
  } else if (assetStandard === ERC721 || assetStandard === ERC1155) {
    tokensText = assetName;
  }

  const tokenBalance = userBalance
    ? calcTokenAmount(userBalance, decimals).toString(10)
    : '';
  const customData = customPermissionAmount
    ? getCustomTxParamsData(transactionData, {
        customPermissionAmount,
        decimals,
      })
    : null;

  const parsedTransactionData = parseStandardTokenTransactionData(
    transactionData,
  );
  const setApproveForAllArg = getTokenApprovedParam(parsedTransactionData);

  return tokenSymbol === undefined && assetName === undefined ? (
    <Loading />
  ) : (
    <GasFeeContextProvider transaction={transaction}>
      <ConfirmTransactionBase
        toAddress={toAddress}
        identiconAddress={toAddress}
        showAccountInHeader
        title={tokensText}
        contentComponent={
          <TransactionModalContextProvider>
            <ConfirmApproveContent
              userAddress={userAddress}
              isSetApproveForAll={isSetApproveForAll}
              setApproveForAllArg={setApproveForAllArg}
              decimals={decimals}
              siteImage={siteImage}
              setCustomAmount={setCustomPermissionAmount}
              customTokenAmount={String(customPermissionAmount)}
              tokenAmount={tokenAmount}
              origin={formattedOrigin}
              tokenSymbol={tokenSymbol}
              tokenImage={tokenImage}
              tokenBalance={tokenBalance}
              tokenId={tokenId}
              assetName={assetName}
              assetStandard={assetStandard}
              tokenAddress={tokenAddress}
              showCustomizeGasModal={approveTransaction}
              showEditApprovalPermissionModal={({
                /* eslint-disable no-shadow */
                customTokenAmount,
                decimals,
                origin,
                setCustomAmount,
                tokenAmount,
                tokenBalance,
                tokenSymbol,
                /* eslint-enable no-shadow */
              }) =>
                dispatch(
                  showModal({
                    name: 'EDIT_APPROVAL_PERMISSION',
                    customTokenAmount,
                    decimals,
                    origin,
                    setCustomAmount,
                    tokenAmount,
                    tokenBalance,
                    tokenSymbol,
                    tokenId,
                    assetStandard,
                  }),
                )
              }
              data={customData || transactionData}
              toAddress={toAddress}
              currentCurrency={currentCurrency}
              nativeCurrency={nativeCurrency}
              ethTransactionTotal={ethTransactionTotal}
              fiatTransactionTotal={fiatTransactionTotal}
              hexTransactionTotal={hexTransactionTotal}
              useNonceField={useNonceField}
              nextNonce={nextNonce}
              customNonceValue={customNonceValue}
              updateCustomNonce={(value) => {
                dispatch(updateCustomNonce(value));
              }}
              getNextNonce={() => dispatch(getNextNonce())}
              showCustomizeNonceModal={({
                /* eslint-disable no-shadow */
                useNonceField,
                nextNonce,
                customNonceValue,
                updateCustomNonce,
                getNextNonce,
                /* eslint-disable no-shadow */
              }) =>
                dispatch(
                  showModal({
                    name: 'CUSTOMIZE_NONCE',
                    useNonceField,
                    nextNonce,
                    customNonceValue,
                    updateCustomNonce,
                    getNextNonce,
                  }),
                )
              }
              warning={submitWarning}
              txData={transaction}
              fromAddressIsLedger={fromAddressIsLedger}
              chainId={chainId}
              rpcPrefs={rpcPrefs}
              isContract={isContract}
              isMultiLayerFeeNetwork={isMultiLayerFeeNetwork}
              supportsEIP1559V2={supportsEIP1559V2}
            />
            {showCustomizeGasPopover && !supportsEIP1559V2 && (
              <EditGasPopover
                onClose={closeCustomizeGasPopover}
                mode={EDIT_GAS_MODES.MODIFY_IN_PLACE}
                transaction={transaction}
              />
            )}
            {supportsEIP1559V2 && (
              <>
                <EditGasFeePopover />
                <AdvancedGasFeePopover />
              </>
            )}
          </TransactionModalContextProvider>
        }
        hideSenderToRecipient
        customTxParamsData={customData}
      />
    </GasFeeContextProvider>
  );
}

ConfirmApprove.propTypes = {
  assetStandard: PropTypes.string,
  assetName: PropTypes.string,
  tokenAddress: PropTypes.string,
  userBalance: PropTypes.string,
  tokenSymbol: PropTypes.string,
  decimals: PropTypes.string,
  tokenImage: PropTypes.string,
  tokenAmount: PropTypes.string,
  tokenId: PropTypes.string,
  userAddress: PropTypes.string,
  toAddress: PropTypes.string,
  transaction: PropTypes.shape({
    origin: PropTypes.string,
    txParams: PropTypes.shape({
      data: PropTypes.string,
      to: PropTypes.string,
      from: PropTypes.string,
    }),
  }),
  ethTransactionTotal: PropTypes.string,
  fiatTransactionTotal: PropTypes.string,
  hexTransactionTotal: PropTypes.string,
  isSetApproveForAll: PropTypes.bool,
};
