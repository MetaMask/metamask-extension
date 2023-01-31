import React, { PureComponent } from 'react';
import { memoize } from 'lodash';
import PropTypes from 'prop-types';
import LedgerInstructionField from '../ledger-instruction-field';
import { sanitizeMessage, getURLHostName } from '../../../helpers/utils/util';
import { EVENT } from '../../../../shared/constants/metametrics';
import SiteOrigin from '../../ui/site-origin';
import Button from '../../ui/button';
import Typography from '../../ui/typography/typography';
import ContractDetailsModal from '../modals/contract-details-modal/contract-details-modal';
import {
  TYPOGRAPHY,
  FONT_WEIGHT,
  COLORS,
  TEXT_ALIGN,
} from '../../../helpers/constants/design-system';
import NetworkAccountBalanceHeader from '../network-account-balance-header';
import { NETWORK_TYPES } from '../../../../shared/constants/network';
import { Numeric } from '../../../../shared/modules/Numeric';
import { EtherDenomination } from '../../../../shared/constants/common';
import Footer from './signature-request-footer';
import Message from './signature-request-message';

export default class SignatureRequest extends PureComponent {
  static propTypes = {
    /**
     * The display content of transaction data
     */
    txData: PropTypes.object.isRequired,
    /**
     * The display content of sender account
     */
    fromAccount: PropTypes.shape({
      address: PropTypes.string.isRequired,
      balance: PropTypes.string,
      name: PropTypes.string,
    }).isRequired,
    /**
     * Check if the wallet is ledget wallet or not
     */
    isLedgerWallet: PropTypes.bool,
    /**
     * Handler for cancel button
     */
    cancel: PropTypes.func.isRequired,
    /**
     * Handler for sign button
     */
    sign: PropTypes.func.isRequired,
    /**
     * Whether the hardware wallet requires a connection disables the sign button if true.
     */
    hardwareWalletRequiresConnection: PropTypes.bool.isRequired,
    /**
     * Current network chainId
     */
    chainId: PropTypes.string,
    /**
     * RPC prefs of the current network
     */
    rpcPrefs: PropTypes.object,
    /**
     * Dapp image
     */
    siteImage: PropTypes.string,
    conversionRate: PropTypes.number,
    nativeCurrency: PropTypes.string,
    provider: PropTypes.object,
    subjectMetadata: PropTypes.object,
  };

  static contextTypes = {
    t: PropTypes.func,
    trackEvent: PropTypes.func,
  };

  state = {
    hasScrolledMessage: false,
    showContractDetails: false,
  };

  setMessageRootRef(ref) {
    this.messageRootRef = ref;
  }

  formatWallet(wallet) {
    return `${wallet.slice(0, 8)}...${wallet.slice(
      wallet.length - 8,
      wallet.length,
    )}`;
  }

  getNetworkName() {
    const { provider } = this.props;
    const providerName = provider.type;
    const { t } = this.context;

    switch (providerName) {
      case NETWORK_TYPES.MAINNET:
        return t('mainnet');
      case NETWORK_TYPES.GOERLI:
        return t('goerli');
      case NETWORK_TYPES.SEPOLIA:
        return t('sepolia');
      case NETWORK_TYPES.LOCALHOST:
        return t('localhost');
      default:
        return provider.nickname || t('unknownNetwork');
    }
  }

  memoizedParseMessage = memoize((data) => {
    const { message, domain = {}, primaryType, types } = JSON.parse(data);
    const sanitizedMessage = sanitizeMessage(message, primaryType, types);
    return { sanitizedMessage, domain, primaryType };
  });

