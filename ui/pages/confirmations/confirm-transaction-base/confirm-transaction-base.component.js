import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import ConfirmPageContainer from '../components/confirm-page-container';
import { isBalanceSufficient } from '../send/send.utils';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import {
  TextVariant,
  TextColor,
} from '../../../helpers/constants/design-system';
import {
  INSUFFICIENT_FUNDS_ERROR_KEY,
  GAS_LIMIT_TOO_LOW_ERROR_KEY,
  ETH_GAS_PRICE_FETCH_WARNING_KEY,
  GAS_PRICE_FETCH_FAILURE_ERROR_KEY,
  IS_SIGNING_OR_SUBMITTING,
  USER_OP_CONTRACT_DEPLOY_ERROR_KEY,
} from '../../../helpers/constants/error-keys';

import UserPreferencedCurrencyDisplay from '../../../components/app/user-preferenced-currency-display';

import { PRIMARY, SECONDARY } from '../../../helpers/constants/common';
import { MetaMetricsEventCategory } from '../../../../shared/constants/metametrics';
import { getMethodName } from '../../../helpers/utils/metrics';
import {
  getTransactionTypeTitle,
  isLegacyTransaction,
} from '../../../helpers/utils/transactions.util';

///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
import NoteToTrader from '../../../components/institutional/note-to-trader';
///: END:ONLY_INCLUDE_IF
import {
  AccountType,
  CustodyStatus,
} from '../../../../shared/constants/custody';

import { TransactionModalContextProvider } from '../../../contexts/transaction-modal';
import TransactionDetail from '../components/transaction-detail/transaction-detail.component';
import TransactionDetailItem from '../components/transaction-detail-item/transaction-detail-item.component';
import { Text, TextField } from '../../../components/component-library';
import LoadingHeartBeat from '../../../components/ui/loading-heartbeat';
import LedgerInstructionField from '../components/ledger-instruction-field';
import {
  addPollingTokenToAppState,
  removePollingTokenFromAppState,
  gasFeeStartPollingByNetworkClientId,
  gasFeeStopPollingByPollingToken,
} from '../../../store/actions';

import { MIN_GAS_LIMIT_DEC } from '../send/send.constants';

import { NETWORK_TO_NAME_MAP } from '../../../../shared/constants/network';
import {
  sumHexes,
  hexToDecimal,
} from '../../../../shared/modules/conversion.utils';
import TransactionAlerts from '../components/transaction-alerts';
import { ConfirmHexData } from '../components/confirm-hexdata';
import { ConfirmTitle } from '../components/confirm-title';
import { ConfirmSubTitle } from '../components/confirm-subtitle';
import { ConfirmGasDisplay } from '../components/confirm-gas-display';
import updateTxData from '../../../../shared/modules/updateTxData';
///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
import { KeyringType } from '../../../../shared/constants/keyring';
import SnapAccountTransactionLoadingScreen from '../../snap-account-transaction-loading-screen/snap-account-transaction-loading-screen';
///: END:ONLY_INCLUDE_IF
import { isHardwareKeyring } from '../../../helpers/utils/hardware';
import FeeDetailsComponent from '../components/fee-details-component/fee-details-component';
import { SimulationDetails } from '../components/simulation-details';
import { fetchSwapsFeatureFlags } from '../../swaps/swaps.util';
import { NetworkChangeToastLegacy } from '../components/confirm/network-change-toast';

export default class ConfirmTransactionBase extends Component {
  static contextTypes = {
    t: PropTypes.func,
    trackEvent: PropTypes.func,
  };

