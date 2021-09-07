import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { ENVIRONMENT_TYPE_NOTIFICATION } from '../../../shared/constants/app';
import { getEnvironmentType } from '../../../app/scripts/lib/util';
import ConfirmPageContainer from '../../components/app/confirm-page-container';
import { isBalanceSufficient } from '../send/send.utils';
import {
  addHexes,
  hexToDecimal,
  hexWEIToDecGWEI,
} from '../../helpers/utils/conversions.util';
import {
  CONFIRM_TRANSACTION_ROUTE,
  DEFAULT_ROUTE,
} from '../../helpers/constants/routes';
import {
  INSUFFICIENT_FUNDS_ERROR_KEY,
  TRANSACTION_ERROR_KEY,
  GAS_LIMIT_TOO_LOW_ERROR_KEY,
  ETH_GAS_PRICE_FETCH_WARNING_KEY,
  GAS_PRICE_FETCH_FAILURE_ERROR_KEY,
} from '../../helpers/constants/error-keys';
import UserPreferencedCurrencyDisplay from '../../components/app/user-preferenced-currency-display';
import { PRIMARY, SECONDARY } from '../../helpers/constants/common';
import TextField from '../../components/ui/text-field';
import {
  TRANSACTION_TYPES,
  TRANSACTION_STATUSES,
} from '../../../shared/constants/transaction';
import { getTransactionTypeTitle } from '../../helpers/utils/transactions.util';
import { toBuffer } from '../../../shared/modules/buffer-utils';

import TransactionDetail from '../../components/app/transaction-detail/transaction-detail.component';
import TransactionDetailItem from '../../components/app/transaction-detail-item/transaction-detail-item.component';
import InfoTooltip from '../../components/ui/info-tooltip/info-tooltip';
import LoadingHeartBeat from '../../components/ui/loading-heartbeat';
import GasTiming from '../../components/app/gas-timing/gas-timing.component';
import Dialog from '../../components/ui/dialog';

import {
  COLORS,
  FONT_STYLE,
  FONT_WEIGHT,
  TYPOGRAPHY,
} from '../../helpers/constants/design-system';
import {
  disconnectGasFeeEstimatePoller,
  getGasFeeEstimatesAndStartPolling,
  addPollingTokenToAppState,
  removePollingTokenFromAppState,
} from '../../store/actions';

import Typography from '../../components/ui/typography/typography';

const renderHeartBeatIfNotInTest = () =>
  process.env.IN_TEST === 'true' ? null : <LoadingHeartBeat />;

export default class ConfirmTransactionBase extends Component {
  static contextTypes = {
    t: PropTypes.func,
    metricsEvent: PropTypes.func,
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
    hexMinimumTransactionFee: PropTypes.string,
    hexMaximumTransactionFee: PropTypes.string,
    hexTransactionTotal: PropTypes.string,
    methodData: PropTypes.object,
    nonce: PropTypes.string,
    useNonceField: PropTypes.bool,
    customNonceValue: PropTypes.string,
    updateCustomNonce: PropTypes.func,
    assetImage: PropTypes.string,
    sendTransaction: PropTypes.func,
    showTransactionConfirmedModal: PropTypes.func,
    showRejectTransactionsConfirmationModal: PropTypes.func,
    toAddress: PropTypes.string,
    tokenData: PropTypes.object,
    tokenProps: PropTypes.object,
    toName: PropTypes.string,
    toEns: PropTypes.string,
    toNickname: PropTypes.string,
    transactionStatus: PropTypes.string,
    txData: PropTypes.object,
    unapprovedTxCount: PropTypes.number,
    currentNetworkUnapprovedTxs: PropTypes.object,
    customGas: PropTypes.object,
    // Component props
    actionKey: PropTypes.string,
    contentComponent: PropTypes.node,
    dataComponent: PropTypes.node,
    hideData: PropTypes.bool,
    hideSubtitle: PropTypes.bool,
    identiconAddress: PropTypes.string,
    onEdit: PropTypes.func,
    subtitleComponent: PropTypes.node,
    title: PropTypes.string,
    type: PropTypes.string,
    getNextNonce: PropTypes.func,
    nextNonce: PropTypes.number,
    tryReverseResolveAddress: PropTypes.func.isRequired,
    hideSenderToRecipient: PropTypes.bool,
    showAccountInHeader: PropTypes.bool,
    mostRecentOverviewPage: PropTypes.string.isRequired,
    isEthGasPrice: PropTypes.bool,
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
    isMainnet: PropTypes.bool,
    gasFeeIsCustom: PropTypes.bool,
    isLedgerAccount: PropTypes.bool.isRequired,
    isFirefox: PropTypes.bool.isRequired,
  };

