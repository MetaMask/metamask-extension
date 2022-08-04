import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import copyToClipboard from 'copy-to-clipboard';
import { getTokenTrackerLink, getAccountLink } from '@metamask/etherscan-link';
import UrlIcon from '../../../components/ui/url-icon';
import { addressSummary, getURLHostName } from '../../../helpers/utils/util';
import { formatCurrency } from '../../../helpers/utils/confirm-tx.util';
import { isBeta } from '../../../helpers/utils/build-types';
import { ellipsify } from '../../send/send.utils';
import Typography from '../../../components/ui/typography';
import Box from '../../../components/ui/box';
import Button from '../../../components/ui/button';
import EditGasFeeButton from '../../../components/app/edit-gas-fee-button';
import MetaFoxLogo from '../../../components/ui/metafox-logo';
import Identicon from '../../../components/ui/identicon';
import MultiLayerFeeMessage from '../../../components/app/multilayer-fee-message';
import CopyIcon from '../../../components/ui/icon/copy-icon.component';
import {
  TYPOGRAPHY,
  FONT_WEIGHT,
  BLOCK_SIZES,
  JUSTIFY_CONTENT,
  COLORS,
  DISPLAY,
} from '../../../helpers/constants/design-system';
import { SECOND } from '../../../../shared/constants/time';
import { ConfirmPageContainerWarning } from '../../../components/app/confirm-page-container/confirm-page-container-content';
import GasDetailsItem from '../../../components/app/gas-details-item';
import LedgerInstructionField from '../../../components/app/ledger-instruction-field';
import { ERC1155, ERC20, ERC721 } from '../../../helpers/constants/common';
import {
  MAINNET_CHAIN_ID,
  TEST_CHAINS,
} from '../../../../shared/constants/network';

export default class ConfirmApproveContent extends Component {
  static contextTypes = {
    t: PropTypes.func,
  };

  static propTypes = {
    decimals: PropTypes.number,
    tokenAmount: PropTypes.string,
    customTokenAmount: PropTypes.string,
    tokenSymbol: PropTypes.string,
    siteImage: PropTypes.string,
    showCustomizeGasModal: PropTypes.func,
    showEditApprovalPermissionModal: PropTypes.func,
    origin: PropTypes.string,
    setCustomAmount: PropTypes.func,
    tokenBalance: PropTypes.string,
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
    isMultiLayerFeeNetwork: PropTypes.bool,
    supportsEIP1559V2: PropTypes.bool,
    assetName: PropTypes.string,
    tokenId: PropTypes.string,
    assetStandard: PropTypes.string,
    isSetApproveForAll: PropTypes.bool,
    setApproveForAllArg: PropTypes.bool,
    userAddress: PropTypes.string,
  };

  state = {
    showFullTxDetails: true,
    copied: false,
  };

