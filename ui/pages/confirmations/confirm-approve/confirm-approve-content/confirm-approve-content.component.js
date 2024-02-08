import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import copyToClipboard from 'copy-to-clipboard';
import { getTokenTrackerLink } from '@metamask/etherscan-link';
import UrlIcon from '../../../../components/ui/url-icon';
import { addressSummary } from '../../../../helpers/utils/util';
import { formatCurrency } from '../../../../helpers/utils/confirm-tx.util';
import Button from '../../../../components/ui/button';
import SimulationErrorMessage from '../../components/simulation-error-message';
import MultiLayerFeeMessage from '../../components/multilayer-fee-message';
import SecurityProviderBannerMessage from '../../components/security-provider-banner-message/security-provider-banner-message';
import {
  DISPLAY,
  TextColor,
  IconColor,
  TextVariant,
  AlignItems,
} from '../../../../helpers/constants/design-system';
import { ConfirmPageContainerWarning } from '../../components/confirm-page-container/confirm-page-container-content';
import LedgerInstructionField from '../../components/ledger-instruction-field';
///: BEGIN:ONLY_INCLUDE_IF(blockaid)
import BlockaidBannerAlert from '../../components/security-provider-banner-alert/blockaid-banner-alert/blockaid-banner-alert';
///: END:ONLY_INCLUDE_IF
import { isSuspiciousResponse } from '../../../../../shared/modules/security-provider.utils';

import { TokenStandard } from '../../../../../shared/constants/transaction';
import {
  CHAIN_IDS,
  TEST_CHAINS,
} from '../../../../../shared/constants/network';
import ContractDetailsModal from '../../components/contract-details-modal/contract-details-modal';
import {
  ButtonIcon,
  Icon,
  IconName,
  Text,
  Box,
} from '../../../../components/component-library';
import TransactionDetailItem from '../../components/transaction-detail-item/transaction-detail-item.component';
import UserPreferencedCurrencyDisplay from '../../../../components/app/user-preferenced-currency-display';
import { PRIMARY, SECONDARY } from '../../../../helpers/constants/common';
import { ConfirmGasDisplay } from '../../components/confirm-gas-display';
import CustomNonce from '../../components/custom-nonce';
import { COPY_OPTIONS } from '../../../../../shared/constants/copy';
import FeeDetailsComponent from '../../components/fee-details-component/fee-details-component';

export default class ConfirmApproveContent extends Component {
  static contextTypes = {
    t: PropTypes.func,
    ///: BEGIN:ONLY_INCLUDE_IF(blockaid)
    trackEvent: PropTypes.func,
    ///: END:ONLY_INCLUDE_IF
  };

  static propTypes = {
    tokenSymbol: PropTypes.string,
    siteImage: PropTypes.string,
    origin: PropTypes.string,
    data: PropTypes.string,
    toAddress: PropTypes.string,
    currentCurrency: PropTypes.string,
    nativeCurrency: PropTypes.string,
    fiatTransactionTotal: PropTypes.string,
    ethTransactionTotal: PropTypes.string,
    useNonceField: PropTypes.bool,
    customNonceValue: PropTypes.string,
    updateCustomNonce: PropTypes.func,
    getNextNonce: PropTypes.func,
    nextNonce: PropTypes.number,
    showCustomizeNonceModal: PropTypes.func,
    warning: PropTypes.string,
    txData: PropTypes.object,
    fromAddressIsLedger: PropTypes.bool,
    chainId: PropTypes.string,
    tokenAddress: PropTypes.string,
    rpcPrefs: PropTypes.object,
    isContract: PropTypes.bool,
    hexTransactionTotal: PropTypes.string,
    hexMinimumTransactionFee: PropTypes.string,
    isMultiLayerFeeNetwork: PropTypes.bool,
    supportsEIP1559: PropTypes.bool,
    assetName: PropTypes.string,
    tokenId: PropTypes.string,
    assetStandard: PropTypes.string,
    isSetApproveForAll: PropTypes.bool,
    isApprovalOrRejection: PropTypes.bool,
    userAddress: PropTypes.string,
    userAcknowledgedGasMissing: PropTypes.bool,
    setUserAcknowledgedGasMissing: PropTypes.func,
    renderSimulationFailureWarning: PropTypes.bool,
    useCurrencyRateCheck: PropTypes.bool,
    useNativeCurrencyAsPrimaryCurrency: PropTypes.bool,
  };

  state = {
    showFullTxDetails: false,
    copied: false,
    setShowContractDetails: false,
  };

