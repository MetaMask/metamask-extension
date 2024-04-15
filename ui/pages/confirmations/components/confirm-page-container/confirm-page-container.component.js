import React, {
  useCallback,
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  useContext,
  ///: END:ONLY_INCLUDE_IF
  useEffect,
  useState,
} from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

import { TransactionType } from '@metamask/transaction-controller';
import { EditGasModes } from '../../../../../shared/constants/gas';
import { GasFeeContextProvider } from '../../../../contexts/gasFee';
import { TokenStandard } from '../../../../../shared/constants/transaction';
import { NETWORK_TO_NAME_MAP } from '../../../../../shared/constants/network';

import { PageContainerFooter } from '../../../../components/ui/page-container';
///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
import Button from '../../../../components/ui/button';
///: END:ONLY_INCLUDE_IF
import ActionableMessage from '../../../../components/ui/actionable-message/actionable-message';
import SenderToRecipient from '../../../../components/ui/sender-to-recipient';

import { fetchTokenBalance } from '../../../../../shared/lib/token-util';
import AdvancedGasFeePopover from '../advanced-gas-fee-popover';
import EditGasFeePopover from '../edit-gas-fee-popover/edit-gas-fee-popover';
import EditGasPopover from '../edit-gas-popover';
import ErrorMessage from '../../../../components/ui/error-message';
import { INSUFFICIENT_FUNDS_ERROR_KEY } from '../../../../helpers/constants/error-keys';
import { Text } from '../../../../components/component-library';
import {
  TextVariant,
  TextAlign,
} from '../../../../helpers/constants/design-system';

import NetworkAccountBalanceHeader from '../../../../components/app/network-account-balance-header/network-account-balance-header';
import SetApproveForAllWarning from '../set-approval-for-all-warning';
import { useI18nContext } from '../../../../hooks/useI18nContext';
///: BEGIN:ONLY_INCLUDE_IF(snaps)
import useTransactionInsights from '../../../../hooks/useTransactionInsights';
///: END:ONLY_INCLUDE_IF
///: BEGIN:ONLY_INCLUDE_IF(build-flask)
import InsightWarnings from '../../../../components/app/snaps/insight-warnings';
///: END:ONLY_INCLUDE_IF
import {
  getAccountName,
  getAddressBookEntry,
  getInternalAccounts,
  getIsBuyableChain,
  getMetadataContractName,
  getNetworkIdentifier,
  getSwapsDefaultToken,
} from '../../../../selectors';
import useRamps from '../../../../hooks/experiences/useRamps';
///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
///: END:ONLY_INCLUDE_IF

import { BlockaidResultType } from '../../../../../shared/constants/security-provider';
import {
  ConfirmPageContainerHeader,
  ConfirmPageContainerContent,
  ConfirmPageContainerNavigation,
} from '.';

