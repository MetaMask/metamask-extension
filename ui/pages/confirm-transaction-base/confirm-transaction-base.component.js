import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ConfirmPageContainer from '../../components/app/confirm-page-container';
import TransactionDecoding from '../../components/app/transaction-decoding';
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
  GAS_LIMIT_TOO_LOW_ERROR_KEY,
  ETH_GAS_PRICE_FETCH_WARNING_KEY,
  GAS_PRICE_FETCH_FAILURE_ERROR_KEY,
} from '../../helpers/constants/error-keys';
import UserPreferencedCurrencyDisplay from '../../components/app/user-preferenced-currency-display';
import CopyRawData from '../../components/app/transaction-decoding/components/ui/copy-raw-data';

import { PRIMARY, SECONDARY } from '../../helpers/constants/common';
import TextField from '../../components/ui/text-field';
import ActionableMessage from '../../components/ui/actionable-message';
import Disclosure from '../../components/ui/disclosure';
import { EVENT } from '../../../shared/constants/metametrics';
import {
  TRANSACTION_TYPES,
  TRANSACTION_STATUSES,
} from '../../../shared/constants/transaction';
import { getMethodName } from '../../helpers/utils/metrics';
import {
  getTransactionTypeTitle,
  isLegacyTransaction,
} from '../../helpers/utils/transactions.util';
import { toBuffer } from '../../../shared/modules/buffer-utils';

import { TransactionModalContextProvider } from '../../contexts/transaction-modal';
import TransactionDetail from '../../components/app/transaction-detail/transaction-detail.component';
import TransactionDetailItem from '../../components/app/transaction-detail-item/transaction-detail-item.component';
import InfoTooltip from '../../components/ui/info-tooltip/info-tooltip';
import LoadingHeartBeat from '../../components/ui/loading-heartbeat';
import GasDetailsItem from '../../components/app/gas-details-item';
import GasTiming from '../../components/app/gas-timing/gas-timing.component';
import LedgerInstructionField from '../../components/app/ledger-instruction-field';
import MultiLayerFeeMessage from '../../components/app/multilayer-fee-message';

import {
  COLORS,
  FONT_STYLE,
  TYPOGRAPHY,
} from '../../helpers/constants/design-system';
import {
  disconnectGasFeeEstimatePoller,
  getGasFeeEstimatesAndStartPolling,
  addPollingTokenToAppState,
  removePollingTokenFromAppState,
} from '../../store/actions';

import Typography from '../../components/ui/typography/typography';
import { MIN_GAS_LIMIT_DEC } from '../send/send.constants';
import { NETWORK_TO_NAME_MAP } from '../../../shared/constants/network';

import TransactionAlerts from './transaction-alerts';

