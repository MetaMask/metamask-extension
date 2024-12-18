import React, { useEffect, useRef, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import ConfirmTransactionBase from '../confirm-transaction-base';
import { EditGasModes } from '../../../../shared/constants/gas';
import {
  showModal,
  updateCustomNonce,
  getNextNonce,
} from '../../../store/actions';
import { getTokenApprovedParam } from '../../../helpers/utils/token-util';
import { readAddressAsContract } from '../../../../shared/modules/contract-utils';
import { GasFeeContextProvider } from '../../../contexts/gasFee';
import { TransactionModalContextProvider } from '../../../contexts/transaction-modal';
import {
  isAddressLedger,
  getCurrentCurrency,
} from '../../../ducks/metamask/metamask';
import ConfirmContractInteraction from '../confirm-contract-interaction';
import {
  getSubjectMetadata,
  getUseNonceField,
  getCustomNonceValue,
  getNextSuggestedNonce,
  checkNetworkAndAccountSupports1559,
  getUseCurrencyRateCheck,
  selectNetworkConfigurationByChainId,
} from '../../../selectors';
import { useApproveTransaction } from '../hooks/useApproveTransaction';
import { useSimulationFailureWarning } from '../hooks/useSimulationFailureWarning';
import AdvancedGasFeePopover from '../components/advanced-gas-fee-popover';
import EditGasFeePopover from '../components/edit-gas-fee-popover';
import EditGasPopover from '../components/edit-gas-popover/edit-gas-popover.component';
import Loading from '../../../components/ui/loading-screen';
import { parseStandardTokenTransactionData } from '../../../../shared/modules/transaction.utils';
import { TokenStandard } from '../../../../shared/constants/transaction';
import { calcTokenAmount } from '../../../../shared/lib/transactions-controller-utils';
import TokenAllowance from '../token-allowance/token-allowance';
import { NetworkChangeToastLegacy } from '../components/confirm/network-change-toast';
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
  hexMinimumTransactionFee,
  isSetApproveForAll,
}) {
  const dispatch = useDispatch();
  const { chainId, txParams: { data: transactionData, from } = {} } =
    transaction;

  const currentCurrency = useSelector(getCurrentCurrency);

  const { nativeCurrency } = useSelector((state) =>
    selectNetworkConfigurationByChainId(state, chainId),
  );

  const subjectMetadata = useSelector(getSubjectMetadata);
  const useNonceField = useSelector(getUseNonceField);
  const nextNonce = useSelector(getNextSuggestedNonce);
  const customNonceValue = useSelector(getCustomNonceValue);
  const { blockExplorerUrls } = useSelector((state) =>
    selectNetworkConfigurationByChainId(state, chainId),
  );
  const blockExplorerUrl = blockExplorerUrls?.[0];
  const networkAndAccountSupports1559 = useSelector(
    checkNetworkAndAccountSupports1559,
  );
  const fromAddressIsLedger = useSelector(
    isAddressLedgerByFromAddress(userAddress),
  );
  const useCurrencyRateCheck = useSelector(getUseCurrencyRateCheck);
  const [customPermissionAmount, setCustomPermissionAmount] = useState('');
  const [submitWarning, setSubmitWarning] = useState('');
  const [isContract, setIsContract] = useState(false);
  const [userAcknowledgedGasMissing, setUserAcknowledgedGasMissing] =
    useState(false);

  const supportsEIP1559 = networkAndAccountSupports1559;

  const previousTokenAmount = useRef(tokenAmount);
  const {
    approveTransaction,
    showCustomizeGasPopover,
    closeCustomizeGasPopover,
  } = useApproveTransaction();
  const renderSimulationFailureWarning = useSimulationFailureWarning(
    userAcknowledgedGasMissing,
  );

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

  const { origin, layer1GasFee } = transaction;
  const formattedOrigin = origin || '';

  const { iconUrl: siteImage = '' } = subjectMetadata[origin] || {};

  // Code below may need a additional look as ERC1155 tokens do not have a name
  let tokensText;
  if (
    assetStandard === TokenStandard.ERC721 ||
    assetStandard === TokenStandard.ERC1155
  ) {
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

  const parsedTransactionData =
    parseStandardTokenTransactionData(transactionData);
  const isApprovalOrRejection = getTokenApprovedParam(parsedTransactionData);

  if (tokenSymbol === undefined && assetName === undefined) {
    return <Loading />;
  }
  if (assetStandard === undefined) {
    return <ConfirmContractInteraction />;
  }

  if (assetStandard === TokenStandard.ERC20 && !isSetApproveForAll) {
    return (
      <GasFeeContextProvider transaction={transaction}>
        <TransactionModalContextProvider>
          <TokenAllowance
            origin={formattedOrigin}
            siteImage={siteImage}
            showCustomizeGasModal={approveTransaction}
            useNonceField={useNonceField}
            currentCurrency={currentCurrency}
            nativeCurrency={nativeCurrency}
            ethTransactionTotal={ethTransactionTotal}
            fiatTransactionTotal={fiatTransactionTotal}
            hexTransactionTotal={hexTransactionTotal}
            hexMinimumTransactionFee={hexMinimumTransactionFee}
            txData={transaction}
            supportsEIP1559={supportsEIP1559}
            userAddress={userAddress}
            tokenAddress={tokenAddress}
            data={transactionData}
            isSetApproveForAll={isSetApproveForAll}
            isApprovalOrRejection={isApprovalOrRejection}
            dappProposedTokenAmount={tokenAmount}
            currentTokenBalance={tokenBalance}
            toAddress={toAddress}
            tokenSymbol={tokenSymbol}
            decimals={decimals}
            fromAddressIsLedger={fromAddressIsLedger}
            warning={submitWarning}
          />
          {showCustomizeGasPopover && !supportsEIP1559 && (
            <EditGasPopover
              onClose={closeCustomizeGasPopover}
              mode={EditGasModes.modifyInPlace}
              transaction={transaction}
            />
          )}
          {supportsEIP1559 && (
            <>
              <EditGasFeePopover />
              <AdvancedGasFeePopover />
            </>
          )}
        </TransactionModalContextProvider>
        <NetworkChangeToastLegacy confirmation={transaction} />
      </GasFeeContextProvider>
    );
  }

  return (
    <GasFeeContextProvider transaction={transaction}>
      <ConfirmTransactionBase
        toAddress={toAddress}
        identiconAddress={toAddress}
        showAccountInHeader
        title={tokensText}
        tokenAddress={tokenAddress}
        customTokenAmount={String(customPermissionAmount)}
        dappProposedTokenAmount={tokenAmount}
        currentTokenBalance={tokenBalance}
        isApprovalOrRejection={isApprovalOrRejection}
        contentComponent={
          <TransactionModalContextProvider>
            <ConfirmApproveContent
              userAddress={userAddress}
              isSetApproveForAll={isSetApproveForAll}
              isApprovalOrRejection={isApprovalOrRejection}
              siteImage={siteImage}
              origin={formattedOrigin}
              tokenSymbol={tokenSymbol}
              tokenImage={tokenImage}
              tokenId={tokenId}
              assetName={assetName}
              assetStandard={assetStandard}
              tokenAddress={tokenAddress}
              data={customData || transactionData}
              toAddress={toAddress}
              currentCurrency={currentCurrency}
              nativeCurrency={nativeCurrency}
              ethTransactionTotal={ethTransactionTotal}
              fiatTransactionTotal={fiatTransactionTotal}
              hexTransactionTotal={hexTransactionTotal}
              hexMinimumTransactionFee={hexMinimumTransactionFee}
              useNonceField={useNonceField}
              nextNonce={nextNonce}
              customNonceValue={customNonceValue}
              userAcknowledgedGasMissing={userAcknowledgedGasMissing}
              setUserAcknowledgedGasMissing={setUserAcknowledgedGasMissing}
              renderSimulationFailureWarning={renderSimulationFailureWarning}
              updateCustomNonce={(value) => {
                dispatch(updateCustomNonce(value));
              }}
              getNextNonce={() => dispatch(getNextNonce(from))}
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
              blockExplorerUrl={blockExplorerUrl}
              isContract={isContract}
              hasLayer1GasFee={layer1GasFee !== undefined}
              supportsEIP1559={supportsEIP1559}
              useCurrencyRateCheck={useCurrencyRateCheck}
            />
            {showCustomizeGasPopover && !supportsEIP1559 && (
              <EditGasPopover
                onClose={closeCustomizeGasPopover}
                mode={EditGasModes.modifyInPlace}
                transaction={transaction}
              />
            )}
            {supportsEIP1559 && (
              <>
                <EditGasFeePopover />
                <AdvancedGasFeePopover />
              </>
            )}
          </TransactionModalContextProvider>
        }
        hideSenderToRecipient
        customTxParamsData={customData}
        assetStandard={assetStandard}
        displayAccountBalanceHeader
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
    chainId: PropTypes.string,
    layer1GasFee: PropTypes.string,
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
  hexMinimumTransactionFee: PropTypes.string,
  isSetApproveForAll: PropTypes.bool,
};