  static propTypes = {
    // react-router props
    history: PropTypes.object,
    // Redux props
    balance: PropTypes.string,
    cancelTransaction: PropTypes.func,
    cancelAllTransactions: PropTypes.func,
    clearConfirmTransaction: PropTypes.func,
    conversionRate: PropTypes.number,
    fromAddress: PropTypes.string,
    fromName: PropTypes.string,
    hexTransactionAmount: PropTypes.string,
    hexMaximumTransactionFee: PropTypes.string,
    hexMinimumTransactionFee: PropTypes.string,
    methodData: PropTypes.object,
    nonce: PropTypes.string,
    useNonceField: PropTypes.bool,
    customNonceValue: PropTypes.string,
    updateCustomNonce: PropTypes.func,
    sendTransaction: PropTypes.func,
    showTransactionConfirmedModal: PropTypes.func,
    showRejectTransactionsConfirmationModal: PropTypes.func,
    toAccounts: PropTypes.array,
    toAddress: PropTypes.string,
    tokenData: PropTypes.object,
    tokenProps: PropTypes.object,
    toName: PropTypes.string,
    toEns: PropTypes.string,
    toNickname: PropTypes.string,
    transactionStatus: PropTypes.string,
    txData: PropTypes.object,
    unapprovedTxCount: PropTypes.number,
    customGas: PropTypes.object,
    addToAddressBookIfNew: PropTypes.func,
    ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
    fromInternalAccount: PropTypes.object,
    ///: END:ONLY_INCLUDE_IF
    keyringForAccount: PropTypes.object,
    // Component props
    actionKey: PropTypes.string,
    contentComponent: PropTypes.node,
    dataHexComponent: PropTypes.node,
    tokenAddress: PropTypes.string,
    customTokenAmount: PropTypes.string,
    dappProposedTokenAmount: PropTypes.string,
    currentTokenBalance: PropTypes.string,
    onEdit: PropTypes.func,
    subtitleComponent: PropTypes.node,
    title: PropTypes.string,
    image: PropTypes.string,
    type: PropTypes.string,
    getNextNonce: PropTypes.func,
    nextNonce: PropTypes.number,
    tryReverseResolveAddress: PropTypes.func.isRequired,
    hideSenderToRecipient: PropTypes.bool,
    showAccountInHeader: PropTypes.bool,
    mostRecentOverviewPage: PropTypes.string.isRequired,
    isEthGasPriceFetched: PropTypes.bool,
    noGasPrice: PropTypes.bool,
    setDefaultHomeActiveTabName: PropTypes.func,
    primaryTotalTextOverride: PropTypes.string,
    secondaryTotalTextOverride: PropTypes.string,
    gasIsLoading: PropTypes.bool,
    primaryTotalTextOverrideMaxAmount: PropTypes.string,
    useNativeCurrencyAsPrimaryCurrency: PropTypes.bool,
    maxFeePerGas: PropTypes.string,
    maxPriorityFeePerGas: PropTypes.string,
    baseFeePerGas: PropTypes.string,
    gasFeeIsCustom: PropTypes.bool,
    showLedgerSteps: PropTypes.bool.isRequired,
    nativeCurrency: PropTypes.string,
    supportsEIP1559: PropTypes.bool,
    hardwareWalletRequiresConnection: PropTypes.bool,
    isBuyableChain: PropTypes.bool,
    isApprovalOrRejection: PropTypes.bool,
    assetStandard: PropTypes.string,
    useCurrencyRateCheck: PropTypes.bool,
    isNotification: PropTypes.bool,
    accountType: PropTypes.string,
    setWaitForConfirmDeepLinkDialog: PropTypes.func,
    showTransactionsFailedModal: PropTypes.func,
    showCustodianDeepLink: PropTypes.func,
    isNoteToTraderSupported: PropTypes.bool,
    custodianPublishesTransaction: PropTypes.bool,
    rpcUrl: PropTypes.string,
    isMainBetaFlask: PropTypes.bool,
    displayAccountBalanceHeader: PropTypes.bool,
    tokenSymbol: PropTypes.string,
    updateTransaction: PropTypes.func,
    updateTransactionValue: PropTypes.func,
    setSwapsFeatureFlags: PropTypes.func,
    fetchSmartTransactionsLiveness: PropTypes.func,
    isUsingPaymaster: PropTypes.bool,
    isSigningOrSubmitting: PropTypes.bool,
    isUserOpContractDeployError: PropTypes.bool,
    useMaxValue: PropTypes.bool,
    maxValue: PropTypes.string,
    smartTransactionsOptInStatus: PropTypes.bool,
    currentChainSupportsSmartTransactions: PropTypes.bool,
    selectedNetworkClientId: PropTypes.string,
    isSmartTransactionsEnabled: PropTypes.bool,
    hasPriorityApprovalRequest: PropTypes.bool,
    chainId: PropTypes.string,
  };

  state = {
    submitting: false,
    submitError: null,
    submitWarning: '',
    ethGasPriceWarning: '',
    editingGas: false,
    userAcknowledgedGasMissing: false,
    showWarningModal: false,
    ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
    noteText: '',
    ///: END:ONLY_INCLUDE_IF
  };

