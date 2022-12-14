import React, { Component } from 'react';
import PropTypes from 'prop-types';
///: BEGIN:ONLY_INCLUDE_IN(flask)
import { stripHexPrefix } from 'ethereumjs-util';
///: END:ONLY_INCLUDE_IN
import ConfirmPageContainer from '../../components/app/confirm-page-container';
import TransactionDecoding from '../../components/app/transaction-decoding';
import { isBalanceSufficient } from '../send/send.utils';
import { addHexes } from '../../helpers/utils/conversions.util';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
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
import Typography from '../../components/ui/typography/typography';
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

import { MIN_GAS_LIMIT_DEC } from '../send/send.constants';

import { hexToDecimal } from '../../../shared/lib/metamask-controller-utils';
import { hexWEIToDecGWEI } from '../../../shared/lib/transactions-controller-utils';
///: BEGIN:ONLY_INCLUDE_IN(flask)
import { SnapInsight } from '../../components/app/confirm-page-container/flask/snap-insight';
import { DropdownTab, Tab } from '../../components/ui/tabs';
///: END:ONLY_INCLUDE_IN

import {
  NETWORK_TO_NAME_MAP,
  ///: BEGIN:ONLY_INCLUDE_IN(flask)
  CHAIN_ID_TO_NETWORK_ID_MAP,
  ///: END:ONLY_INCLUDE_IN
} from '../../../shared/constants/network';
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
    customGas: PropTypes.object,
    // Component props
    actionKey: PropTypes.string,
    contentComponent: PropTypes.node,
    dataComponent: PropTypes.node,
    dataHexComponent: PropTypes.node,
    hideData: PropTypes.bool,
    hideSubtitle: PropTypes.bool,
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
    isBuyableChain: PropTypes.bool,
    isApprovalOrRejection: PropTypes.bool,
    ///: BEGIN:ONLY_INCLUDE_IN(flask)
    insightSnaps: PropTypes.arrayOf(PropTypes.object),
    ///: END:ONLY_INCLUDE_IN
    assetStandard: PropTypes.string,
  };

  state = {
    submitting: false,
    submitError: null,
    submitWarning: '',
    ethGasPriceWarning: '',
    editingGas: false,
    userAcknowledgedGasMissing: false,
    showWarningModal: false,
    ///: BEGIN:ONLY_INCLUDE_IN(flask)
    selectedInsightSnapId: this.props.insightSnaps[0]?.id,
    ///: END:ONLY_INCLUDE_IN
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

  ///: BEGIN:ONLY_INCLUDE_IN(flask)
  handleSnapSelected(snapId) {
    this.setState({ selectedInsightSnapId: snapId });
  }
  ///: END:ONLY_INCLUDE_IN

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
      return this.supportsEIP1559 ? (
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
              !this.supportsEIP1559 &&
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

  ///: BEGIN:ONLY_INCLUDE_IN(flask)
  renderInsight() {
    const { txData, insightSnaps } = this.props;
    const { selectedInsightSnapId } = this.state;
    const { txParams, chainId, origin } = txData;

    const selectedSnap = insightSnaps.find(
      ({ id }) => id === selectedInsightSnapId,
    );

    const allowedTransactionTypes =
      txData.type === TRANSACTION_TYPES.CONTRACT_INTERACTION ||
      txData.type === TRANSACTION_TYPES.SIMPLE_SEND ||
      txData.type === TRANSACTION_TYPES.TOKEN_METHOD_SAFE_TRANSFER_FROM ||
      txData.type === TRANSACTION_TYPES.TOKEN_METHOD_TRANSFER_FROM ||
      txData.type === TRANSACTION_TYPES.TOKEN_METHOD_TRANSFER;

    const networkId = CHAIN_ID_TO_NETWORK_ID_MAP[chainId];
    const caip2ChainId = `eip155:${networkId ?? stripHexPrefix(chainId)}`;

    if (!allowedTransactionTypes || !insightSnaps.length) {
      return null;
    }

    const dropdownOptions = insightSnaps.map(
      ({ id, manifest: { proposedName } }) => ({
        value: id,
        name: proposedName,
      }),
    );

    return insightSnaps.length > 1 ? (
      <DropdownTab
        className="confirm-page-container-content__tab"
        options={dropdownOptions}
        selectedOption={selectedInsightSnapId}
        onChange={(snapId) => this.handleSnapSelected(snapId)}
      >
        <SnapInsight
          transaction={txParams}
          origin={origin}
          chainId={caip2ChainId}
          selectedSnap={selectedSnap}
        />
      </DropdownTab>
    ) : (
      <Tab
        className="confirm-page-container-content__tab"
        name={selectedSnap.manifest.proposedName}
      >
        <SnapInsight
          transaction={txParams}
          origin={origin}
          chainId={caip2ChainId}
          selectedSnap={selectedSnap}
        />
      </Tab>
    );
  }
  ///: END:ONLY_INCLUDE_IN

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
      customTokenAmount,
      dappProposedTokenAmount,
      currentTokenBalance,
      maxPriorityFeePerGas,
      baseFeePerGas,
      methodData,
    } = this.props;
    const { submitting } = this.state;
    const { name } = methodData;

    if (submitting) {
      return;
    }

    if (baseFeePerGas) {
      txData.estimatedBaseFee = baseFeePerGas;
    }

    if (name) {
      txData.contractMethodName = name;
    }

    if (dappProposedTokenAmount) {
      txData.dappProposedTokenAmount = dappProposedTokenAmount;
      txData.originalApprovalAmount = dappProposedTokenAmount;
    }

    if (customTokenAmount) {
      txData.customTokenAmount = customTokenAmount;
      txData.finalApprovalAmount = customTokenAmount;
    } else if (dappProposedTokenAmount !== undefined) {
      txData.finalApprovalAmount = dappProposedTokenAmount;
    }

    if (currentTokenBalance) {
      txData.currentTokenBalance = currentTokenBalance;
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

  handleSetApprovalForAll() {
    this.setState({ showWarningModal: true });
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
      isApprovalOrRejection,
      assetStandard,
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

    const isTokenApproval =
      txData.type === TRANSACTION_TYPES.TOKEN_METHOD_SET_APPROVAL_FOR_ALL ||
      txData.type === TRANSACTION_TYPES.TOKEN_METHOD_APPROVE;

    const isContractInteraction =
      txData.type === TRANSACTION_TYPES.CONTRACT_INTERACTION;

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
          title={title}
          image={image}
          titleComponent={this.renderTitleComponent()}
          subtitleComponent={this.renderSubtitleComponent()}
          hideSubtitle={hideSubtitle}
          detailsComponent={this.renderDetails()}
          dataComponent={this.renderData(functionType)}
          dataHexComponent={this.renderDataHex(functionType)}
          ///: BEGIN:ONLY_INCLUDE_IN(flask)
          insightComponent={this.renderInsight()}
          ///: END:ONLY_INCLUDE_IN
          contentComponent={contentComponent}
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
            (gasIsLoading && !gasFeeIsCustom)
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
        />
      </TransactionModalContextProvider>
    );
  }
}
