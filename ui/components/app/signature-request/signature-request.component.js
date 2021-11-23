import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import Identicon from '../../ui/identicon';
import LedgerInstructionField from '../ledger-instruction-field';
import Header from './signature-request-header';
import Footer from './signature-request-footer';
import Message from './signature-request-message';
import { TypedDataUtils } from 'eth-sig-util';
import { MESSAGE_TYPE } from '../../../../shared/constants/app';

export default class SignatureRequest extends PureComponent {
  static propTypes = {
    txData: PropTypes.object.isRequired,
    fromAccount: PropTypes.shape({
      address: PropTypes.string.isRequired,
      balance: PropTypes.string,
      name: PropTypes.string,
    }).isRequired,
    isLedgerWallet: PropTypes.bool,
    cancel: PropTypes.func.isRequired,
    sign: PropTypes.func.isRequired,
    hardwareWalletRequiresConnection: PropTypes.bool.isRequired,
  };

  static contextTypes = {
    t: PropTypes.func,
    metricsEvent: PropTypes.func,
  };

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
    } = this.props;
    const { address: fromAddress } = fromAccount;
    const { message, domain = {} } = JSON.parse(data);
    const { metricsEvent } = this.context;

    const mapType = (msgType, definedType, types) => {
      if (msgType === definedType.type) {
        // if the javascript type is the same as defined type, return the js type
        return msgType;
      } else if (types[definedType.type.replace("[]", "")] !== undefined) {
        // if the type is defined in types, return it
        return definedType.type;
      } else {
        // try and map it to a solidity type
        if (
          (
            definedType.type.indexOf("int") >= 0 ||
            definedType.type.indexOf("fixed") >= 0
          ) && msgType === "number") {
          return msgType;
        } else if (
          (
            definedType.type.indexOf("bytes") >= 0 ||
            definedType.type === "address"
          ) && msgType === "string") {
          return msgType;
        }
      }

      // if we get here we can't find or map the type....what should we do
      throw Error("Unknwn type found in message: " + definedType.type);
    }

    const sanitizeMessage = (msg, primaryType, types, sanitizedMessage = {}) => {
      const msgKeys = Object.keys(msg);
      const msgTypes = Object.values(msg).map(value => typeof (value));

      msgKeys.forEach((msgKey, index) => {
        const msgType = msgTypes[index];
        const definedType = primaryType.find(type => type.name === msgKey);
        if (msgType === "object") {
          const newPrimaryType = types[definedType.type];
          sanitizedMessage[msgKey] = {};
          sanitizeMessage(msg[msgKey], newPrimaryType, types, sanitizedMessage);
        } else if (msgType === "array") {
          const messages = sanitizedMessage[msgKey];
          messages.forEach(msg => {
            const type = typeof()
          })
          const newPrimaryType = mapType(msgType, definedType. types);
          sanitizedMessage[msgKey] = [];
          sanitizeMessage(msg[msgKey], newPrimaryType, types, sanitizedMessage);
        } else {
          const newPrimaryType = mapType(msgType, definedType. types);

        }
      });
    }

    const sanitizeData = (msg, msgType, msgVersion) => {
      if (
        msgType === MESSAGE_TYPE.ETH_SIGN_TYPED_DATA &&
        (msgVersion === 'V3' || msgVersion === 'V4')
      ) {
        const parsed = JSON.parse(data);
        parsed.message.uselessValue = 1;
        parsed.message.uselessName = "two";
        return TypedDataUtils.sanitizeData(parsed);
      }

      return msg;
    }

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

    return (
      <div className="signature-request page-container" >
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
          <div className="signature-request-content__info">{origin}</div>
          <div className="signature-request-content__info">
            {this.formatWallet(fromAddress)}
          </div>
        </div>
        {isLedgerWallet ? (
          <div className="confirm-approve-content__ledger-instruction-wrapper">
            <LedgerInstructionField showDataInstruction />
          </div>
        ) : null}
        <Message data={sanitizeMessage(message, type, version)} />
        <Footer
          cancelAction={onCancel}
          signAction={onSign}
          disabled={hardwareWalletRequiresConnection}
        />
      </div >
    );
  }
}