  componentDidUpdate(prevProps) {
    const {
      transactionStatus,
      showTransactionConfirmedModal,
      history,
      clearConfirmTransaction,
      nextNonce,
      customNonceValue,
      toAddress,
      tryReverseResolveAddress,
      isEthGasPriceFetched,
      setDefaultHomeActiveTabName,
      hexMaximumTransactionFee,
      useMaxValue,
      hasPriorityApprovalRequest,
      mostRecentOverviewPage,
    } = this.props;

    const {
      customNonceValue: prevCustomNonceValue,
      nextNonce: prevNextNonce,
      toAddress: prevToAddress,
      transactionStatus: prevTxStatus,
      isEthGasPriceFetched: prevIsEthGasPriceFetched,
      hexMaximumTransactionFee: prevHexMaximumTransactionFee,
      hasPriorityApprovalRequest: prevHasPriorityApprovalRequest,
    } = prevProps;

    const statusUpdated = transactionStatus !== prevTxStatus;
    const txDroppedOrConfirmed =
      transactionStatus === TransactionStatus.dropped ||
      transactionStatus === TransactionStatus.confirmed;

    if (
      nextNonce !== prevNextNonce ||
      customNonceValue !== prevCustomNonceValue
    ) {
      if (nextNonce !== null && customNonceValue > nextNonce) {
        this.setState({
          submitWarning: this.context.t('nextNonceWarning', [nextNonce]),
        });
      } else {
        this.setState({ submitWarning: '' });
      }
    }

    if (statusUpdated && txDroppedOrConfirmed) {
      showTransactionConfirmedModal({
        onSubmit: () => {
          clearConfirmTransaction();
          setDefaultHomeActiveTabName('activity').then(() => {
            history.push(DEFAULT_ROUTE);
          });
        },
      });
    }

    if (toAddress && toAddress !== prevToAddress) {
      tryReverseResolveAddress(toAddress);
    }

    if (isEthGasPriceFetched !== prevIsEthGasPriceFetched) {
      if (isEthGasPriceFetched) {
        this.setState({
          ethGasPriceWarning: this.context.t(ETH_GAS_PRICE_FETCH_WARNING_KEY),
        });
      } else {
        this.setState({
          ethGasPriceWarning: '',
        });
      }
    }

    if (
      hexMaximumTransactionFee !== prevHexMaximumTransactionFee &&
      useMaxValue
    ) {
      this.updateValueToMax();
    }

    if (hasPriorityApprovalRequest && !prevHasPriorityApprovalRequest) {
      // Redirect to home which will redirect to the priority confirmation.
      history.push(mostRecentOverviewPage);
    }
  }

  getErrorKey() {
    const {
      balance,
      conversionRate,
      hexMaximumTransactionFee,
      txData: { txParams: { value: amount } = {} } = {},
      customGas,
      noGasPrice,
      gasFeeIsCustom,
      isSigningOrSubmitting,
      isUserOpContractDeployError,
    } = this.props;

    if (isUserOpContractDeployError) {
      return {
        valid: false,
        errorKey: USER_OP_CONTRACT_DEPLOY_ERROR_KEY,
      };
    }

    const insufficientBalance =
      balance &&
      !isBalanceSufficient({
        amount,
        gasTotal: hexMaximumTransactionFee || '0x0',
        balance,
        conversionRate,
      });

    if (insufficientBalance) {
      return {
        valid: false,
        errorKey: INSUFFICIENT_FUNDS_ERROR_KEY,
      };
    }

    if (hexToDecimal(customGas.gasLimit) < Number(MIN_GAS_LIMIT_DEC)) {
      return {
        valid: false,
        errorKey: GAS_LIMIT_TOO_LOW_ERROR_KEY,
      };
    }

    if (noGasPrice && !gasFeeIsCustom) {
      return {
        valid: false,
        errorKey: GAS_PRICE_FETCH_FAILURE_ERROR_KEY,
      };
    }

    if (isSigningOrSubmitting) {
      return {
        valid: false,
        errorKey: IS_SIGNING_OR_SUBMITTING,
      };
    }

    return {
      valid: true,
    };
  }

  handleEditGas() {
    const {
      actionKey,
      txData: { origin },
      methodData = {},
    } = this.props;

    this.context.trackEvent({
      category: MetaMetricsEventCategory.Transactions,
      event: 'User clicks "Edit" on gas',
      properties: {
        action: 'Confirm Screen',
        legacy_event: true,
        recipientKnown: null,
        functionType:
          actionKey ||
          getMethodName(methodData.name) ||
          TransactionType.contractInteraction,
        origin,
      },
    });

    this.setState({ editingGas: true });
  }

  handleCloseEditGas() {
    this.setState({ editingGas: false });
  }

  setUserAcknowledgedGasMissing() {
    this.setState({ userAcknowledgedGasMissing: true });
  }

  updateValueToMax() {
    const { maxValue: value, txData, updateTransactionValue } = this.props;

    updateTransactionValue(txData.id, value);
  }

