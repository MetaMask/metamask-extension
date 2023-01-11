import React, { useState, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import PropTypes from 'prop-types';
import BigNumber from 'bignumber.js';
import Box from '../../components/ui/box/box';
import NetworkAccountBalanceHeader from '../../components/app/network-account-balance-header/network-account-balance-header';
import UrlIcon from '../../components/ui/url-icon/url-icon';
import Typography from '../../components/ui/typography/typography';
import {
  ALIGN_ITEMS,
  BORDER_STYLE,
  COLORS,
  DISPLAY,
  FLEX_DIRECTION,
  FONT_WEIGHT,
  JUSTIFY_CONTENT,
  TEXT_ALIGN,
  TYPOGRAPHY,
} from '../../helpers/constants/design-system';
import { I18nContext } from '../../contexts/i18n';
import ContractTokenValues from '../../components/ui/contract-token-values/contract-token-values';
import Button from '../../components/ui/button';
import ReviewSpendingCap from '../../components/ui/review-spending-cap/review-spending-cap';
import { PageContainerFooter } from '../../components/ui/page-container';
import ContractDetailsModal from '../../components/app/modals/contract-details-modal/contract-details-modal';
import {
  getCurrentAccountWithSendEtherInfo,
  getNetworkIdentifier,
  transactionFeeSelector,
  getKnownMethodData,
  getRpcPrefsForCurrentProvider,
  getCustomTokenAmount,
  getUnapprovedTxCount,
  getUnapprovedTransactions,
} from '../../selectors';
import { NETWORK_TO_NAME_MAP } from '../../../shared/constants/network';
import {
  cancelTx,
  cancelTxs,
  showModal,
  updateAndApproveTx,
  updateCustomNonce,
} from '../../store/actions';
import { clearConfirmTransaction } from '../../ducks/confirm-transaction/confirm-transaction.duck';
import { getMostRecentOverviewPage } from '../../ducks/history/history';
import ApproveContentCard from '../../components/app/approve-content-card/approve-content-card';
import CustomSpendingCap from '../../components/app/custom-spending-cap/custom-spending-cap';
import Dialog from '../../components/ui/dialog';
import { useGasFeeContext } from '../../contexts/gasFee';
import { getCustomTxParamsData } from '../confirm-approve/confirm-approve.util';
import { setCustomTokenAmount } from '../../ducks/app/app';
import { valuesFor } from '../../helpers/utils/util';
import { calcTokenAmount } from '../../../shared/lib/transactions-controller-utils';
import { MAX_TOKEN_ALLOWANCE_AMOUNT } from '../../../shared/constants/tokens';
import { ConfirmPageContainerNavigation } from '../../components/app/confirm-page-container';

export default function TokenAllowance({
  origin,
  siteImage,
  showCustomizeGasModal,
  useNonceField,
  currentCurrency,
  nativeCurrency,
  ethTransactionTotal,
  fiatTransactionTotal,
  hexTransactionTotal,
  txData,
  isMultiLayerFeeNetwork,
  supportsEIP1559,
  userAddress,
  tokenAddress,
  data,
  isSetApproveForAll,
  isApprovalOrRejection,
  decimals,
  dappProposedTokenAmount,
  currentTokenBalance,
  toAddress,
  tokenSymbol,
}) {
  const t = useContext(I18nContext);
  const dispatch = useDispatch();
  const history = useHistory();
  const mostRecentOverviewPage = useSelector(getMostRecentOverviewPage);

  const [showContractDetails, setShowContractDetails] = useState(false);
  const [showFullTxDetails, setShowFullTxDetails] = useState(false);
  const [isFirstPage, setIsFirstPage] = useState(
    dappProposedTokenAmount !== '0',
  );
  const [errorText, setErrorText] = useState('');

  const currentAccount = useSelector(getCurrentAccountWithSendEtherInfo);
  const networkIdentifier = useSelector(getNetworkIdentifier);
  const rpcPrefs = useSelector(getRpcPrefsForCurrentProvider);
  const customTokenAmount = useSelector(getCustomTokenAmount);
  const unapprovedTxCount = useSelector(getUnapprovedTxCount);
  const unapprovedTxs = useSelector(getUnapprovedTransactions);

  const replaceCommaToDot = (inputValue) => {
    return inputValue.replace(/,/gu, '.');
  };

  let customPermissionAmount = replaceCommaToDot(customTokenAmount).toString();

  const maxTokenAmount = calcTokenAmount(MAX_TOKEN_ALLOWANCE_AMOUNT, decimals);
  if (customTokenAmount.length > 1 && Number(customTokenAmount)) {
    const customSpendLimitNumber = new BigNumber(customTokenAmount);
    if (customSpendLimitNumber.greaterThan(maxTokenAmount)) {
      customPermissionAmount = 0;
    }
  }

  const customTxParamsData = customPermissionAmount
    ? getCustomTxParamsData(data, {
        customPermissionAmount,
        decimals,
      })
    : null;

  let fullTxData = { ...txData };

  if (customTxParamsData) {
    fullTxData = {
      ...fullTxData,
      txParams: {
        ...fullTxData.txParams,
        data: customTxParamsData,
      },
    };
  }

  const fee = useSelector((state) => transactionFeeSelector(state, fullTxData));
  const methodData = useSelector((state) => getKnownMethodData(state, data));

  const { balanceError } = useGasFeeContext();

  const disableNextButton =
    isFirstPage && (customTokenAmount === '' || errorText !== '');

  const disableApproveButton = !isFirstPage && balanceError;

  const networkName =
    NETWORK_TO_NAME_MAP[fullTxData.chainId] || networkIdentifier;

  const customNonceValue = '';
  const customNonceMerge = (transactionData) =>
    customNonceValue
      ? {
          ...transactionData,
          customNonceValue,
        }
      : transactionData;

  const handleReject = () => {
    dispatch(updateCustomNonce(''));
    dispatch(setCustomTokenAmount(''));

    dispatch(cancelTx(fullTxData)).then(() => {
      dispatch(clearConfirmTransaction());
      history.push(mostRecentOverviewPage);
    });
  };

  const handleApprove = () => {
    const { name } = methodData;

    if (fee.gasEstimationObject.baseFeePerGas) {
      fullTxData.estimatedBaseFee = fee.gasEstimationObject.baseFeePerGas;
    }

    if (name) {
      fullTxData.contractMethodName = name;
    }

    if (dappProposedTokenAmount) {
      fullTxData.dappProposedTokenAmount = dappProposedTokenAmount;
      fullTxData.originalApprovalAmount = dappProposedTokenAmount;
    }

    if (customTokenAmount) {
      fullTxData.customTokenAmount = customTokenAmount;
      fullTxData.finalApprovalAmount = customTokenAmount;
    } else if (dappProposedTokenAmount !== undefined) {
      fullTxData.finalApprovalAmount = dappProposedTokenAmount;
    }

    if (currentTokenBalance) {
      fullTxData.currentTokenBalance = currentTokenBalance;
    }

    dispatch(updateCustomNonce(''));

    dispatch(updateAndApproveTx(customNonceMerge(fullTxData))).then(() => {
      dispatch(clearConfirmTransaction());
      history.push(mostRecentOverviewPage);
    });
  };

  const handleNextClick = () => {
    setShowFullTxDetails(false);
    setIsFirstPage(false);
  };

  const handleBackClick = () => {
    setShowFullTxDetails(false);
    setIsFirstPage(true);
  };

  const handleCancelAll = () => {
    dispatch(
      showModal({
        name: 'REJECT_TRANSACTIONS',
        unapprovedTxCount,
        onSubmit: async () => {
          await dispatch(cancelTxs(valuesFor(unapprovedTxs)));
          dispatch(clearConfirmTransaction());
          history.push(mostRecentOverviewPage);
        },
      }),
    );
  };

  const isEmpty = customTokenAmount === '';

  const renderContractTokenValues = (
    <Box marginTop={4} key={tokenAddress}>
      <ContractTokenValues
        tokenName={tokenSymbol}
        address={tokenAddress}
        chainId={fullTxData.chainId}
        rpcPrefs={rpcPrefs}
      />
    </Box>
  );

  return (
    <Box className="token-allowance-container page-container">
      <Box>
        <ConfirmPageContainerNavigation />
      </Box>
      <Box
        paddingLeft={4}
        paddingRight={4}
        alignItems={ALIGN_ITEMS.CENTER}
        display={DISPLAY.FLEX}
        flexDirection={FLEX_DIRECTION.ROW}
        justifyContent={JUSTIFY_CONTENT.SPACE_BETWEEN}
      >
        <Box>
          {!isFirstPage && (
            <Button type="inline" onClick={() => handleBackClick()}>
              <Typography
                variant={TYPOGRAPHY.H6}
                color={COLORS.TEXT_MUTED}
                fontWeight={FONT_WEIGHT.BOLD}
              >
                {'<'} {t('back')}
              </Typography>
            </Button>
          )}
        </Box>
        <Box textAlign={TEXT_ALIGN.END}>
          <Typography
            variant={TYPOGRAPHY.H7}
            color={COLORS.TEXT_MUTED}
            fontWeight={FONT_WEIGHT.BOLD}
          >
            {isFirstPage ? 1 : 2} {t('ofTextNofM')} 2
          </Typography>
        </Box>
      </Box>
      <NetworkAccountBalanceHeader
        networkName={networkName}
        accountName={currentAccount.name}
        accountBalance={currentTokenBalance}
        tokenName={tokenSymbol}
        accountAddress={userAddress}
        chainId={fullTxData.chainId}
      />
      <Box
        display={DISPLAY.FLEX}
        flexDirection={FLEX_DIRECTION.ROW}
        justifyContent={JUSTIFY_CONTENT.CENTER}
      >
        <Box
          display={DISPLAY.FLEX}
          alignItems={ALIGN_ITEMS.CENTER}
          marginTop={6}
          marginRight={12}
          marginBottom={8}
          marginLeft={12}
          paddingTop={2}
          paddingRight={4}
          paddingBottom={2}
          paddingLeft={2}
          borderColor={COLORS.BORDER_MUTED}
          borderStyle={BORDER_STYLE.SOLID}
          borderWidth={1}
          className="token-allowance-container__icon-display-content"
        >
          <UrlIcon
            className="token-allowance-container__icon-display-content__siteimage-identicon"
            fallbackClassName="token-allowance-container__icon-display-content__siteimage-identicon"
            name={origin}
            url={siteImage}
          />
          <Typography
            variant={TYPOGRAPHY.H6}
            fontWeight={FONT_WEIGHT.NORMAL}
            color={COLORS.TEXT_ALTERNATIVE}
            boxProps={{ marginLeft: 1, marginTop: 2 }}
          >
            {origin}
          </Typography>
        </Box>
      </Box>
      <Box marginLeft={4} marginRight={4}>
        <Typography
          variant={TYPOGRAPHY.H3}
          fontWeight={FONT_WEIGHT.BOLD}
          align={TEXT_ALIGN.CENTER}
        >
          {isFirstPage ? (
            t('setSpendingCap', [renderContractTokenValues])
          ) : (
            <Box>
              {customTokenAmount === '0' || isEmpty ? (
                t('revokeSpendingCap', [renderContractTokenValues])
              ) : (
                <Box>
                  {t('reviewSpendingCap')}
                  {renderContractTokenValues}
                </Box>
              )}
            </Box>
          )}
        </Typography>
      </Box>
      <Box
        marginTop={1}
        display={DISPLAY.FLEX}
        flexDirection={FLEX_DIRECTION.ROW}
        justifyContent={JUSTIFY_CONTENT.CENTER}
      >
        <Button
          type="link"
          onClick={() => setShowContractDetails(true)}
          className="token-allowance-container__verify-link"
        >
          <Typography variant={TYPOGRAPHY.H6} color={COLORS.PRIMARY_DEFAULT}>
            {t('verifyContractDetails')}
          </Typography>
        </Button>
      </Box>
      <Box margin={[4, 4, 3, 4]}>
        {isFirstPage ? (
          <CustomSpendingCap
            tokenName={tokenSymbol}
            currentTokenBalance={currentTokenBalance}
            dappProposedValue={dappProposedTokenAmount}
            siteOrigin={origin}
            passTheErrorText={(value) => setErrorText(value)}
            decimals={decimals}
          />
        ) : (
          <ReviewSpendingCap
            tokenName={tokenSymbol}
            currentTokenBalance={currentTokenBalance}
            tokenValue={
              isNaN(parseFloat(customTokenAmount))
                ? dappProposedTokenAmount
                : replaceCommaToDot(customTokenAmount)
            }
            onEdit={() => handleBackClick()}
          />
        )}
      </Box>
      {!isFirstPage && balanceError && (
        <Dialog type="error" className="send__error-dialog">
          {t('insufficientFundsForGas')}
        </Dialog>
      )}
      {!isFirstPage && (
        <Box className="token-allowance-container__card-wrapper">
          <ApproveContentCard
            symbol={<i className="fa fa-tag" />}
            title={t('transactionFee')}
            showEdit
            showAdvanceGasFeeOptions
            onEditClick={showCustomizeGasModal}
            renderTransactionDetailsContent
            noBorder={useNonceField || !showFullTxDetails}
            supportsEIP1559={supportsEIP1559}
            isMultiLayerFeeNetwork={isMultiLayerFeeNetwork}
            ethTransactionTotal={ethTransactionTotal}
            nativeCurrency={nativeCurrency}
            fullTxData={fullTxData}
            hexTransactionTotal={hexTransactionTotal}
            fiatTransactionTotal={fiatTransactionTotal}
            currentCurrency={currentCurrency}
          />
        </Box>
      )}
      <Box
        display={DISPLAY.FLEX}
        flexDirection={FLEX_DIRECTION.ROW}
        justifyContent={JUSTIFY_CONTENT.CENTER}
      >
        <Button
          type="link"
          onClick={() => setShowFullTxDetails(!showFullTxDetails)}
          className="token-allowance-container__view-details"
        >
          <Typography
            variant={TYPOGRAPHY.H6}
            color={COLORS.PRIMARY_DEFAULT}
            marginRight={1}
          >
            {t('viewDetails')}
          </Typography>
          {showFullTxDetails ? (
            <i className="fa fa-sm fa-angle-up" />
          ) : (
            <i className="fa fa-sm fa-angle-down" />
          )}
        </Button>
      </Box>
      {showFullTxDetails ? (
        <Box
          display={DISPLAY.FLEX}
          flexDirection={FLEX_DIRECTION.COLUMN}
          alignItems={ALIGN_ITEMS.CENTER}
          className="token-allowance-container__full-tx-content"
        >
          <Box className="token-allowance-container__data">
            <ApproveContentCard
              symbol={<i className="fa fa-file" />}
              title={t('data')}
              renderDataContent
              noBorder
              supportsEIP1559={supportsEIP1559}
              isSetApproveForAll={isSetApproveForAll}
              isApprovalOrRejection={isApprovalOrRejection}
              data={customTxParamsData || data}
            />
          </Box>
        </Box>
      ) : null}
      <PageContainerFooter
        cancelText={t('reject')}
        submitText={isFirstPage ? t('next') : t('approveButtonText')}
        onCancel={() => handleReject()}
        onSubmit={() => (isFirstPage ? handleNextClick() : handleApprove())}
        disabled={disableNextButton || disableApproveButton}
      >
        {unapprovedTxCount > 1 && (
          <Button
            type="link"
            onClick={(e) => {
              e.preventDefault();
              handleCancelAll();
            }}
          >
            {t('rejectTxsN', [unapprovedTxCount])}
          </Button>
        )}
      </PageContainerFooter>
      {showContractDetails && (
        <ContractDetailsModal
          tokenName={tokenSymbol}
          onClose={() => setShowContractDetails(false)}
          tokenAddress={tokenAddress}
          toAddress={toAddress}
          chainId={fullTxData.chainId}
          rpcPrefs={rpcPrefs}
          origin={origin}
          siteImage={siteImage}
        />
      )}
    </Box>
  );
}

TokenAllowance.propTypes = {
  /**
   * Dapp URL
   */
  origin: PropTypes.string,
  /**
   * Dapp image
   */
  siteImage: PropTypes.string,
  /**
   * Function that is supposed to open the customized gas modal
   */
  showCustomizeGasModal: PropTypes.func,
  /**
   * Whether nonce field should be used or not
   */
  useNonceField: PropTypes.bool,
  /**
   * Current fiat currency (e.g. USD)
   */
  currentCurrency: PropTypes.string,
  /**
   * Current native currency (e.g. RopstenETH)
   */
  nativeCurrency: PropTypes.string,
  /**
   * Total sum of the transaction in native currency
   */
  ethTransactionTotal: PropTypes.string,
  /**
   * Total sum of the transaction in fiat currency
   */
  fiatTransactionTotal: PropTypes.string,
  /**
   * Total sum of the transaction converted to hex value
   */
  hexTransactionTotal: PropTypes.string,
  /**
   * Current transaction
   */
  txData: PropTypes.object,
  /**
   * Is multi-layer fee network or not
   */
  isMultiLayerFeeNetwork: PropTypes.bool,
  /**
   * Is the enhanced gas fee enabled or not
   */
  supportsEIP1559: PropTypes.bool,
  /**
   * User's address
   */
  userAddress: PropTypes.string,
  /**
   * Address of the token that is waiting to be allowed
   */
  tokenAddress: PropTypes.string,
  /**
   * Current transaction data
   */
  data: PropTypes.string,
  /**
   * Is set approve for all or not
   */
  isSetApproveForAll: PropTypes.bool,
  /**
   * Whether a current set approval for all transaction will approve or revoke access
   */
  isApprovalOrRejection: PropTypes.bool,
  /**
   * Number of decimals
   */
  decimals: PropTypes.string,
  /**
   * Token amount proposed by the Dapp
   */
  dappProposedTokenAmount: PropTypes.string,
  /**
   * Token balance of the current account
   */
  currentTokenBalance: PropTypes.string,
  /**
   * Contract address requesting spending cap
   */
  toAddress: PropTypes.string,
  /**
   * Symbol of the token that is waiting to be allowed
   */
  tokenSymbol: PropTypes.string,
};