const ConfirmPageContainer = (props) => {
  const {
    showEdit,
    onEdit,
    fromName,
    fromAddress,
    toEns,
    toNickname,
    toAddress,
    disabled,
    errorKey,
    errorMessage,
    contentComponent,
    action,
    title,
    image,
    titleComponent,
    subtitleComponent,
    detailsComponent,
    dataHexComponent,
    onCancelAll,
    onCancel,
    onSubmit,
    onSetApprovalForAll,
    showWarningModal,
    tokenAddress,
    nonce,
    unapprovedTxCount,
    warning,
    hideSenderToRecipient,
    showAccountInHeader,
    origin,
    ethGasPriceWarning,
    editingGas,
    handleCloseEditGas,
    currentTransaction,
    supportsEIP1559,
    nativeCurrency,
    txData,
    assetStandard,
    isApprovalOrRejection,
    displayAccountBalanceHeader,
    ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
    noteComponent,
    ///: END:ONLY_INCLUDE_IF
  } = props;

  const t = useI18nContext();
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  const trackEvent = useContext(MetaMetricsContext);
  ///: END:ONLY_INCLUDE_IF
  const [collectionBalance, setCollectionBalance] = useState('0');
  ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
  const [isShowingTxInsightWarnings, setIsShowingTxInsightWarnings] =
    useState(false);
  ///: END:ONLY_INCLUDE_IF
  const isBuyableChain = useSelector(getIsBuyableChain);
  const contact = useSelector((state) => getAddressBookEntry(state, toAddress));
  const networkIdentifier = useSelector(getNetworkIdentifier);
  const defaultToken = useSelector(getSwapsDefaultToken);
  const accountBalance = defaultToken.string;
  const internalAccounts = useSelector(getInternalAccounts);
  const ownedAccountName = getAccountName(internalAccounts, toAddress);
  const toName = ownedAccountName || contact?.name;
  const recipientIsOwnedAccount = Boolean(ownedAccountName);
  const toMetadataName = useSelector((state) =>
    getMetadataContractName(state, toAddress),
  );

  // TODO: Move useRamps hook to the confirm-transaction-base parent component.
  // TODO: openBuyCryptoInPdapp should be passed to this component as a custom prop.
  // We try to keep this component for layout purpose only, we need to move this hook to the confirm-transaction-base parent
  // component once it is converted to a functional component
  const { openBuyCryptoInPdapp } = useRamps();

  const isSetApproveForAll =
    currentTransaction.type === TransactionType.tokenMethodSetApprovalForAll;

  const shouldDisplayWarning =
    contentComponent && disabled && (errorKey || errorMessage);

  const networkName =
    NETWORK_TO_NAME_MAP[currentTransaction.chainId] || networkIdentifier;

  const fetchCollectionBalance = useCallback(async () => {
    const tokenBalance = await fetchTokenBalance(
      tokenAddress,
      fromAddress,
      global.ethereumProvider,
    );
    setCollectionBalance(tokenBalance.toString() || '0');
  }, [fromAddress, tokenAddress]);

  ///: BEGIN:ONLY_INCLUDE_IF(snaps)
  // As confirm-transction-base is converted to functional component
  // this code can bemoved to it.
  const insightObject = useTransactionInsights({ txData });
  const insightComponent = insightObject?.insightComponent;
  ///: END:ONLY_INCLUDE_IF

  const handleSubmit = () => {
    if (isSetApproveForAll && isApprovalOrRejection) {
      return onSetApprovalForAll();
    }
    return onSubmit();
  };

  // TODO: Better name
  const topLevelHandleSubmit = () => {
    ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
    if (insightObject?.warnings?.length > 0) {
      return setIsShowingTxInsightWarnings(true);
    }
    ///: END:ONLY_INCLUDE_IF
    return handleSubmit();
  };

  useEffect(() => {
    if (isSetApproveForAll && assetStandard === TokenStandard.ERC721) {
      fetchCollectionBalance();
    }
  }, [
    currentTransaction,
    assetStandard,
    isSetApproveForAll,
    fetchCollectionBalance,
    collectionBalance,
  ]);

  const isMaliciousRequest =
    txData.securityAlertResponse?.result_type === BlockaidResultType.Malicious;

  return (
    <GasFeeContextProvider transaction={currentTransaction}>
      <div className="page-container" data-testid="page-container">
        <ConfirmPageContainerNavigation />
        {displayAccountBalanceHeader ? (
          <NetworkAccountBalanceHeader
            accountName={fromName}
            accountBalance={accountBalance}
            tokenName={nativeCurrency}
            accountAddress={fromAddress}
            networkName={networkName}
            chainId={currentTransaction.chainId}
          />
        ) : (
          <ConfirmPageContainerHeader
            showEdit={showEdit}
            onEdit={() => onEdit()}
            showAccountInHeader={showAccountInHeader}
            accountAddress={fromAddress}
          >
            {hideSenderToRecipient ? null : (
              <SenderToRecipient
                senderName={fromName}
                senderAddress={fromAddress}
                recipientName={toName}
                recipientMetadataName={toMetadataName}
                recipientAddress={toAddress}
                recipientEns={toEns}
                recipientNickname={toNickname}
                recipientIsOwnedAccount={recipientIsOwnedAccount}
              />
            )}
          </ConfirmPageContainerHeader>
        )}
        {contentComponent || (
          <ConfirmPageContainerContent
            action={action}
            title={title}
            image={image}
            titleComponent={titleComponent}
            subtitleComponent={subtitleComponent}
            detailsComponent={detailsComponent}
            dataHexComponent={dataHexComponent}
            ///: BEGIN:ONLY_INCLUDE_IF(snaps)
            insightComponent={insightComponent}
            ///: END:ONLY_INCLUDE_IF
            errorMessage={errorMessage}
            errorKey={errorKey}
            tokenAddress={tokenAddress}
            nonce={nonce}
            warning={warning}
            onCancelAll={onCancelAll}
            onCancel={onCancel}
            cancelText={t('reject')}
            onSubmit={topLevelHandleSubmit}
            submitText={t('confirm')}
            disabled={disabled}
            unapprovedTxCount={unapprovedTxCount}
            rejectNText={t('rejectTxsN', [unapprovedTxCount])}
            origin={origin}
            ethGasPriceWarning={ethGasPriceWarning}
            supportsEIP1559={supportsEIP1559}
            currentTransaction={currentTransaction}
            nativeCurrency={nativeCurrency}
            networkName={networkName}
            toAddress={toAddress}
            transactionType={currentTransaction.type}
            isBuyableChain={isBuyableChain}
            openBuyCryptoInPdapp={openBuyCryptoInPdapp}
            txData={txData}
            ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
            noteComponent={noteComponent}
            ///: END:ONLY_INCLUDE_IF
          />
        )}
        {shouldDisplayWarning && errorKey === INSUFFICIENT_FUNDS_ERROR_KEY && (
          <div className="confirm-approve-content__warning">
            <ActionableMessage
              message={
                isBuyableChain ? (
                  <Text
                    variant={TextVariant.bodySm}
                    textAlign={TextAlign.Left}
                    as="h6"
                  >
                    {t('insufficientCurrencyBuyOrDeposit', [
                      nativeCurrency,
                      networkName,
                      ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
                      <Button
                        type="inline"
                        className="confirm-page-container-content__link"
                        onClick={() => {
                          openBuyCryptoInPdapp();
                          trackEvent({
                            event: MetaMetricsEventName.NavBuyButtonClicked,
                            category: MetaMetricsEventCategory.Navigation,
                            properties: {
                              location: 'Transaction Confirmation',
                              text: 'Buy',
                            },
                          });
                        }}
                        key={`${nativeCurrency}-buy-button`}
                      >
                        {t('buyAsset', [nativeCurrency])}
                      </Button>,
                      ///: END:ONLY_INCLUDE_IF
                    ])}
                  </Text>
                ) : (
                  <Text
                    variant={TextVariant.bodySm}
                    textAlign={TextAlign.Left}
                    as="h6"
                  >
                    {t('insufficientCurrencyDeposit', [
                      nativeCurrency,
                      networkName,
                    ])}
                  </Text>
                )
              }
              useIcon
              iconFillColor="var(--color-error-default)"
              type="danger"
            />
          </div>
        )}
        {shouldDisplayWarning && errorKey !== INSUFFICIENT_FUNDS_ERROR_KEY && (
          <div className="confirm-approve-content__warning">
            <ErrorMessage errorKey={errorKey} />
          </div>
        )}
        {showWarningModal && (
          <SetApproveForAllWarning
            collectionName={title}
            senderAddress={fromAddress}
            name={fromName}
            isERC721={assetStandard === TokenStandard.ERC721}
            total={collectionBalance}
            onSubmit={onSubmit}
            onCancel={onCancel}
          />
        )}
        {contentComponent && (
          <PageContainerFooter
            onCancel={onCancel}
            cancelText={t('reject')}
            onSubmit={topLevelHandleSubmit}
            submitText={t('confirm')}
            submitButtonType={
              (isSetApproveForAll && isApprovalOrRejection) ||
              isMaliciousRequest
                ? 'danger-primary'
                : 'primary'
            }
            disabled={disabled}
          >
            {unapprovedTxCount > 1 && (
              <a onClick={onCancelAll}>
                {t('rejectTxsN', [unapprovedTxCount])}
              </a>
            )}
          </PageContainerFooter>
        )}
        {editingGas && !supportsEIP1559 && (
          <EditGasPopover
            mode={EditGasModes.modifyInPlace}
            onClose={handleCloseEditGas}
            transaction={currentTransaction}
          />
        )}
        {supportsEIP1559 && (
          <>
            <EditGasFeePopover />
            <AdvancedGasFeePopover />
          </>
        )}
        {
          ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
        }
        {isShowingTxInsightWarnings && (
          <InsightWarnings
            warnings={insightObject.warnings}
            origin={origin}
            onCancel={() => setIsShowingTxInsightWarnings(false)}
            onSubmit={() => {
              handleSubmit();
              setIsShowingTxInsightWarnings(false);
            }}
          />
        )}
        {
          ///: END:ONLY_INCLUDE_IF
        }
      </div>
    </GasFeeContextProvider>
  );
};