  renderDetails() {
    const {
      primaryTotalTextOverride,
      secondaryTotalTextOverride,
      hexMaximumTransactionFee,
      hexMinimumTransactionFee,
      useNonceField,
      customNonceValue,
      updateCustomNonce,
      nextNonce,
      getNextNonce,
      txData,
      useNativeCurrencyAsPrimaryCurrency,
      primaryTotalTextOverrideMaxAmount,
      showLedgerSteps,
      nativeCurrency,
      isBuyableChain,
      useCurrencyRateCheck,
      tokenSymbol,
      isUsingPaymaster,
      isSigningOrSubmitting,
    } = this.props;

    const { t } = this.context;
    const { userAcknowledgedGasMissing } = this.state;

    const { valid } = this.getErrorKey();
    const isDisabled = () => {
      return userAcknowledgedGasMissing ? false : !valid;
    };

    const hasSimulationError = Boolean(txData.simulationFails);

    const renderSimulationFailureWarning =
      hasSimulationError && !userAcknowledgedGasMissing;
    const networkName = NETWORK_TO_NAME_MAP[txData.chainId];

    const getTotalAmount = (useMaxFee) => {
      return sumHexes(
        txData.txParams.value,
        useMaxFee ? hexMaximumTransactionFee : hexMinimumTransactionFee,
        txData.layer1GasFee ?? 0,
      );
    };

    const handleNonceChange = ({ target: { value } }) => {
      const inputValue = Number(value);

      if (inputValue < 0 || isNaN(inputValue)) {
        updateCustomNonce(undefined);
        return;
      }

      updateCustomNonce(inputValue);

      getNextNonce();
    };

    const renderTotalMaxAmount = ({
      useMaxFee,
      isBoldTextAndNotOverridden = false,
    } = {}) => {
      if (
        primaryTotalTextOverrideMaxAmount === undefined &&
        secondaryTotalTextOverride === undefined
      ) {
        // Native Send
        return (
          <UserPreferencedCurrencyDisplay
            type={PRIMARY}
            key="total-max-amount"
            value={getTotalAmount(useMaxFee)}
            hideLabel={!useNativeCurrencyAsPrimaryCurrency}
          />
        );
      }

      // Token send
      const primaryTotal = useMaxFee
        ? primaryTotalTextOverrideMaxAmount
        : primaryTotalTextOverride;
      const totalMaxAmount = useNativeCurrencyAsPrimaryCurrency
        ? primaryTotal
        : secondaryTotalTextOverride;

      return isBoldTextAndNotOverridden ? (
        <Text variant={TextVariant.bodyMdBold}>{totalMaxAmount}</Text>
      ) : (
        totalMaxAmount
      );
    };

    const renderTotalDetailText = (value) => {
      if (
        (primaryTotalTextOverride === undefined &&
          secondaryTotalTextOverride === undefined) ||
        value === '0x0'
      ) {
        return (
          <div className="confirm-page-container-content__total-value">
            <LoadingHeartBeat estimateUsed={this.props.txData?.userFeeLevel} />
            <UserPreferencedCurrencyDisplay
              type={SECONDARY}
              key="total-detail-text"
              value={value}
              suffixProps={{
                color: TextColor.textDefault,
                variant: TextVariant.bodyMdBold,
              }}
              textProps={{
                color: TextColor.textDefault,
                variant: TextVariant.bodyMdBold,
              }}
              hideLabel={Boolean(useNativeCurrencyAsPrimaryCurrency)}
            />
          </div>
        );
      }
      return useNativeCurrencyAsPrimaryCurrency
        ? secondaryTotalTextOverride
        : primaryTotalTextOverride;
    };

    const nextNonceValue =
      typeof nextNonce === 'number' ? nextNonce.toString() : null;
    const renderNonceField = useNonceField && !isSigningOrSubmitting;

    if (renderNonceField && !customNonceValue && nextNonceValue) {
      updateCustomNonce(nextNonceValue);
    }

    const nonceField = renderNonceField ? (
      <div>
        <div className="confirm-detail-row">
          <div className="confirm-detail-row__label">
            {t('nonceFieldHeading')}
          </div>
          <div className="custom-nonce-input">
            <TextField
              type="number"
              min={0}
              placeholder={nextNonceValue}
              onChange={handleNonceChange}
              fullWidth
              margin="dense"
              value={customNonceValue ?? ''}
            />
          </div>
        </div>
      </div>
    ) : null;

    const { simulationData } = txData;

    const simulationDetails = (
      <SimulationDetails
        simulationData={simulationData}
        transactionId={txData.id}
        enableMetrics
      />
    );

    const showTotals = Boolean(simulationData?.error);

    return (
      <div className="confirm-page-container-content__details">
        <TransactionAlerts
          txData={txData}
          setUserAcknowledgedGasMissing={() =>
            this.setUserAcknowledgedGasMissing()
          }
          userAcknowledgedGasMissing={userAcknowledgedGasMissing}
          nativeCurrency={nativeCurrency}
          networkName={networkName}
          type={txData.type}
          isBuyableChain={isBuyableChain}
          tokenSymbol={tokenSymbol}
          isUsingPaymaster={isUsingPaymaster}
        />
        {simulationDetails}
        {!renderSimulationFailureWarning && (
          <TransactionDetail
            disableEditGasFeeButton
            disabled={isDisabled()}
            userAcknowledgedGasMissing={userAcknowledgedGasMissing}
            onEdit={() => this.handleEditGas()}
            rows={[
              <div key="confirm-transaction-base_confirm-gas-display">
                <ConfirmGasDisplay
                  userAcknowledgedGasMissing={userAcknowledgedGasMissing}
                />
                <FeeDetailsComponent
                  useCurrencyRateCheck={useCurrencyRateCheck}
                  txData={txData}
                />
              </div>,
            ]}
          />
        )}
        {showTotals && (
          <TransactionDetail
            disableEditGasFeeButton
            disabled={isDisabled()}
            userAcknowledgedGasMissing={userAcknowledgedGasMissing}
            rows={[
              <TransactionDetailItem
                key="confirm-transaction-base-total-item"
                detailTitle={t('total')}
                detailText={
                  useCurrencyRateCheck &&
                  renderTotalDetailText(getTotalAmount())
                }
                detailTotal={renderTotalMaxAmount({
                  useMaxFee: false,
                  isBoldTextAndNotOverridden: true,
                })}
                subTitle={t('transactionDetailGasTotalSubtitle')}
                subText={
                  <div
                    className="confirm-page-container-content__total-amount"
                    data-testid="confirm-page-total-amount"
                  >
                    <LoadingHeartBeat
                      estimateUsed={this.props.txData?.userFeeLevel}
                    />
                    <Text
                      color={TextColor.textAlternative}
                      variant={TextVariant.bodySmMedium}
                    >
                      {t('editGasSubTextAmountLabel')}
                    </Text>{' '}
                    {renderTotalMaxAmount({
                      useMaxFee: true,
                    })}
                  </div>
                }
              />,
            ]}
          />
        )}
        {nonceField}
        {showLedgerSteps ? (
          <LedgerInstructionField
            showDataInstruction={Boolean(txData.txParams?.data)}
          />
        ) : null}
      </div>
    );
  }