  renderApproveContentCard({
    showHeader = true,
    symbol,
    title,
    showEdit,
    showAdvanceGasFeeOptions = false,
    onEditClick,
    content,
    footer,
    noBorder,
  }) {
    const { supportsEIP1559V2 } = this.props;
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
            {supportsEIP1559V2 && title === t('transactionFee') ? null : (
              <>
                <div className="confirm-approve-content__card-header__symbol">
                  {symbol}
                </div>
                <div className="confirm-approve-content__card-header__title">
                  {title}
                </div>
              </>
            )}
            {showEdit && (!showAdvanceGasFeeOptions || !supportsEIP1559V2) && (
              <Box width={BLOCK_SIZES.ONE_SIXTH}>
                <Button
                  type="link"
                  className="confirm-approve-content__small-blue-text"
                  onClick={() => onEditClick()}
                >
                  {t('edit')}
                </Button>
              </Box>
            )}
            {showEdit && showAdvanceGasFeeOptions && supportsEIP1559V2 && (
              <EditGasFeeButton />
            )}
          </div>
        )}
        <div className="confirm-approve-content__card-content">{content}</div>
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
      txData,
      isMultiLayerFeeNetwork,
      supportsEIP1559V2,
    } = this.props;
    if (!isMultiLayerFeeNetwork && supportsEIP1559V2) {
      return <GasDetailsItem />;
    }
    return (
      <div className="confirm-approve-content__transaction-details-content">
        {isMultiLayerFeeNetwork ? (
          <div className="confirm-approve-content__transaction-details-extra-content">
            <div className="confirm-approve-content__transaction-details-content__labelled-fee">
              <span>{t('transactionDetailLayer2GasHeading')}</span>
              {`${ethTransactionTotal} ${nativeCurrency}`}
            </div>
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
                {formatCurrency(fiatTransactionTotal, currentCurrency)}
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
    const { origin, toAddress, isContract, isSetApproveForAll } = this.props;

    const titleTokenDescription = this.getTitleTokenDescription();

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
            {isSetApproveForAll
              ? t('allOfYour', [titleTokenDescription])
              : titleTokenDescription}
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
            <Button
              type="link"
              className="confirm-approve-content__copy-address"
              onClick={() => {
                this.setState({ copied: true });
                this.copyTimeout = setTimeout(
                  () => this.setState({ copied: false }),
                  SECOND * 3,
                );
                copyToClipboard(toAddress);
              }}
              title={
                this.state.copied
                  ? t('copiedExclamation')
                  : t('copyToClipboard')
              }
            >
              <CopyIcon size={14} color="var(--color-icon-default)" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  renderERC20PermissionContent() {
    const { t } = this.context;
    const {
      customTokenAmount,
      tokenAmount,
      tokenSymbol,
      origin,
      toAddress,
      isContract,
    } = this.props;

    const displayedAddress = isContract
      ? `${t('contract')} (${addressSummary(toAddress)})`
      : addressSummary(toAddress);
    return (
      <div className="flex-column">
        <div className="confirm-approve-content__small-text">
          {t('accessAndSpendNotice', [origin])}
        </div>
        <div className="flex-row">
          <div className="confirm-approve-content__label">
            {t('approvedAmountWithColon')}
          </div>
          <div className="confirm-approve-content__medium-text">
            {`${Number(customTokenAmount || tokenAmount)} ${tokenSymbol}`}
          </div>
        </div>
        <div className="flex-row">
          <div className="confirm-approve-content__label">
            {t('grantedToWithColon')}
          </div>
          <div className="confirm-approve-content__medium-text">
            {`${displayedAddress}`}
          </div>
          <div className="confirm-approve-content__medium-text">
            <Button
              type="link"
              className="confirm-approve-content__copy-address"
              onClick={() => {
                this.setState({ copied: true });
                this.copyTimeout = setTimeout(
                  () => this.setState({ copied: false }),
                  SECOND * 3,
                );
                copyToClipboard(toAddress);
              }}
              title={
                this.state.copied
                  ? t('copiedExclamation')
                  : t('copyToClipboard')
              }
            >
              <CopyIcon size={14} color="var(--color-icon-default)" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  renderDataContent() {
    const { t } = this.context;
    const { data, isSetApproveForAll, setApproveForAllArg } = this.props;
    return (
      <div className="flex-column">
        <div className="confirm-approve-content__small-text">
          {isSetApproveForAll
            ? t('functionSetApprovalForAll')
            : t('functionApprove')}
        </div>
        {isSetApproveForAll && setApproveForAllArg !== undefined ? (
          <div className="confirm-approve-content__small-text">
            {`${t('parameters')}: ${setApproveForAllArg}`}
          </div>
        ) : null}
        <div className="confirm-approve-content__small-text confirm-approve-content__data__data-block">
          {data}
        </div>
      </div>
    );
  }

  renderFullDetails() {
    const { t } = this.context;
    const {
      assetStandard,
      showEditApprovalPermissionModal,
      customTokenAmount,
      tokenAmount,
      decimals,
      origin,
      setCustomAmount,
      tokenSymbol,
      tokenBalance,
    } = this.props;
    if (assetStandard === ERC20) {
      return (
        <div className="confirm-approve-content__full-tx-content">
          <div className="confirm-approve-content__permission">
            {this.renderApproveContentCard({
              symbol: <i className="fa fa-user-check" />,
              title: t('permissionRequest'),
              content: this.renderERC20PermissionContent(),
              showEdit: true,
              onEditClick: () =>
                showEditApprovalPermissionModal({
                  customTokenAmount,
                  decimals,
                  origin,
                  setCustomAmount,
                  tokenAmount,
                  tokenSymbol,
                  tokenBalance,
                }),
            })}
          </div>
          <div className="confirm-approve-content__data">
            {this.renderApproveContentCard({
              symbol: <i className="fa fa-file" />,
              title: 'Data',
              content: this.renderDataContent(),
              noBorder: true,
            })}
          </div>
        </div>
      );
    } else if (assetStandard === ERC721 || assetStandard === ERC1155) {
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

  renderCustomNonceContent() {
    const { t } = this.context;
    const {
      useNonceField,
      customNonceValue,
      updateCustomNonce,
      getNextNonce,
      nextNonce,
      showCustomizeNonceModal,
    } = this.props;
    return (
      <>
        {useNonceField && (
          <div className="confirm-approve-content__custom-nonce-content">
            <Box
              className="confirm-approve-content__custom-nonce-header"
              justifyContent={JUSTIFY_CONTENT.FLEX_START}
            >
              <Typography
                variant={TYPOGRAPHY.H6}
                fontWeight={FONT_WEIGHT.NORMAL}
              >
                {t('nonce')}
              </Typography>
              <Button
                type="link"
                className="confirm-approve-content__custom-nonce-edit"
                onClick={() =>
                  showCustomizeNonceModal({
                    nextNonce,
                    customNonceValue,
                    updateCustomNonce,
                    getNextNonce,
                  })
                }
              >
                {t('edit')}
              </Button>
            </Box>
            <Typography
              className="confirm-approve-content__custom-nonce-value"
              variant={TYPOGRAPHY.H6}
              fontWeight={FONT_WEIGHT.BOLD}
            >
              {customNonceValue || nextNonce}
            </Typography>
          </div>
        )}
      </>
    );
  }

  getTitleTokenDescription() {
    const {
      tokenId,
      assetName,
      tokenAddress,
      rpcPrefs,
      chainId,
      assetStandard,
      tokenSymbol,
      isSetApproveForAll,
      userAddress,
    } = this.props;
    const { t } = this.context;
    const useBlockExplorer =
      rpcPrefs?.blockExplorerUrl ||
      [...TEST_CHAINS, MAINNET_CHAIN_ID].includes(chainId);

    let titleTokenDescription = t('token');
    const tokenIdWrapped = tokenId ? ` (#${tokenId})` : '';
    if (
      assetStandard === ERC20 ||
      (tokenSymbol && !tokenId && !isSetApproveForAll)
    ) {
      titleTokenDescription = tokenSymbol;
    } else if (
      assetStandard === ERC721 ||
      assetStandard === ERC1155 ||
      // if we don't have an asset standard but we do have either both an assetname and a tokenID or both a tokenSymbol and tokenId we assume its an NFT
      (assetName && tokenId) ||
      (tokenSymbol && tokenId)
    ) {
      if (assetName || tokenSymbol) {
        titleTokenDescription = `${assetName ?? tokenSymbol}`;
      } else {
        titleTokenDescription = t('nft');
      }

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
    }

    return (
      <>
        <span
          className="confirm-approve-content__approval-asset-title"
          onClick={() => {
            copyToClipboard(tokenAddress);
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
    const { isSetApproveForAll, setApproveForAllArg } = this.props;
    const titleTokenDescription = this.getTitleTokenDescription();

    let title;

    if (isSetApproveForAll) {
      title = t('approveAllTokensTitle', [titleTokenDescription]);
      if (setApproveForAllArg === false) {
        title = t('revokeAllTokensTitle', [titleTokenDescription]);
      }
    }
    return title || t('allowSpendToken', [titleTokenDescription]);
  }

  renderDescription() {
    const { t } = this.context;
    const { isContract, isSetApproveForAll, setApproveForAllArg } = this.props;
    const grantee = isContract
      ? t('contract').toLowerCase()
      : t('account').toLowerCase();

    let description = t('trustSiteApprovePermission', [grantee]);

    if (isSetApproveForAll && setApproveForAllArg === false) {
      description = t('revokeApproveForAllDescription', [
        grantee,
        this.getTitleTokenDescription(),
      ]);
    }

    return description;
  }

  render() {
    const { t } = this.context;
    const {
      decimals,
      siteImage,
      tokenAmount,
      customTokenAmount,
      origin,
      tokenSymbol,
      showCustomizeGasModal,
      showEditApprovalPermissionModal,
      setCustomAmount,
      tokenBalance,
      useNonceField,
      warning,
      txData,
      fromAddressIsLedger,
      toAddress,
      chainId,
      rpcPrefs,
      isContract,
      assetStandard,
      userAddress,
    } = this.props;
    const { showFullTxDetails } = this.state;

    return (
      <div
        className={classnames('confirm-approve-content', {
          'confirm-approve-content--full': showFullTxDetails,
        })}
      >
        {warning && (
          <div className="confirm-approve-content__custom-nonce-warning">
            <ConfirmPageContainerWarning warning={warning} />
          </div>
        )}
        <Box
          display={DISPLAY.FLEX}
          className="confirm-approve-content__icon-display-content"
        >
          <Box className="confirm-approve-content__metafoxlogo">
            <MetaFoxLogo useDark={isBeta()} />
          </Box>
          <Box
            display={DISPLAY.FLEX}
            className="confirm-approve-content__siteinfo"
          >
            <UrlIcon
              className="confirm-approve-content__siteimage-identicon"
              fallbackClassName="confirm-approve-content__siteimage-identicon"
              name={getURLHostName(origin)}
              url={siteImage}
            />
            <Typography
              variant={TYPOGRAPHY.H6}
              fontWeight={FONT_WEIGHT.NORMAL}
              color={COLORS.TEXT_ALTERNATIVE}
              boxProps={{ marginLeft: 1, marginTop: 2 }}
            >
              {getURLHostName(origin)}
            </Typography>
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
        <Box className="confirm-approve-content__address-display-content">
          <Box display={DISPLAY.FLEX}>
            <Identicon
              className="confirm-approve-content__address-identicon"
              diameter={20}
              address={toAddress}
            />
            <Typography
              variant={TYPOGRAPHY.H6}
              fontWeight={FONT_WEIGHT.NORMAL}
              color={COLORS.TEXT_ALTERNATIVE}
              boxProps={{ marginBottom: 0 }}
            >
              {ellipsify(toAddress)}
            </Typography>
            <Button
              type="link"
              className="confirm-approve-content__copy-address"
              onClick={() => {
                this.setState({ copied: true });
                this.copyTimeout = setTimeout(
                  () => this.setState({ copied: false }),
                  SECOND * 3,
                );
                copyToClipboard(toAddress);
              }}
              title={
                this.state.copied
                  ? t('copiedExclamation')
                  : t('copyToClipboard')
              }
            >
              <CopyIcon size={9} color="var(--color-icon-default)" />
            </Button>
            <Button
              type="link"
              className="confirm-approve-content__etherscan-link"
              onClick={() => {
                const blockExplorerTokenLink = isContract
                  ? getTokenTrackerLink(toAddress, chainId, null, userAddress, {
                      blockExplorerUrl: rpcPrefs?.blockExplorerUrl ?? null,
                    })
                  : getAccountLink(
                      toAddress,
                      chainId,
                      {
                        blockExplorerUrl: rpcPrefs?.blockExplorerUrl ?? null,
                      },
                      null,
                    );
                global.platform.openTab({
                  url: blockExplorerTokenLink,
                });
              }}
              target="_blank"
              rel="noopener noreferrer"
              title={t('etherscanView')}
            >
              <i
                className="fa fa-share-square fa-sm"
                style={{ color: 'var(--color-icon-default)', fontSize: 11 }}
                title={t('etherscanView')}
              />
            </Button>
          </Box>
        </Box>
        {assetStandard === ERC20 ? (
          <div className="confirm-approve-content__edit-submission-button-container">
            <div
              className="confirm-approve-content__medium-link-text cursor-pointer"
              onClick={() =>
                showEditApprovalPermissionModal({
                  customTokenAmount,
                  decimals,
                  origin,
                  setCustomAmount,
                  tokenAmount,
                  tokenSymbol,
                  tokenBalance,
                })
              }
            >
              {t('editPermission')}
            </div>
          </div>
        ) : null}
        <div className="confirm-approve-content__card-wrapper">
          {this.renderApproveContentCard({
            symbol: <i className="fa fa-tag" />,
            title: t('transactionFee'),
            showEdit: true,
            showAdvanceGasFeeOptions: true,
            onEditClick: showCustomizeGasModal,
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
              content: this.renderCustomNonceContent(),
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