ConfirmPageContainer.propTypes = {
  // Header
  action: PropTypes.string,
  onEdit: PropTypes.func,
  showEdit: PropTypes.bool,
  subtitleComponent: PropTypes.node,
  title: PropTypes.string,
  image: PropTypes.string,
  titleComponent: PropTypes.node,
  hideSenderToRecipient: PropTypes.bool,
  showAccountInHeader: PropTypes.bool,
  assetStandard: PropTypes.string,
  // Sender to Recipient
  fromAddress: PropTypes.string,
  fromName: PropTypes.string,
  toAddress: PropTypes.string,
  toEns: PropTypes.string,
  toNickname: PropTypes.string,
  // Content
  contentComponent: PropTypes.node,
  errorKey: PropTypes.string,
  errorMessage: PropTypes.string,
  dataHexComponent: PropTypes.node,
  detailsComponent: PropTypes.node,
  txData: PropTypes.object,
  tokenAddress: PropTypes.string,
  nonce: PropTypes.string,
  warning: PropTypes.string,
  unapprovedTxCount: PropTypes.number,
  origin: PropTypes.string.isRequired,
  ethGasPriceWarning: PropTypes.string,
  // Footer
  onCancelAll: PropTypes.func,
  onCancel: PropTypes.func,
  onSubmit: PropTypes.func,
  onSetApprovalForAll: PropTypes.func,
  showWarningModal: PropTypes.bool,
  disabled: PropTypes.bool,
  editingGas: PropTypes.bool,
  handleCloseEditGas: PropTypes.func,
  // Gas Popover
  currentTransaction: PropTypes.object.isRequired,
  supportsEIP1559: PropTypes.bool,
  nativeCurrency: PropTypes.string,
  isApprovalOrRejection: PropTypes.bool,
  displayAccountBalanceHeader: PropTypes.bool,
  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  noteComponent: PropTypes.node,
  ///: END:ONLY_INCLUDE_IF
};

export default ConfirmPageContainer;