  state = {
    submitting: false,
    submitError: null,
    submitWarning: '',
    ethGasPriceWarning: '',
    editingGas: false,
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
      isEthGasPrice,
      setDefaultHomeActiveTabName,
    } = this.props;
    const {
      customNonceValue: prevCustomNonceValue,
      nextNonce: prevNextNonce,
      toAddress: prevToAddress,
      transactionStatus: prevTxStatus,
      isEthGasPrice: prevIsEthGasPrice,
    } = prevProps;
    const statusUpdated = transactionStatus !== prevTxStatus;
    const txDroppedOrConfirmed =
      transactionStatus === TRANSACTION_STATUSES.DROPPED ||
      transactionStatus === TRANSACTION_STATUSES.CONFIRMED;

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
          setDefaultHomeActiveTabName('Activity').then(() => {
            history.push(DEFAULT_ROUTE);
          });
        },
      });
    }

    if (toAddress && toAddress !== prevToAddress) {
      tryReverseResolveAddress(toAddress);
    }

    if (isEthGasPrice !== prevIsEthGasPrice) {
      if (isEthGasPrice) {
        this.setState({
          ethGasPriceWarning: this.context.t(ETH_GAS_PRICE_FETCH_WARNING_KEY),
        });
      } else {
        this.setState({
          ethGasPriceWarning: '',
        });
      }
    }
  }

  getErrorKey() {
    const {
      balance,
      conversionRate,
      hexMaximumTransactionFee,
      txData: { simulationFails, txParams: { value: amount } = {} } = {},
      customGas,
      noGasPrice,
      gasFeeIsCustom,
    } = this.props;

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

    if (hexToDecimal(customGas.gasLimit) < 21000) {
      return {
        valid: false,
        errorKey: GAS_LIMIT_TOO_LOW_ERROR_KEY,
      };
    }

    if (simulationFails) {
      return {
        valid: true,
        errorKey: simulationFails.errorKey
          ? simulationFails.errorKey
          : TRANSACTION_ERROR_KEY,
      };
    }

    if (noGasPrice && !gasFeeIsCustom) {
      return {
        valid: false,
        errorKey: GAS_PRICE_FETCH_FAILURE_ERROR_KEY,
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

    this.context.metricsEvent({
      eventOpts: {
        category: 'Transactions',
        action: 'Confirm Screen',
        name: 'User clicks "Edit" on gas',
      },
      customVariables: {
        recipientKnown: null,
        functionType:
          actionKey ||
          getMethodName(methodData.name) ||
          TRANSACTION_TYPES.CONTRACT_INTERACTION,
        origin,
      },
    });

    this.setState({ editingGas: true });
  }

  handleCloseEditGas() {
    this.setState({ editingGas: false });
  }

  renderDetails() {
    const {
      primaryTotalTextOverride,
      secondaryTotalTextOverride,
      hexMinimumTransactionFee,
      hexMaximumTransactionFee,
      hexTransactionTotal,
      useNonceField,
      customNonceValue,
      updateCustomNonce,
      nextNonce,
      getNextNonce,
      txData,
      useNativeCurrencyAsPrimaryCurrency,
      primaryTotalTextOverrideMaxAmount,
      maxFeePerGas,
      maxPriorityFeePerGas,
      isMainnet,
      isLedgerAccount,
      isFirefox,
    } = this.props;
    const { t } = this.context;

    const renderTotalMaxAmount = () => {
      if (
        primaryTotalTextOverrideMaxAmount === undefined &&
        secondaryTotalTextOverride === undefined
      ) {
        // Native Send
        return (
          <UserPreferencedCurrencyDisplay
            type={PRIMARY}
            key="total-max-amount"
            value={addHexes(txData.txParams.value, hexMaximumTransactionFee)}
            hideLabel={!useNativeCurrencyAsPrimaryCurrency}
          />
        );
      }

      // Token send
      return useNativeCurrencyAsPrimaryCurrency
        ? primaryTotalTextOverrideMaxAmount
        : secondaryTotalTextOverride;
    };

    const renderTotalDetailTotal = () => {
      if (
        primaryTotalTextOverride === undefined &&
        secondaryTotalTextOverride === undefined
      ) {
        return (
          <UserPreferencedCurrencyDisplay
            type={PRIMARY}
            key="total-detail-value"
            value={hexTransactionTotal}
            hideLabel={!useNativeCurrencyAsPrimaryCurrency}
          />
        );
      }
      return useNativeCurrencyAsPrimaryCurrency
        ? primaryTotalTextOverride
        : secondaryTotalTextOverride;
    };

    const renderTotalDetailText = () => {
      if (
        primaryTotalTextOverride === undefined &&
        secondaryTotalTextOverride === undefined
      ) {
        return (
          <UserPreferencedCurrencyDisplay
            type={SECONDARY}
            key="total-detail-text"
            value={hexTransactionTotal}
            hideLabel={Boolean(useNativeCurrencyAsPrimaryCurrency)}
          />
        );
      }
      return useNativeCurrencyAsPrimaryCurrency
        ? secondaryTotalTextOverride
        : primaryTotalTextOverride;
    };

    const nonceField = useNonceField ? (
      <div>
        <div className="confirm-detail-row">
          <div className="confirm-detail-row__label">
            {t('nonceFieldHeading')}
          </div>
          <div className="custom-nonce-input">
            <TextField
              type="number"
              min="0"
              placeholder={
                typeof nextNonce === 'number' ? nextNonce.toString() : null
              }
              onChange={({ target: { value } }) => {
                if (!value.length || Number(value) < 0) {
                  updateCustomNonce('');
                } else {
                  updateCustomNonce(String(Math.floor(value)));
                }
                getNextNonce();
              }}
              fullWidth
              margin="dense"
              value={customNonceValue || ''}
            />
          </div>
        </div>
      </div>
    ) : null;

    const ledgerInstructionField = isLedgerAccount ? (
      <div>
        <div className="confirm-detail-row">
          <Dialog type="message">
            <div className="ledger-live-dialog">
              <Typography
                boxProps={{ margin: 0 }}
                color={COLORS.PRIMARY3}
                fontWeight={FONT_WEIGHT.BOLD}
                variant={TYPOGRAPHY.H7}
              >
                {t('ledgerLiveDialogHeader')}
              </Typography>
              {!isFirefox && (
                <Typography
                  boxProps={{ margin: 0 }}
                  color={COLORS.PRIMARY3}
                  fontWeight={FONT_WEIGHT.BOLD}
                  variant={TYPOGRAPHY.H7}
                >
                  {`- ${t('ledgerLiveDialogStepOne')}`}
                </Typography>
              )}
              <Typography
                boxProps={{ margin: 0 }}
                color={COLORS.PRIMARY3}
                fontWeight={FONT_WEIGHT.BOLD}
                variant={TYPOGRAPHY.H7}
              >
                {`- ${t('ledgerLiveDialogStepTwo')}`}
              </Typography>
              <Typography
                boxProps={{ margin: 0 }}
                color={COLORS.PRIMARY3}
                fontWeight={FONT_WEIGHT.BOLD}
                variant={TYPOGRAPHY.H7}
              >
                {`- ${t('ledgerLiveDialogStepThree')}`}
              </Typography>
            </div>
          </Dialog>
        </div>
      </div>
    ) : null;

    return (
      <div className="confirm-page-container-content__details">
        <TransactionDetail
          onEdit={() => this.handleEditGas()}
          rows={[
            <TransactionDetailItem
              key="gas-item"
              detailTitle={
                txData.dappSuggestedGasFees ? (
                  <>
                    {t('transactionDetailGasHeading')}
                    <InfoTooltip
                      contentText={t('transactionDetailDappGasTooltip')}
                      position="top"
                    >
                      <i className="fa fa-info-circle" />
                    </InfoTooltip>
                  </>
                ) : (
                  <>
                    {t('transactionDetailGasHeading')}
                    <InfoTooltip
                      contentText={
                        <>
                          <p>
                            {t('transactionDetailGasTooltipIntro', [
                              isMainnet ? t('networkNameEthereum') : '',
                            ])}
                          </p>
                          <p>{t('transactionDetailGasTooltipExplanation')}</p>
                          <p>
                            <a
                              href="https://community.metamask.io/t/what-is-gas-why-do-transactions-take-so-long/3172"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {t('transactionDetailGasTooltipConversion')}
                            </a>
                          </p>
                        </>
                      }
                      position="top"
                    >
                      <i className="fa fa-info-circle" />
                    </InfoTooltip>
                  </>
                )
              }
              detailTitleColor={COLORS.BLACK}
              detailText={
                <div className="confirm-page-container-content__currency-container">
                  {renderHeartBeatIfNotInTest()}
                  <UserPreferencedCurrencyDisplay
                    type={SECONDARY}
                    value={hexMinimumTransactionFee}
                    hideLabel={Boolean(useNativeCurrencyAsPrimaryCurrency)}
                  />
                </div>
              }
              detailTotal={
                <div className="confirm-page-container-content__currency-container">
                  {renderHeartBeatIfNotInTest()}
                  <UserPreferencedCurrencyDisplay
                    type={PRIMARY}
                    value={hexMinimumTransactionFee}
                    hideLabel={!useNativeCurrencyAsPrimaryCurrency}
                  />
                </div>
              }
              subText={t('editGasSubTextFee', [
                <b key="editGasSubTextFeeLabel">
                  {t('editGasSubTextFeeLabel')}
                </b>,
                <div
                  key="editGasSubTextFeeValue"
                  className="confirm-page-container-content__currency-container"
                >
                  {renderHeartBeatIfNotInTest()}
                  <UserPreferencedCurrencyDisplay
                    key="editGasSubTextFeeAmount"
                    type={PRIMARY}
                    value={hexMaximumTransactionFee}
                    hideLabel={!useNativeCurrencyAsPrimaryCurrency}
                  />
                </div>,
              ])}
              subTitle={
                <>
                  {txData.dappSuggestedGasFees ? (
                    <Typography
                      variant={TYPOGRAPHY.H7}
                      fontStyle={FONT_STYLE.ITALIC}
                      color={COLORS.GRAY}
                    >
                      {t('transactionDetailDappGasMoreInfo')}
                    </Typography>
                  ) : (
                    ''
                  )}
                  <GasTiming
                    maxPriorityFeePerGas={hexWEIToDecGWEI(
                      maxPriorityFeePerGas ||
                        txData.txParams.maxPriorityFeePerGas,
                    )}
                    maxFeePerGas={hexWEIToDecGWEI(
                      maxFeePerGas || txData.txParams.maxFeePerGas,
                    )}
                  />
                </>
              }
            />,
            <TransactionDetailItem
              key="total-item"
              detailTitle={t('total')}
              detailText={renderTotalDetailText()}
              detailTotal={renderTotalDetailTotal()}
              subTitle={t('transactionDetailGasTotalSubtitle')}
              subText={t('editGasSubTextAmount', [
                <b key="editGasSubTextAmountLabel">
                  {t('editGasSubTextAmountLabel')}
                </b>,
                renderTotalMaxAmount(),
              ])}
            />,
          ]}
        />
        {nonceField}
        {ledgerInstructionField}
      </div>
    );
  }

  renderData(functionType) {
    const { t } = this.context;
    const {
      txData: { txParams: { data } = {} } = {},
      methodData: { params } = {},
      hideData,
      dataComponent,
    } = this.props;

    if (hideData) {
      return null;
    }

    return (
      dataComponent || (
        <div className="confirm-page-container-content__data">
          <div className="confirm-page-container-content__data-box-label">
            {`${t('functionType')}:`}
            <span className="confirm-page-container-content__function-type">
              {functionType}
            </span>
          </div>
          {params && (
            <div className="confirm-page-container-content__data-box">
              <div className="confirm-page-container-content__data-field-label">
                {`${t('parameters')}:`}
              </div>
              <div>
                <pre>{JSON.stringify(params, null, 2)}</pre>
              </div>
            </div>
          )}
          <div className="confirm-page-container-content__data-box-label">
            {`${t('hexData')}: ${toBuffer(data).length} bytes`}
          </div>
          <div className="confirm-page-container-content__data-box">{data}</div>
        </div>
      )
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

    this.context.metricsEvent({
      eventOpts: {
        category: 'Transactions',
        action: 'Confirm Screen',
        name: 'Edit Transaction',
      },
      customVariables: {
        recipientKnown: null,
        functionType:
          actionKey ||
          getMethodName(methodData.name) ||
          TRANSACTION_TYPES.CONTRACT_INTERACTION,
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

  handleCancel() {
    const {
      txData,
      cancelTransaction,
      history,
      mostRecentOverviewPage,
      clearConfirmTransaction,
      updateCustomNonce,
    } = this.props;

    this._removeBeforeUnload();
    updateCustomNonce('');
    cancelTransaction(txData).then(() => {
      clearConfirmTransaction();
      history.push(mostRecentOverviewPage);
    });
  }

  handleSubmit() {
    const {
      sendTransaction,
      clearConfirmTransaction,
      txData,
      history,
      mostRecentOverviewPage,
      updateCustomNonce,
      maxFeePerGas,
      maxPriorityFeePerGas,
      baseFeePerGas,
    } = this.props;
    const { submitting } = this.state;

    if (submitting) {
      return;
    }

    if (baseFeePerGas) {
      txData.estimatedBaseFee = baseFeePerGas;
    }

    if (maxFeePerGas) {
      txData.txParams = {
        ...txData.txParams,
        maxFeePerGas,
      };
    }

    if (maxPriorityFeePerGas) {
      txData.txParams = {
        ...txData.txParams,
        maxPriorityFeePerGas,
      };
    }

    this.setState(
      {
        submitting: true,
        submitError: null,
      },
      () => {
        this._removeBeforeUnload();

        sendTransaction(txData)
          .then(() => {
            clearConfirmTransaction();
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
            this.setState({
              submitting: false,
              submitError: error.message,
            });
            updateCustomNonce('');
          });
      },
    );
  }

  renderTitleComponent() {
    const { title, hexTransactionAmount } = this.props;

    // Title string passed in by props takes priority
    if (title) {
      return null;
    }

    return (
      <UserPreferencedCurrencyDisplay
        value={hexTransactionAmount}
        type={PRIMARY}
        showEthLogo
        ethLogoHeight="26"
        hideLabel
      />
    );
  }

  renderSubtitleComponent() {
    const { subtitleComponent, hexTransactionAmount } = this.props;

    return (
      subtitleComponent || (
        <UserPreferencedCurrencyDisplay
          value={hexTransactionAmount}
          type={SECONDARY}
          showEthLogo
          hideLabel
        />
      )
    );
  }

  handleNextTx(txId) {
    const { history, clearConfirmTransaction } = this.props;

    if (txId) {
      clearConfirmTransaction();
      history.push(`${CONFIRM_TRANSACTION_ROUTE}/${txId}`);
    }
  }

  getNavigateTxData() {
    const { currentNetworkUnapprovedTxs, txData: { id } = {} } = this.props;
    const enumUnapprovedTxs = Object.keys(currentNetworkUnapprovedTxs);
    const currentPosition = enumUnapprovedTxs.indexOf(id ? id.toString() : '');

    return {
      totalTx: enumUnapprovedTxs.length,
      positionOfCurrentTx: currentPosition + 1,
      nextTxId: enumUnapprovedTxs[currentPosition + 1],
      prevTxId: enumUnapprovedTxs[currentPosition - 1],
      showNavigation: enumUnapprovedTxs.length > 1,
      firstTx: enumUnapprovedTxs[0],
      lastTx: enumUnapprovedTxs[enumUnapprovedTxs.length - 1],
      ofText: this.context.t('ofTextNofM'),
      requestsWaitingText: this.context.t('requestsAwaitingAcknowledgement'),
    };
  }

  _beforeUnload = () => {
    const { txData: { id } = {}, cancelTransaction } = this.props;
    cancelTransaction({ id });
  };

  _beforeUnloadForGasPolling = () => {
    this._isMounted = false;
    if (this.state.pollingToken) {
      disconnectGasFeeEstimatePoller(this.state.pollingToken);
      removePollingTokenFromAppState(this.state.pollingToken);
    }
  };

  _removeBeforeUnload = () => {
    if (getEnvironmentType() === ENVIRONMENT_TYPE_NOTIFICATION) {
      window.removeEventListener('beforeunload', this._beforeUnload);
    }
    window.removeEventListener('beforeunload', this._beforeUnloadForGasPolling);
  };

  componentDidMount() {
    this._isMounted = true;
    const {
      toAddress,
      txData: { origin } = {},
      getNextNonce,
      tryReverseResolveAddress,
    } = this.props;
    const { metricsEvent } = this.context;
    metricsEvent({
      eventOpts: {
        category: 'Transactions',
        action: 'Confirm Screen',
        name: 'Confirm: Started',
      },
      customVariables: {
        origin,
      },
    });

    if (getEnvironmentType() === ENVIRONMENT_TYPE_NOTIFICATION) {
      window.addEventListener('beforeunload', this._beforeUnload);
    }

    getNextNonce();
    if (toAddress) {
      tryReverseResolveAddress(toAddress);
    }

    /**
     * This makes a request to get estimates and begin polling, keeping track of the poll
     * token in component state.
     * It then disconnects polling upon componentWillUnmount. If the hook is unmounted
     * while waiting for `getGasFeeEstimatesAndStartPolling` to resolve, the `_isMounted`
     * flag ensures that a call to disconnect happens after promise resolution.
     */
    getGasFeeEstimatesAndStartPolling().then((pollingToken) => {
      if (this._isMounted) {
        addPollingTokenToAppState(pollingToken);
        this.setState({ pollingToken });
      } else {
        disconnectGasFeeEstimatePoller(pollingToken);
        removePollingTokenFromAppState(this.state.pollingToken);
      }
    });
    window.addEventListener('beforeunload', this._beforeUnloadForGasPolling);
  }

  componentWillUnmount() {
    this._beforeUnloadForGasPolling();
    this._removeBeforeUnload();
  }

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
      title,
      hideSubtitle,
      identiconAddress,
      contentComponent,
      onEdit,
      nonce,
      customNonceValue,
      assetImage,
      unapprovedTxCount,
      type,
      hideSenderToRecipient,
      showAccountInHeader,
      txData,
      gasIsLoading,
      gasFeeIsCustom,
    } = this.props;
    const {
      submitting,
      submitError,
      submitWarning,
      ethGasPriceWarning,
      editingGas,
    } = this.state;

    const { name } = methodData;
    const { valid, errorKey } = this.getErrorKey();
    const {
      totalTx,
      positionOfCurrentTx,
      nextTxId,
      prevTxId,
      showNavigation,
      firstTx,
      lastTx,
      ofText,
      requestsWaitingText,
    } = this.getNavigateTxData();

    let functionType = getMethodName(name);
    if (!functionType) {
      if (type) {
        functionType = getTransactionTypeTitle(t, type);
      } else {
        functionType = t('contractInteraction');
      }
    }
    return (
      <ConfirmPageContainer
        fromName={fromName}
        fromAddress={fromAddress}
        showAccountInHeader={showAccountInHeader}
        toName={toName}
        toAddress={toAddress}
        toEns={toEns}
        toNickname={toNickname}
        showEdit={Boolean(onEdit)}
        action={functionType}
        title={title}
        titleComponent={this.renderTitleComponent()}
        subtitleComponent={this.renderSubtitleComponent()}
        hideSubtitle={hideSubtitle}
        detailsComponent={this.renderDetails()}
        dataComponent={this.renderData(functionType)}
        contentComponent={contentComponent}
        nonce={customNonceValue || nonce}
        unapprovedTxCount={unapprovedTxCount}
        assetImage={assetImage}
        identiconAddress={identiconAddress}
        errorMessage={submitError}
        errorKey={errorKey}
        warning={submitWarning}
        totalTx={totalTx}
        positionOfCurrentTx={positionOfCurrentTx}
        nextTxId={nextTxId}
        prevTxId={prevTxId}
        showNavigation={showNavigation}
        onNextTx={(txId) => this.handleNextTx(txId)}
        firstTx={firstTx}
        lastTx={lastTx}
        ofText={ofText}
        requestsWaitingText={requestsWaitingText}
        disabled={!valid || submitting || (gasIsLoading && !gasFeeIsCustom)}
        onEdit={() => this.handleEdit()}
        onCancelAll={() => this.handleCancelAll()}
        onCancel={() => this.handleCancel()}
        onSubmit={() => this.handleSubmit()}
        hideSenderToRecipient={hideSenderToRecipient}
        origin={txData.origin}
        ethGasPriceWarning={ethGasPriceWarning}
        editingGas={editingGas}
        handleCloseEditGas={() => this.handleCloseEditGas()}
        currentTransaction={txData}
      />
    );
  }
}

export function getMethodName(camelCase) {
  if (!camelCase || typeof camelCase !== 'string') {
    return '';
  }

  return camelCase
    .replace(/([a-z])([A-Z])/gu, '$1 $2')
    .replace(/([A-Z])([a-z])/gu, ' $1$2')
    .replace(/ +/gu, ' ');
}