  renderApproveContentCard({
    showHeader = true,
    symbol,
    title,
    content,
    footer,
    noBorder,
    showFeeDetails = false,
  }) {
    const { supportsEIP1559, txData, useCurrencyRateCheck } = this.props;
    const { t } = this.context;
    return (
      <div
        className={classnames({
          'confirm-approve-content__card': !noBorder,
          'confirm-approve-content__card--no-border': noBorder,
        })}
      >
        {showHeader && (
          <div className="confirm-approve-content__card-header">
            {supportsEIP1559 && title === t('transactionFee') ? null : (
              <>
                <div className="confirm-approve-content__card-header__symbol">
                  {symbol}
                </div>
                <div className="confirm-approve-content__card-header__title">
                  {title}
                </div>
              </>
            )}
          </div>
        )}
        <div className="confirm-approve-content__card-content">{content}</div>

        {showFeeDetails && (
          <Box marginBottom={4}>
            <FeeDetailsComponent
              txData={txData}
              useCurrencyRateCheck={useCurrencyRateCheck}
            />
          </Box>
        )}

        {footer}
      </div>
    );
  }

  // TODO: Add "Learn Why" with link to the feeAssociatedRequest text
  renderTransactionDetailsContent() {
    const { t } = this.context;
    const {
      currentCurrency,
      nativeCurrency,
      ethTransactionTotal,
      fiatTransactionTotal,
      hexTransactionTotal,
      hexMinimumTransactionFee,
      txData,
      isMultiLayerFeeNetwork,
      supportsEIP1559,
      userAcknowledgedGasMissing,
      renderSimulationFailureWarning,
      useCurrencyRateCheck,
      useNativeCurrencyAsPrimaryCurrency,
    } = this.props;
    if (
      !isMultiLayerFeeNetwork &&
      supportsEIP1559 &&
      !renderSimulationFailureWarning
    ) {
      return (
        <ConfirmGasDisplay
          userAcknowledgedGasMissing={userAcknowledgedGasMissing}
        />
      );
    }
    return (
      <div className="confirm-approve-content__transaction-details-content">
        {isMultiLayerFeeNetwork ? (
          <div className="confirm-approve-content__transaction-details-extra-content">
            <TransactionDetailItem
              key="confirm-approve-content-min-tx-fee"
              detailTitle={t('transactionDetailLayer2GasHeading')}
              detailTotal={
                <UserPreferencedCurrencyDisplay
                  type={PRIMARY}
                  value={hexMinimumTransactionFee}
                  hideLabel={!useNativeCurrencyAsPrimaryCurrency}
                  numberOfDecimals={18}
                />
              }
              detailText={
                <UserPreferencedCurrencyDisplay
                  type={SECONDARY}
                  value={hexMinimumTransactionFee}
                  hideLabel={Boolean(useNativeCurrencyAsPrimaryCurrency)}
                />
              }
              noBold
              flexWidthValues
            />
            <MultiLayerFeeMessage
              transaction={txData}
              layer2fee={hexTransactionTotal}
              nativeCurrency={nativeCurrency}
              plainStyle
            />
          </div>
        ) : (
          <>
            <div className="confirm-approve-content__small-text">
              {t('feeAssociatedRequest')}
            </div>
            <div className="confirm-approve-content__transaction-details-content__fee">
              <div className="confirm-approve-content__transaction-details-content__primary-fee">
                {useCurrencyRateCheck &&
                  formatCurrency(fiatTransactionTotal, currentCurrency)}
              </div>
              <div className="confirm-approve-content__transaction-details-content__secondary-fee">
                {`${ethTransactionTotal} ${nativeCurrency}`}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  renderERC721OrERC1155PermissionContent() {
    const { t } = this.context;
    const { origin, toAddress, isContract, isSetApproveForAll, tokenSymbol } =
      this.props;

    const titleTokenDescription = this.getTitleTokenDescription();
    const approvedAssetText = tokenSymbol
      ? t('allOfYour', [titleTokenDescription])
      : t('allYourNFTsOf', [titleTokenDescription]);

    const displayedAddress = isContract
      ? `${t('contract')} (${addressSummary(toAddress)})`
      : addressSummary(toAddress);
    return (
      <div className="flex-column">
        <div className="confirm-approve-content__small-text">
          {t('accessAndSpendNoticeNFT', [origin])}
        </div>
        <div className="flex-row">
          <div className="confirm-approve-content__label">
            {t('approvedAsset')}:
          </div>
          <div className="confirm-approve-content__medium-text">
            {isSetApproveForAll ? approvedAssetText : titleTokenDescription}
          </div>
        </div>
        <div className="flex-row">
          <div className="confirm-approve-content__label">
            {t('grantedToWithColon')}
          </div>
          <div className="confirm-approve-content__medium-text">
            {displayedAddress}
          </div>
          <div className="confirm-approve-content__medium-text">
            <ButtonIcon
              ariaLabel="copy"
              onClick={() => copyToClipboard(toAddress, COPY_OPTIONS)}
              color={IconColor.iconDefault}
              iconName={
                this.state.copied ? IconName.CopySuccess : IconName.Copy
              }
              title={
                this.state.copied
                  ? t('copiedExclamation')
                  : t('copyToClipboard')
              }
            />
          </div>
        </div>
      </div>
    );
  }

  renderDataContent() {
    const { t } = this.context;
    const { data, isSetApproveForAll, isApprovalOrRejection } = this.props;

    ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
    const { tokenAddress } = this.props;
    ///: END:ONLY_INCLUDE_IF

    return (
      <Box className="flex-column">
        <Text className="confirm-approve-content__small-text">
          {isSetApproveForAll
            ? t('functionSetApprovalForAll')
            : t('functionApprove')}
        </Text>
        {isSetApproveForAll && isApprovalOrRejection !== undefined ? (
          <>
            <Text className="confirm-approve-content__small-text">
              {`${t('parameters')}: ${isApprovalOrRejection}`}
            </Text>
            {
              ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
              <Text
                variant={TextVariant.bodySm}
                color={TextColor.textAlternative}
              >
                {`${t('tokenContractAddress')}: ${tokenAddress}`}
              </Text>
              ///: END:ONLY_INCLUDE_IF
            }
          </>
        ) : null}
        <Text className="confirm-approve-content__small-text confirm-approve-content__data__data-block">
          {data}
        </Text>
      </Box>
    );
  }

  renderFullDetails() {
    const { t } = this.context;
    const { assetStandard } = this.props;
    if (
      assetStandard === TokenStandard.ERC721 ||
      assetStandard === TokenStandard.ERC1155
    ) {
      return (
        <div className="confirm-approve-content__full-tx-content">
          <div className="confirm-approve-content__permission">
            {this.renderApproveContentCard({
              symbol: <i className="fas fa-user-check" />,
              title: t('permissionRequest'),
              content: this.renderERC721OrERC1155PermissionContent(),
              showEdit: false,
            })}
          </div>
          <div className="confirm-approve-content__data">
            {this.renderApproveContentCard({
              symbol: <i className="fa fa-file" />,
              title: t('data'),
              content: this.renderDataContent(),
              noBorder: true,
            })}
          </div>
        </div>
      );
    }
    return null;
  }

  getTokenName() {
    const { tokenId, assetName, assetStandard, tokenSymbol } = this.props;
    const { t } = this.context;

    let titleTokenDescription = t('token');
    if (
      assetStandard === TokenStandard.ERC721 ||
      assetStandard === TokenStandard.ERC1155 ||
      // if we don't have an asset standard but we do have either both an assetname and a tokenID or both a tokenSymbol and tokenId we assume its an NFT
      (assetName && tokenId) ||
      (tokenSymbol && tokenId)
    ) {
      if (assetName || tokenSymbol) {
        titleTokenDescription = `${assetName ?? tokenSymbol}`;
      } else {
        titleTokenDescription = t('thisCollection');
      }
    }

    return titleTokenDescription;
  }

  getTitleTokenDescription() {
    const { tokenId, tokenAddress, rpcPrefs, chainId, userAddress } =
      this.props;
    const useBlockExplorer =
      rpcPrefs?.blockExplorerUrl ||
      [...TEST_CHAINS, CHAIN_IDS.MAINNET, CHAIN_IDS.LINEA_MAINNET].includes(
        chainId,
      );

    const titleTokenDescription = this.getTokenName();
    const tokenIdWrapped = tokenId ? ` (#${tokenId})` : '';

    if (useBlockExplorer) {
      const blockExplorerLink = getTokenTrackerLink(
        tokenAddress,
        chainId,
        null,
        userAddress,
        {
          blockExplorerUrl: rpcPrefs?.blockExplorerUrl ?? null,
        },
      );
      const blockExplorerElement = (
        <>
          <a
            href={blockExplorerLink}
            target="_blank"
            rel="noopener noreferrer"
            title={tokenAddress}
            className="confirm-approve-content__approval-asset-link"
          >
            {titleTokenDescription}
          </a>
          {tokenIdWrapped && <span>{tokenIdWrapped}</span>}
        </>
      );
      return blockExplorerElement;
    }

    return (
      <>
        <span
          className="confirm-approve-content__approval-asset-title"
          onClick={() => {
            copyToClipboard(tokenAddress, COPY_OPTIONS);
          }}
          title={tokenAddress}
        >
          {titleTokenDescription}
        </span>
        {tokenIdWrapped && <span>{tokenIdWrapped}</span>}
      </>
    );
  }

  renderTitle() {
    const { t } = this.context;
    const {
      assetName,
      tokenId,
      tokenSymbol,
      assetStandard,
      isSetApproveForAll,
      isApprovalOrRejection,
    } = this.props;
    const titleTokenDescription = this.getTitleTokenDescription();

    let title;

    if (isSetApproveForAll) {
      if (tokenSymbol) {
        title = t('approveAllTokensTitle', [titleTokenDescription]);
        if (isApprovalOrRejection === false) {
          title = t('revokeAllTokensTitle', [titleTokenDescription]);
        }
      } else {
        title = t('approveAllTokensTitleWithoutSymbol', [
          titleTokenDescription,
        ]);
        if (isApprovalOrRejection === false) {
          title = t('revokeAllTokensTitleWithoutSymbol', [
            titleTokenDescription,
          ]);
        }
      }
    } else if (
      assetStandard === TokenStandard.ERC721 ||
      assetStandard === TokenStandard.ERC1155 ||
      // if we don't have an asset standard but we do have either both an assetname and a tokenID or both a tokenSymbol and tokenId we assume its an NFT
      (assetName && tokenId) ||
      (tokenSymbol && tokenId)
    ) {
      title = t('approveTokenTitle', [titleTokenDescription]);
    }
    return title || t('allowSpendToken', [titleTokenDescription]);
  }

  renderDescription() {
    const { t } = this.context;
    const {
      assetStandard,
      assetName,
      tokenId,
      tokenSymbol,
      isContract,
      isSetApproveForAll,
      isApprovalOrRejection,
    } = this.props;
    const grantee = isContract
      ? t('contract').toLowerCase()
      : t('account').toLowerCase();

    let description = t('trustSiteApprovePermission', [grantee]);

    if (isSetApproveForAll && isApprovalOrRejection === false) {
      if (tokenSymbol) {
        description = t('revokeApproveForAllDescription', [
          this.getTitleTokenDescription(),
        ]);
      } else {
        description = t('revokeApproveForAllDescriptionWithoutSymbol', [
          this.getTitleTokenDescription(),
        ]);
      }
    } else if (
      isSetApproveForAll ||
      assetStandard === TokenStandard.ERC721 ||
      assetStandard === TokenStandard.ERC1155 ||
      // if we don't have an asset standard but we do have either both an assetname and a tokenID or both a tokenSymbol and tokenId we assume its an NFT
      (assetName && tokenId) ||
      (tokenSymbol && tokenId)
    ) {
      if (tokenSymbol) {
        description = t('approveTokenDescription');
      } else {
        description = t('approveTokenDescriptionWithoutSymbol', [
          this.getTitleTokenDescription(),
        ]);
      }
    }
    return description;
  }

  render() {
    const { t } = this.context;
    const {
      siteImage,
      origin,
      tokenSymbol,
      useNonceField,
      warning,
      txData,
      fromAddressIsLedger,
      toAddress,
      chainId,
      rpcPrefs,
      assetStandard,
      tokenId,
      tokenAddress,
      assetName,
      userAcknowledgedGasMissing,
      setUserAcknowledgedGasMissing,
      renderSimulationFailureWarning,
      nextNonce,
      getNextNonce,
      customNonceValue,
      updateCustomNonce,
      showCustomizeNonceModal,
    } = this.props;
    const { showFullTxDetails, setShowContractDetails } = this.state;

    return (
      <div
        className={classnames('confirm-approve-content', {
          'confirm-approve-content--full': showFullTxDetails,
        })}
      >
        {
          ///: BEGIN:ONLY_INCLUDE_IF(blockaid)
          <BlockaidBannerAlert txData={txData} margin={4} />
          ///: END:ONLY_INCLUDE_IF
        }
        {isSuspiciousResponse(txData?.securityProviderResponse) && (
          <SecurityProviderBannerMessage
            securityProviderResponse={txData.securityProviderResponse}
          />
        )}
        {warning && (
          <div className="confirm-approve-content__custom-nonce-warning">
            <ConfirmPageContainerWarning warning={warning} />
          </div>
        )}
        <Box
          display={DISPLAY.FLEX}
          className="confirm-approve-content__icon-display-content"
        >
          <Box display={DISPLAY.FLEX} alignItems={AlignItems.center}>
            <UrlIcon
              className="confirm-approve-content__siteimage-identicon"
              fallbackClassName="confirm-approve-content__siteimage-identicon"
              name={origin}
              url={siteImage}
            />
            <Text
              variant={TextVariant.bodySm}
              as="h6"
              color={TextColor.textAlternative}
              marginLeft={1}
            >
              {origin}
            </Text>
          </Box>
        </Box>
        <div
          className="confirm-approve-content__title"
          data-testid="confirm-approve-title"
        >
          {this.renderTitle()}
        </div>
        <div className="confirm-approve-content__description">
          {this.renderDescription()}
        </div>
        <Box marginBottom={4} marginTop={2}>
          <Button
            type="link"
            className="confirm-approve-content__verify-contract-details"
            onClick={() => this.setState({ setShowContractDetails: true })}
          >
            {t('verifyContractDetails')}
          </Button>
          {setShowContractDetails && (
            <ContractDetailsModal
              onClose={() => this.setState({ setShowContractDetails: false })}
              tokenName={tokenSymbol}
              tokenAddress={tokenAddress}
              toAddress={toAddress}
              chainId={chainId}
              rpcPrefs={rpcPrefs}
              tokenId={tokenId}
              assetName={assetName}
              assetStandard={assetStandard}
            />
          )}
        </Box>
        <div className="confirm-approve-content__card-wrapper">
          {renderSimulationFailureWarning && (
            <Box
              paddingTop={0}
              paddingRight={6}
              paddingBottom={4}
              paddingLeft={6}
            >
              <SimulationErrorMessage
                userAcknowledgedGasMissing={userAcknowledgedGasMissing}
                setUserAcknowledgedGasMissing={() =>
                  setUserAcknowledgedGasMissing(true)
                }
              />
            </Box>
          )}
          {this.renderApproveContentCard({
            symbol: <Icon name={IconName.Tag} />,
            title: t('transactionFee'),
            showEdit: true,
            showAdvanceGasFeeOptions: true,
            showFeeDetails: true,
            content: this.renderTransactionDetailsContent(),
            noBorder: useNonceField || !showFullTxDetails,
            footer: !useNonceField && (
              <div
                className="confirm-approve-content__view-full-tx-button-wrapper"
                onClick={() =>
                  this.setState({
                    showFullTxDetails: !this.state.showFullTxDetails,
                  })
                }
              >
                <div className="confirm-approve-content__view-full-tx-button cursor-pointer">
                  <div className="confirm-approve-content__small-blue-text">
                    {this.state.showFullTxDetails
                      ? t('hideFullTransactionDetails')
                      : t('viewFullTransactionDetails')}
                  </div>
                  <i
                    className={classnames({
                      'fa fa-caret-up': showFullTxDetails,
                      'fa fa-caret-down': !showFullTxDetails,
                    })}
                  />
                </div>
              </div>
            ),
          })}

          {useNonceField &&
            this.renderApproveContentCard({
              showHeader: false,
              content: (
                <CustomNonce
                  nextNonce={nextNonce}
                  customNonceValue={customNonceValue}
                  showCustomizeNonceModal={() => {
                    showCustomizeNonceModal({
                      nextNonce,
                      customNonceValue,
                      updateCustomNonce,
                      getNextNonce,
                    });
                  }}
                />
              ),
              useNonceField,
              noBorder: !showFullTxDetails,
              footer: (
                <div
                  className="confirm-approve-content__view-full-tx-button-wrapper"
                  onClick={() =>
                    this.setState({
                      showFullTxDetails: !this.state.showFullTxDetails,
                    })
                  }
                >
                  <div className="confirm-approve-content__view-full-tx-button cursor-pointer">
                    <div className="confirm-approve-content__small-blue-text">
                      {this.state.showFullTxDetails
                        ? t('hideFullTransactionDetails')
                        : t('viewFullTransactionDetails')}
                    </div>
                    <i
                      className={classnames({
                        'fa fa-caret-up': showFullTxDetails,
                        'fa fa-caret-down': !showFullTxDetails,
                      })}
                    />
                  </div>
                </div>
              ),
            })}
        </div>

        {fromAddressIsLedger ? (
          <div className="confirm-approve-content__ledger-instruction-wrapper">
            <LedgerInstructionField
              showDataInstruction={Boolean(txData.txParams?.data)}
            />
          </div>
        ) : null}

        {showFullTxDetails ? this.renderFullDetails() : null}
      </div>
    );
  }
}