  renderDataHex() {
    const { txData, dataHexComponent } = this.props;
    const {
      txParams: { data },
    } = txData;
    if (!data) {
      return null;
    }
    return (
      <ConfirmHexData txData={txData} dataHexComponent={dataHexComponent} />
    );
  }

  handleEdit() {
    const {
      txData,
      tokenData,
      tokenProps,
      onEdit,
      actionKey,
      txData: { origin },
      methodData = {},
    } = this.props;

    this.context.trackEvent({
      category: MetaMetricsEventCategory.Transactions,
      event: 'Edit Transaction',
      properties: {
        action: 'Confirm Screen',
        legacy_event: true,
        recipientKnown: null,
        functionType:
          actionKey ||
          getMethodName(methodData.name) ||
          TransactionType.contractInteraction,
        origin,
      },
    });

    onEdit({ txData, tokenData, tokenProps });
  }

  handleCancelAll() {
    const {
      cancelAllTransactions,
      clearConfirmTransaction,
      history,
      mostRecentOverviewPage,
      showRejectTransactionsConfirmationModal,
      unapprovedTxCount,
    } = this.props;

    showRejectTransactionsConfirmationModal({
      unapprovedTxCount,
      onSubmit: async () => {
        this._removeBeforeUnload();
        await cancelAllTransactions();
        clearConfirmTransaction();
        history.push(mostRecentOverviewPage);
      },
    });
  }

  async handleCancel() {
    const {
      txData,
      cancelTransaction,
      history,
      mostRecentOverviewPage,
      updateCustomNonce,
    } = this.props;

    this._removeBeforeUnload();
    updateCustomNonce('');
    await cancelTransaction(txData);
    history.push(mostRecentOverviewPage);
  }

  handleSubmit() {
    const { submitting } = this.state;

    if (submitting) {
      return;
    }

    this.props.isMainBetaFlask
      ? this.handleMainSubmit()
      : this.handleMMISubmit();
  }

