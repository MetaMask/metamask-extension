import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import SiteIcon from '../../ui/site-icon';
import LedgerInstructionField from '../ledger-instruction-field';
import { getURLHostName, sanitizeMessage } from '../../../helpers/utils/util';
import Header from './signature-request-header';
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
    subjectMetadata: PropTypes.object,
  };

  static contextTypes = {
    t: PropTypes.func,
    metricsEvent: PropTypes.func,
  };

  state = {
    hasScrolledMessage: false,
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
      txData,
      cancel,
      sign,
      isLedgerWallet,
      hardwareWalletRequiresConnection,
      subjectMetadata,
    } = this.props;
    const {
      msgParams: { data, origin, version },
      type,
    } = txData;
    const { address: fromAddress } = fromAccount;
    const { message, domain = {}, primaryType, types } = JSON.parse(data);
    const { metricsEvent } = this.context;
    const targetSubjectMetadata = origin ? subjectMetadata?.[origin] : null;

    const onSign = (event) => {
      sign(event);
      metricsEvent({
        eventOpts: {
          category: 'Transactions',
          action: 'Sign Request',
          name: 'Confirm',
        },
        customVariables: {
          type,
          version,
        },
      });
    };

    const onCancel = (event) => {
      cancel(event);
      metricsEvent({
        eventOpts: {
          category: 'Transactions',
          action: 'Sign Request',
          name: 'Cancel',
        },
        customVariables: {
          type,
          version,
        },
      });
    };

    const messageIsScrollable =
      this.messageRootRef?.scrollHeight > this.messageRootRef?.clientHeight;
    const originHostNameCharacter = getURLHostName(origin)?.[0];

    return (
      <div className="signature-request page-container">
        <Header fromAccount={fromAccount} />
        <div className="signature-request-content">
          <div className="signature-request-content__title">
            {this.context.t('sigRequest')}
          </div>
          <div className="signature-request-content__identicon-container">
            <div className="signature-request-content__identicon-border">
              {targetSubjectMetadata?.iconUrl ? (
                <SiteIcon
                  icon={targetSubjectMetadata.iconUrl}
                  name={
                    getURLHostName(targetSubjectMetadata.origin) ||
                    targetSubjectMetadata.origin
                  }
                  size={32}
                />
              ) : (
                <div className="signature-request-content__identicon-initial">
                  {/* {domain.name && domain.name[0]} */}
                  {originHostNameCharacter}
                </div>
              )}
            </div>
          </div>
          <div className="signature-request-content__info--bolded">
            {origin}
          </div>
          {/* <div className="signature-request-content__info">{origin}</div> */}
          <div className="signature-request-content__info">
            {this.formatWallet(fromAddress)}
          </div>
        </div>
        {isLedgerWallet ? (
          <div className="confirm-approve-content__ledger-instruction-wrapper">
            <LedgerInstructionField showDataInstruction />
          </div>
        ) : null}
        <Message
          data={{ ...sanitizeMessage(message, primaryType, types), domain }}
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
      </div>
    );
  }
}
