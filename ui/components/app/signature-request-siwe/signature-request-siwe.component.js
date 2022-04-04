import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { stripHexPrefix } from 'ethereumjs-util';
import Identicon from '../../ui/identicon';
import LedgerInstructionField from '../ledger-instruction-field';
import AccountListItem from '../account-list-item';
import convertMsg from '../../../helpers/utils/format-message-params';
import ErrorMessage from '../../ui/error-message';
import MetaFoxLogo from '../../ui/metafox-logo';
import Typography from '../../ui/typography';

import Box from '../../ui/box';
import UrlIcon from '../../ui/url-icon';
import { getURLHostName } from '../../../helpers/utils/util';
import { isBeta } from '../../../helpers/utils/build-types';
import {
  TYPOGRAPHY,
  FONT_WEIGHT,
  BLOCK_SIZES,
  JUSTIFY_CONTENT,
  COLORS,
  DISPLAY,
} from '../../../helpers/constants/design-system';

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
  };

  static contextTypes = {
    t: PropTypes.func,
    trackEvent: PropTypes.func,
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

  msgHexToText = (hex) => {
    try {
      const stripped = stripHexPrefix(hex);
      const buff = Buffer.from(stripped, 'hex');
      return buff.length === 32 ? hex : buff.toString('utf8');
    } catch (e) {
      return hex;
    }
  };

  renderHeader = (domain) => {
    const { fromAccount } = this.props;
    return (
      <div className="siwe-request-header">
        <div className="siwe-request-header--domain">
          <div className="request-signature__overview__item">
            {domain}
            {/* <Box
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
                  name={getURLHostName(domain)}
                  // url={siteImage}
                />
                <Typography
                  variant={TYPOGRAPHY.H6}
                  fontWeight={FONT_WEIGHT.NORMAL}
                  color={COLORS.TEXT_ALTERNATIVE}
                  boxProps={{ marginLeft: 1, marginTop: 2 }}
                >
                  {getURLHostName(domain)}
                </Typography>
              </Box>
            </Box> */}
          </div>
        </div>
        <div className="title">{this.context.t('SIWESiteRequestTitle')}</div>
        <div className="subtitle">
          {this.context.t('SIWESiteRequestSubtitle')}
        </div>
        <div className="siwe-request-header--account">
          {fromAccount && <AccountListItem account={fromAccount} />}
        </div>
      </div>
    );
    // header

    // domain
    // Sign-in request
    // This site is requesting to sign in with
    // AccountComponent
  };

  render() {
    const {
      txData: {
        msgParams: {
          version,
          siwe: { isSIWEDomainValid, messageData },
        },
        type,
      },
      cancel,
      sign,
      hardwareWalletRequiresConnection,
    } = this.props;

    // const { message, domain = {}, primaryType, types } = JSON.parse(data);
    const { trackEvent } = this.context;

    const onSign = (event) => {
      sign(event);
      trackEvent({
        category: 'Transactions',
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
        category: 'Transactions',
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
        {/* <Header fromAccount={fromAccount} /> */}
        {this.renderHeader(messageData.domain)}
        <Message
          data={convertMsg(messageData)}
          onMessageScrolled={() => this.setState({ hasScrolledMessage: true })}
          setMessageRootRef={this.setMessageRootRef.bind(this)}
          messageRootRef={this.messageRootRef}
          messageIsScrollable={messageIsScrollable}
        />
        {!isSIWEDomainValid && (
          <div className="domain-mismatch-warning">
            <ErrorMessage errorKey="SIWEDomainInvalid" />
          </div>
        )}
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