  handleMainSubmit() {
    const {
      sendTransaction,
      txData,
      history,
      mostRecentOverviewPage,
      updateCustomNonce,
      methodData,
      maxFeePerGas,
      customTokenAmount,
      dappProposedTokenAmount,
      currentTokenBalance,
      maxPriorityFeePerGas,
      baseFeePerGas,
      addToAddressBookIfNew,
      toAccounts,
      toAddress,
      keyringForAccount,
      ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
      fromInternalAccount,
      ///: END:ONLY_INCLUDE_IF
    } = this.props;

    let loadingIndicatorMessage;

    switch (keyringForAccount?.type) {
      ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
      case KeyringType.snap:
        loadingIndicatorMessage = (
          <SnapAccountTransactionLoadingScreen
            internalAccount={fromInternalAccount}
          ></SnapAccountTransactionLoadingScreen>
        );
        break;
      ///: END:ONLY_INCLUDE_IF
      default:
        if (isHardwareKeyring(keyringForAccount?.type)) {
          loadingIndicatorMessage = this.context.t(
            'loadingScreenHardwareWalletMessage',
          );
        } else {
          loadingIndicatorMessage = null;
        }
        break;
    }

    updateTxData({
      txData,
      maxFeePerGas,
      customTokenAmount,
      dappProposedTokenAmount,
      currentTokenBalance,
      maxPriorityFeePerGas,
      baseFeePerGas,
      addToAddressBookIfNew,
      toAccounts,
      toAddress,
      name: methodData.name,
    });

    this.setState(
      {
        submitting: true,
        submitError: null,
      },
      () => {
        this._removeBeforeUnload();

        sendTransaction(txData, false, loadingIndicatorMessage)
          .then(() => {
            if (!this._isMounted) {
              return;
            }

            this.setState(
              {
                submitting: false,
              },
              () => {
                history.push(mostRecentOverviewPage);
                updateCustomNonce('');
              },
            );
          })
          .catch((error) => {
            if (!this._isMounted) {
              return;
            }
            this.setState({
              submitting: false,
              submitError: error.message,
            });
            updateCustomNonce('');
          });
      },
    );
  }

  async handleMMISubmit() {
    const {
      sendTransaction,
      updateTransaction,
      txData,
      history,
      mostRecentOverviewPage,
      updateCustomNonce,
      unapprovedTxCount,
      accountType,
      isNotification,
      setWaitForConfirmDeepLinkDialog,
      showTransactionsFailedModal,
      fromAddress,
      isNoteToTraderSupported,
      custodianPublishesTransaction,
      rpcUrl,
      methodData,
      maxFeePerGas,
      customTokenAmount,
      dappProposedTokenAmount,
      currentTokenBalance,
      maxPriorityFeePerGas,
      baseFeePerGas,
      addToAddressBookIfNew,
      toAccounts,
      toAddress,
      showCustodianDeepLink,
      clearConfirmTransaction,
      isSmartTransactionsEnabled,
    } = this.props;
    const { noteText } = this.state;

    if (accountType === AccountType.CUSTODY) {
      txData.custodyStatus = CustodyStatus.CREATED;
      txData.metadata = txData.metadata || {};

      if (isNoteToTraderSupported) {
        txData.metadata.note = noteText;
      }

      if (isSmartTransactionsEnabled) {
        txData.origin += '#smartTransaction';
      }

      txData.metadata.custodianPublishesTransaction =
        custodianPublishesTransaction;
      txData.metadata.rpcUrl = rpcUrl;

      await updateTransaction(txData);
    }

    updateTxData({
      txData,
      maxFeePerGas,
      customTokenAmount,
      dappProposedTokenAmount,
      currentTokenBalance,
      maxPriorityFeePerGas,
      baseFeePerGas,
      addToAddressBookIfNew,
      toAccounts,
      toAddress,
      name: methodData.name,
    });

    this.setState(
      {
        submitting: true,
        submitError: null,
      },
      () => {
        this._removeBeforeUnload();

        if (txData.custodyStatus) {
          setWaitForConfirmDeepLinkDialog(true);
        }

        sendTransaction(txData)
          .then(() => {
            if (txData.custodyStatus) {
              showCustodianDeepLink({
                fromAddress,
                closeNotification: isNotification && unapprovedTxCount === 1,
                txId: txData.id,
                onDeepLinkFetched: () => {
                  this.context.trackEvent({
                    category: 'MMI',
                    event: 'Show deeplink for transaction',
                  });
                },
                onDeepLinkShown: () => {
                  clearConfirmTransaction();
                  if (!this._isMounted) {
                    return;
                  }
                  this.setState({ submitting: false }, () => {
                    history.push(mostRecentOverviewPage);
                    updateCustomNonce('');
                  });
                },
              });
            } else {
              if (!this._isMounted) {
                return;
              }
              this.setState(
                {
                  submitting: false,
                },
                () => {
                  history.push(mostRecentOverviewPage);
                  updateCustomNonce('');
                },
              );
            }
          })
          .catch((error) => {
            if (!this._isMounted) {
              return;
            }

            showTransactionsFailedModal(error.message, isNotification);

            this.setState({
              submitting: false,
              submitError: error.message,
            });
            setWaitForConfirmDeepLinkDialog(true);
            updateCustomNonce('');
          });
      },
    );
  }