const renderHeartBeatIfNotInTest = () =>
  process.env.IN_TEST ? null : <LoadingHeartBeat />;

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
    hexMinimumTransactionFee: PropTypes.string,
    hexMaximumTransactionFee: PropTypes.string,
    hexTransactionTotal: PropTypes.string,
    methodData: PropTypes.object,
    nonce: PropTypes.string,
    useNonceField: PropTypes.bool,
    customNonceValue: PropTypes.string,
    updateCustomNonce: PropTypes.func,
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
    dataHexComponent: PropTypes.node,
    hideData: PropTypes.bool,
    hideSubtitle: PropTypes.bool,
    tokenAddress: PropTypes.string,
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
    showLedgerSteps: PropTypes.bool.isRequired,
    nativeCurrency: PropTypes.string,
    supportsEIP1559: PropTypes.bool,
    hardwareWalletRequiresConnection: PropTypes.bool,
    isMultiLayerFeeNetwork: PropTypes.bool,
    eip1559V2Enabled: PropTypes.bool,
    showBuyModal: PropTypes.func,
    isBuyableChain: PropTypes.bool,
  };

  state = {
    submitting: false,
    submitError: null,
    submitWarning: '',
    ethGasPriceWarning: '',
    editingGas: false,
    userAcknowledgedGasMissing: false,
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
      txData: { txParams: { value: amount } = {} } = {},
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
      category: EVENT.CATEGORIES.TRANSACTIONS,
      event: 'User clicks "Edit" on gas',
      properties: {
        action: 'Confirm Screen',
        legacy_event: true,
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

  setUserAcknowledgedGasMissing() {
    this.setState({ userAcknowledgedGasMissing: true });
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
      showLedgerSteps,
      supportsEIP1559,
      isMultiLayerFeeNetwork,
      nativeCurrency,
      showBuyModal,
      isBuyableChain,
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
          <div className="confirm-page-container-content__total-value">
            <LoadingHeartBeat estimateUsed={this.props.txData?.userFeeLevel} />
            <UserPreferencedCurrencyDisplay
              type={PRIMARY}
              key="total-detail-value"
              value={hexTransactionTotal}
              hideLabel={!useNativeCurrencyAsPrimaryCurrency}
            />
          </div>
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
          <div className="confirm-page-container-content__total-value">
            <LoadingHeartBeat estimateUsed={this.props.txData?.userFeeLevel} />
            <UserPreferencedCurrencyDisplay
              type={SECONDARY}
              key="total-detail-text"
              value={hexTransactionTotal}
              hideLabel={Boolean(useNativeCurrencyAsPrimaryCurrency)}
            />
          </div>
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
              min={0}
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

    const renderGasDetailsItem = () => {
      return this.supportsEIP1559V2 ? (
        <GasDetailsItem
          key="gas_details"
          userAcknowledgedGasMissing={userAcknowledgedGasMissing}
        />
      ) : (
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
          detailText={
            <div className="confirm-page-container-content__currency-container test">
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
                numberOfDecimals={6}
              />
            </div>
          }
          subText={
            <>
              <strong key="editGasSubTextFeeLabel">
                {t('editGasSubTextFeeLabel')}
              </strong>
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
              </div>
            </>
          }
          subTitle={
            <>
              {txData.dappSuggestedGasFees ? (
                <Typography
                  variant={TYPOGRAPHY.H7}
                  fontStyle={FONT_STYLE.ITALIC}
                  color={COLORS.TEXT_ALTERNATIVE}
                >
                  {t('transactionDetailDappGasMoreInfo')}
                </Typography>
              ) : (
                ''
              )}
              {supportsEIP1559 && (
                <GasTiming
                  maxPriorityFeePerGas={hexWEIToDecGWEI(
                    maxPriorityFeePerGas ||
                      txData.txParams.maxPriorityFeePerGas,
                  ).toString()}
                  maxFeePerGas={hexWEIToDecGWEI(
                    maxFeePerGas || txData.txParams.maxFeePerGas,
                  ).toString()}
                />
              )}
            </>
          }
        />
      );
    };

    const simulationFailureWarning = () => (
      <div className="confirm-page-container-content__error-container">
        <ActionableMessage
          message={t('simulationErrorMessageV2')}
          useIcon
          iconFillColor="var(--color-error-default)"
          type="danger"
          primaryActionV2={
            userAcknowledgedGasMissing === true
              ? undefined
              : {
                  label: t('proceedWithTransaction'),
                  onClick: () => this.setUserAcknowledgedGasMissing(),
                }
          }
        />
      </div>
    );

    return (
      <div className="confirm-page-container-content__details">
        <TransactionAlerts
          setUserAcknowledgedGasMissing={() =>
            this.setUserAcknowledgedGasMissing()
          }
          userAcknowledgedGasMissing={userAcknowledgedGasMissing}
          nativeCurrency={nativeCurrency}
          networkName={networkName}
          showBuyModal={showBuyModal}
          type={txData.type}
          isBuyableChain={isBuyableChain}
        />
        <TransactionDetail
          disabled={isDisabled()}
          userAcknowledgedGasMissing={userAcknowledgedGasMissing}
          onEdit={
            renderSimulationFailureWarning || isMultiLayerFeeNetwork
              ? null
              : () => this.handleEditGas()
          }
          rows={[
            renderSimulationFailureWarning &&
              !this.supportsEIP1559V2 &&
              simulationFailureWarning(),
            !renderSimulationFailureWarning &&
              !isMultiLayerFeeNetwork &&
              renderGasDetailsItem(),
            !renderSimulationFailureWarning && isMultiLayerFeeNetwork && (
              <MultiLayerFeeMessage
                transaction={txData}
                layer2fee={hexMinimumTransactionFee}
                nativeCurrency={nativeCurrency}
              />
            ),
            !isMultiLayerFeeNetwork && (
              <TransactionDetailItem
                key="total-item"
                detailTitle={t('total')}
                detailText={renderTotalDetailText()}
                detailTotal={renderTotalDetailTotal()}
                subTitle={t('transactionDetailGasTotalSubtitle')}
                subText={
                  <div className="confirm-page-container-content__total-amount">
                    <LoadingHeartBeat
                      estimateUsed={this.props.txData?.userFeeLevel}
                    />
                    <strong key="editGasSubTextAmountLabel">
                      {t('editGasSubTextAmountLabel')}
                    </strong>{' '}
                    {renderTotalMaxAmount()}
                  </div>
                }
              />
            ),
          ]}
        />
        {nonceField}
        {showLedgerSteps ? (
          <LedgerInstructionField
            showDataInstruction={Boolean(txData.txParams?.data)}
          />
        ) : null}
      </div>
    );
  }

  renderData(functionType) {
    const { t } = this.context;
    const {
      txData: { txParams } = {},
      methodData: { params } = {},
      hideData,
      dataComponent,
    } = this.props;

    if (hideData) {
      return null;
    }

    const functionParams = params?.length
      ? `(${params.map(({ type }) => type).join(', ')})`
      : '';

    return (
      dataComponent || (
        <div className="confirm-page-container-content__data">
          <div className="confirm-page-container-content__data-box-label">
            {`${t('functionType')}:`}
            <span className="confirm-page-container-content__function-type">
              {`${functionType} ${functionParams}`}
            </span>
          </div>
          <Disclosure>
            <TransactionDecoding to={txParams?.to} inputData={txParams?.data} />
          </Disclosure>
        </div>
      )
    );
  }

  renderDataHex(functionType) {
    const { t } = this.context;
    const {
      txData: { txParams } = {},
      methodData: { params } = {},
      hideData,
      dataHexComponent,
    } = this.props;

    if (hideData || !txParams.to) {
      return null;
    }

    const functionParams = params?.length
      ? `(${params.map(({ type }) => type).join(', ')})`
      : '';

    return (
      dataHexComponent || (
        <div className="confirm-page-container-content__data">
          <div className="confirm-page-container-content__data-box-label">
            {`${t('functionType')}:`}
            <span className="confirm-page-container-content__function-type">
              {`${functionType} ${functionParams}`}
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
            {`${t('hexData')}: ${toBuffer(txParams?.data).length} bytes`}
          </div>
          <div className="confirm-page-container-content__data-box">
            {txParams?.data}
          </div>
          <CopyRawData data={txParams?.data} />
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

    this.context.trackEvent({
      category: EVENT.CATEGORIES.TRANSACTIONS,
      event: 'Edit Transaction',
      properties: {
        action: 'Confirm Screen',
        legacy_event: true,
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
    const { title, hexTransactionAmount, txData } = this.props;

    // Title string passed in by props takes priority
    if (title) {
      return null;
    }

    const isContractInteraction =
      txData.type === TRANSACTION_TYPES.CONTRACT_INTERACTION;

    return (
      <UserPreferencedCurrencyDisplay
        value={hexTransactionAmount}
        type={PRIMARY}
        showEthLogo
        ethLogoHeight={24}
        hideLabel={!isContractInteraction}
        showCurrencySuffix={isContractInteraction}
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

  _beforeUnloadForGasPolling = () => {
    this._isMounted = false;
    if (this.state.pollingToken) {
      disconnectGasFeeEstimatePoller(this.state.pollingToken);
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
      txData: { origin } = {},
      getNextNonce,
      tryReverseResolveAddress,
    } = this.props;
    const { trackEvent } = this.context;
    trackEvent({
      category: EVENT.CATEGORIES.TRANSACTIONS,
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

  supportsEIP1559V2 =
    this.props.eip1559V2Enabled &&
    this.props.supportsEIP1559 &&
    !isLegacyTransaction(this.props.txData);

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
    } = this.props;
    const {
      submitting,
      submitError,
      submitWarning,
      ethGasPriceWarning,
      editingGas,
      userAcknowledgedGasMissing,
    } = this.state;

    const { name } = methodData;
    const { valid, errorKey } = this.getErrorKey();
    const hasSimulationError = Boolean(txData.simulationFails);
    const renderSimulationFailureWarning =
      hasSimulationError && !userAcknowledgedGasMissing;
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

    let functionType;
    if (
      txData.type === TRANSACTION_TYPES.CONTRACT_INTERACTION &&
      txData.origin !== 'metamask'
    ) {
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
          showEdit={Boolean(onEdit)}
          action={functionType}
          title={title}
          image={image}
          titleComponent={this.renderTitleComponent()}
          subtitleComponent={this.renderSubtitleComponent()}
          hideSubtitle={hideSubtitle}
          detailsComponent={this.renderDetails()}
          dataComponent={this.renderData(functionType)}
          dataHexComponent={this.renderDataHex(functionType)}
          contentComponent={contentComponent}
          nonce={customNonceValue || nonce}
          unapprovedTxCount={unapprovedTxCount}
          tokenAddress={tokenAddress}
          errorMessage={submitError}
          errorKey={errorKey}
          hasSimulationError={hasSimulationError}
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
          disabled={
            renderSimulationFailureWarning ||
            !valid ||
            submitting ||
            hardwareWalletRequiresConnection ||
            (gasIsLoading && !gasFeeIsCustom)
          }
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
          supportsEIP1559V2={this.supportsEIP1559V2}
          nativeCurrency={nativeCurrency}
        />
      </TransactionModalContextProvider>
    );
  }
}
