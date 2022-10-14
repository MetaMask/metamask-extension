import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import Identicon from '../../ui/identicon';
import LedgerInstructionField from '../ledger-instruction-field';
import { sanitizeMessage } from '../../../helpers/utils/util';
import { EVENT } from '../../../../shared/constants/metametrics';
import SiteOrigin from '../../ui/site-origin';
import Button from '../../ui/button';
import Typography from '../../ui/typography/typography';
import { COLORS, TYPOGRAPHY } from '../../../helpers/constants/design-system';
import ContractDetailsModal from '../modals/contract-details-modal/contract-details-modal';
import Message from './signature-request-message';
import Footer from './signature-request-footer';
import Header from './signature-request-header';

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

  render() {
    const {
      fromAccount,
      txData: {
        msgParams: { data, origin, version },
        type,
      },
      cancel,
      sign,
      isLedgerWallet,
      hardwareWalletRequiresConnection,
      chainId,
      rpcPrefs,
      siteImage,
    } = this.props;
    const { address: fromAddress } = fromAccount;
    const { message, domain = {}, primaryType, types } = JSON.parse(data);
    const { trackEvent } = this.context;

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

    return (
      <div className="signature-request page-container">
        <Header fromAccount={fromAccount} />
        <div className="signature-request-content">
          <div className="signature-request-content__title">
            {this.context.t('sigRequest')}
          </div>
          <div className="signature-request-content__identicon-container">
            <div className="signature-request-content__identicon-initial">
              {domain.name && domain.name[0]}
            </div>
            <div className="signature-request-content__identicon-border" />
            <Identicon address={fromAddress} diameter={70} />
          </div>
          <div className="signature-request-content__info--bolded">
            {domain.name}
          </div>
          <SiteOrigin
            className="signature-request-content__info"
            siteOrigin={origin}
          />
          <div>
            <Button
              type="link"
              onClick={() => this.setState({ showContractDetails: true })}
              className="signature-request-content__verify-contract-details"
            >
              <Typography
                variant={TYPOGRAPHY.H7}
                color={COLORS.PRIMARY_DEFAULT}
              >
                {this.context.t('verifyContractDetails')}
              </Typography>
            </Button>
          </div>
        </div>
        {isLedgerWallet ? (
          <div className="confirm-approve-content__ledger-instruction-wrapper">
            <LedgerInstructionField showDataInstruction />
          </div>
        ) : null}
        <Message
          data={sanitizeMessage(message, primaryType, types)}
          onMessageScrolled={() => this.setState({ hasScrolledMessage: true })}
          setMessageRootRef={this.setMessageRootRef.bind(this)}
          messageRootRef={this.messageRootRef}
          messageIsScrollable={messageIsScrollable}
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
            toAddress={domain.verifyingContract}
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