  render() {
    const {
      txData: {
        msgParams: { data, origin, version },
        type,
      },
      fromAccount: { address, balance, name },
      cancel,
      sign,
      isLedgerWallet,
      hardwareWalletRequiresConnection,
      chainId,
      rpcPrefs,
      siteImage,
      txData,
      subjectMetadata,
      conversionRate,
      nativeCurrency,
    } = this.props;
    const { trackEvent } = this.context;
    const {
      sanitizedMessage,
      domain: { verifyingContract },
      primaryType,
    } = this.memoizedParseMessage(data);
    const currentNetwork = this.getNetworkName();

    const balanceInBaseAsset = new Numeric(balance, 16, EtherDenomination.WEI)
      .toDenomination(EtherDenomination.ETH)
      .applyConversionRate(conversionRate)
      .round(6)
      .toBase(10)
      .toString();
    const onSign = (event) => {
      sign(event);
      trackEvent({
        category: EVENT.CATEGORIES.TRANSACTIONS,
        event: 'Confirm',
        properties: {
          action: 'Sign Request',
          legacy_event: true,
          type,
          version,
        },
      });
    };

    const onCancel = (event) => {
      cancel(event);
      trackEvent({
        category: EVENT.CATEGORIES.TRANSACTIONS,
        event: 'Cancel',
        properties: {
          action: 'Sign Request',
          legacy_event: true,
          type,
          version,
        },
      });
    };

    const messageIsScrollable =
      this.messageRootRef?.scrollHeight > this.messageRootRef?.clientHeight;

    const targetSubjectMetadata = txData.msgParams.origin
      ? subjectMetadata?.[txData.msgParams.origin]
      : null;

    return (
      <div className="signature-request">
        <div className="request-signature__account">
          <NetworkAccountBalanceHeader
            networkName={currentNetwork}
            accountName={name}
            accountBalance={balanceInBaseAsset}
            tokenName={nativeCurrency}
            accountAddress={address}
          />
        </div>
        <div className="signature-request-content">
          <div className="signature-request__origin">
            <SiteOrigin
              siteOrigin={origin}
              iconSrc={targetSubjectMetadata?.iconUrl}
              iconName={getURLHostName(origin) || origin}
              chip
            />
          </div>

          <Typography
            className="signature-request__content__title"
            variant={TYPOGRAPHY.H3}
            fontWeight={FONT_WEIGHT.BOLD}
            boxProps={{
              marginTop: 4,
            }}
          >
            {this.context.t('sigRequest')}
          </Typography>
          <Typography
            className="request-signature__content__subtitle"
            variant={TYPOGRAPHY.H7}
            color={COLORS.TEXT_ALTERNATIVE}
            align={TEXT_ALIGN.CENTER}
            margin={12}
            marginTop={3}
          >
            {this.context.t('signatureRequestGuidance')}
          </Typography>
          {verifyingContract ? (
            <div>
              <Button
                type="link"
                onClick={() => this.setState({ showContractDetails: true })}
                className="signature-request-content__verify-contract-details"
                data-testid="verify-contract-details"
              >
                <Typography
                  variant={TYPOGRAPHY.H7}
                  color={COLORS.PRIMARY_DEFAULT}
                >
                  {this.context.t('verifyContractDetails')}
                </Typography>
              </Button>
            </div>
          ) : null}
        </div>
        {isLedgerWallet ? (
          <div className="confirm-approve-content__ledger-instruction-wrapper">
            <LedgerInstructionField showDataInstruction />
          </div>
        ) : null}
        <Message
          data={sanitizedMessage}
          onMessageScrolled={() => this.setState({ hasScrolledMessage: true })}
          setMessageRootRef={this.setMessageRootRef.bind(this)}
          messageRootRef={this.messageRootRef}
          messageIsScrollable={messageIsScrollable}
          primaryType={primaryType}
        />
        <Footer
          cancelAction={onCancel}
          signAction={onSign}
          disabled={
            hardwareWalletRequiresConnection ||
            (messageIsScrollable && !this.state.hasScrolledMessage)
          }
        />
        {this.state.showContractDetails && (
          <ContractDetailsModal
            toAddress={verifyingContract}
            chainId={chainId}
            rpcPrefs={rpcPrefs}
            origin={origin}
            siteImage={siteImage}
            onClose={() => this.setState({ showContractDetails: false })}
            isContractRequestingSignature
          />
        )}
      </div>
    );
  }
}