  handleSetApprovalForAll() {
    this.setState({ showWarningModal: true });
  }

  renderTitleComponent() {
    const { title, hexTransactionAmount, txData } = this.props;

    return (
      <ConfirmTitle
        title={title}
        hexTransactionAmount={hexTransactionAmount}
        txData={txData}
      />
    );
  }

  renderSubtitleComponent() {
    const { assetStandard, subtitleComponent, hexTransactionAmount, txData } =
      this.props;

    return (
      <ConfirmSubTitle
        hexTransactionAmount={hexTransactionAmount}
        subtitleComponent={subtitleComponent}
        txData={txData}
        assetStandard={assetStandard}
      />
    );
  }

  _beforeUnloadForGasPolling = () => {
    this._isMounted = false;
    if (this.state.pollingToken) {
      gasFeeStopPollingByPollingToken(this.state.pollingToken);
      removePollingTokenFromAppState(this.state.pollingToken);
    }
  };

  _removeBeforeUnload = () => {
    window.removeEventListener('beforeunload', this._beforeUnloadForGasPolling);
  };

  componentDidMount() {
    this._isMounted = true;
    const {
      toAddress,
      txData: { origin, chainId: txChainId } = {},
      getNextNonce,
      tryReverseResolveAddress,
      smartTransactionsOptInStatus,
      currentChainSupportsSmartTransactions,
      setSwapsFeatureFlags,
      fetchSmartTransactionsLiveness,
      chainId,
    } = this.props;

    // If the user somehow finds themselves seeing a confirmation
    // on a network which is not presently selected, throw
    if (txChainId === undefined || txChainId !== chainId) {
      throw new Error(
        `Currently selected chainId (${chainId}) does not match chainId (${txChainId}) on which the transaction was proposed.`,
      );
    }

    const { trackEvent } = this.context;
    trackEvent({
      category: MetaMetricsEventCategory.Transactions,
      event: 'Confirm: Started',
      properties: {
        action: 'Confirm Screen',
        legacy_event: true,
        origin,
      },
    });

    getNextNonce();
    if (toAddress) {
      tryReverseResolveAddress(toAddress);
    }

    /**
     * This makes a request to get estimates and begin polling, keeping track of the poll
     * token in component state.
     * It then disconnects polling upon componentWillUnmount. If the hook is unmounted
     * while waiting for `gasFeeStartPollingByNetworkClientId` to resolve, the `_isMounted`
     * flag ensures that a call to disconnect happens after promise resolution.
     */
    gasFeeStartPollingByNetworkClientId(
      this.props.selectedNetworkClientId,
    ).then((pollingToken) => {
      if (this._isMounted) {
        addPollingTokenToAppState(pollingToken);
        this.setState({ pollingToken });
      } else {
        gasFeeStopPollingByPollingToken(pollingToken);
        removePollingTokenFromAppState(this.state.pollingToken);
      }
    });

    window.addEventListener('beforeunload', this._beforeUnloadForGasPolling);

    if (smartTransactionsOptInStatus && currentChainSupportsSmartTransactions) {
      // TODO: Fetching swaps feature flags, which include feature flags for smart transactions, is only a short-term solution.
      // Long-term, we want to have a new proxy service specifically for feature flags.
      Promise.all([
        fetchSwapsFeatureFlags(),
        fetchSmartTransactionsLiveness(),
      ]).then(([swapsFeatureFlags]) => setSwapsFeatureFlags(swapsFeatureFlags));
    }
  }

  componentWillUnmount() {
    this._beforeUnloadForGasPolling();
    this._removeBeforeUnload();
    this.props.clearConfirmTransaction();
  }

  supportsEIP1559 =
    this.props.supportsEIP1559 && !isLegacyTransaction(this.props.txData);

  render() {
    const { t } = this.context;
    const {
      fromName,
      fromAddress,
      toName,
      toAddress,
      toEns,
      toNickname,
      methodData,
      tokenAddress,
      contentComponent,
      onEdit,
      nonce,
      customNonceValue,
      unapprovedTxCount,
      type,
      hideSenderToRecipient,
      showAccountInHeader,
      txData,
      gasIsLoading,
      gasFeeIsCustom,
      nativeCurrency,
      hardwareWalletRequiresConnection,
      image,
      isApprovalOrRejection,
      assetStandard,
      displayAccountBalanceHeader,
      title,
      isSigningOrSubmitting,
      ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
      isNoteToTraderSupported,
      ///: END:ONLY_INCLUDE_IF
    } = this.props;
    const {
      submitting,
      submitError,
      submitWarning,
      ethGasPriceWarning,
      editingGas,
      userAcknowledgedGasMissing,
      showWarningModal,
    } = this.state;
    const { name } = methodData;
    const { valid, errorKey } = this.getErrorKey();
    const hasSimulationError = Boolean(txData.simulationFails);
    const renderSimulationFailureWarning =
      hasSimulationError && !userAcknowledgedGasMissing;

    // This `isTokenApproval` case is added to handle possible rendering of this component from
    // confirm-approve.js when `assetStandard` is `undefined`. That will happen if the request to
    // get the asset standard fails. In that scenario, confirm-approve.js returns the `<ConfirmContractInteraction />`
    // component, which in turn returns this `<ConfirmTransactionBase />` component. We meed to prevent
    // the user from editing the transaction in those cases.

    // as this component is made functional, useTransactionFunctionType can be used to get functionType
    const isTokenApproval =
      txData.type === TransactionType.tokenMethodSetApprovalForAll ||
      txData.type === TransactionType.tokenMethodApprove ||
      txData.type === TransactionType.tokenMethodIncreaseAllowance;
    const isContractInteraction =
      txData.type === TransactionType.contractInteraction;

    const isContractInteractionFromDapp =
      (isTokenApproval || isContractInteraction) &&
      txData.origin !== 'metamask';
    let functionType;
    if (isContractInteractionFromDapp) {
      functionType = getMethodName(name);
    }

    if (!functionType) {
      if (type) {
        functionType = getTransactionTypeTitle(t, type, nativeCurrency);
      } else {
        functionType = t('contractInteraction');
      }
    }

    return (
      <TransactionModalContextProvider>
        <ConfirmPageContainer
          fromName={fromName}
          fromAddress={fromAddress}
          showAccountInHeader={showAccountInHeader}
          toName={toName}
          toAddress={toAddress}
          toEns={toEns}
          toNickname={toNickname}
          showEdit={!isContractInteractionFromDapp && Boolean(onEdit)}
          action={functionType}
          image={image}
          title={title}
          titleComponent={this.renderTitleComponent()}
          subtitleComponent={this.renderSubtitleComponent()}
          detailsComponent={this.renderDetails()}
          dataHexComponent={this.renderDataHex(functionType)}
          contentComponent={contentComponent}
          ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
          noteComponent={
            isNoteToTraderSupported && (
              <NoteToTrader
                maxLength={280}
                placeholder={t('notePlaceholder')}
                onChange={(value) => this.setState({ noteText: value })}
                noteText={this.state.noteText}
                labelText={t('transactionNote')}
              />
            )
          }
          ///: END:ONLY_INCLUDE_IF
          nonce={customNonceValue || nonce}
          unapprovedTxCount={unapprovedTxCount}
          tokenAddress={tokenAddress}
          errorMessage={submitError}
          errorKey={errorKey}
          hasSimulationError={hasSimulationError}
          warning={submitWarning}
          disabled={
            renderSimulationFailureWarning ||
            !valid ||
            submitting ||
            hardwareWalletRequiresConnection ||
            (gasIsLoading && !gasFeeIsCustom) ||
            isSigningOrSubmitting
          }
          onEdit={() => this.handleEdit()}
          onCancelAll={() => this.handleCancelAll()}
          onCancel={() => this.handleCancel()}
          onSubmit={() => this.handleSubmit()}
          onSetApprovalForAll={() => this.handleSetApprovalForAll()}
          showWarningModal={showWarningModal}
          hideSenderToRecipient={hideSenderToRecipient}
          origin={txData.origin}
          ethGasPriceWarning={ethGasPriceWarning}
          editingGas={editingGas}
          handleCloseEditGas={() => this.handleCloseEditGas()}
          currentTransaction={txData}
          supportsEIP1559={this.supportsEIP1559}
          nativeCurrency={nativeCurrency}
          isApprovalOrRejection={isApprovalOrRejection}
          assetStandard={assetStandard}
          txData={txData}
          displayAccountBalanceHeader={displayAccountBalanceHeader}
        />
        <NetworkChangeToastLegacy confirmation={txData} />
      </TransactionModalContextProvider>
    );
  }
}
