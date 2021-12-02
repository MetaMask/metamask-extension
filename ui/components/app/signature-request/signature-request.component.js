import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import Identicon from '../../ui/identicon';
import LedgerInstructionField from '../ledger-instruction-field';
import Header from './signature-request-header';
import Footer from './signature-request-footer';
import Message from './signature-request-message';

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
    const { message, domain = {}, types, primaryType } = JSON.parse(data);
    const { metricsEvent } = this.context;

    const solidityTypes = [
      'bool',
      'int',
      'fixed',
      'address',
      'bytes',
      'string',
    ];
    const sanitizeMessage = (msg, baseType) => {
      if (version === 'V4') {
        const sanitizedMessage = {};
        const msgKeys = Object.keys(msg);
        const baseTypeType = types[baseType];

        msgKeys.forEach((msgKey) => {
          if (baseTypeType) {
            const definedType = Object.values(baseTypeType).find(
              (ptt) => ptt.name === msgKey,
            );

            if (definedType) {
              // key has a type. check if the definedType is also a type
              const nestedTypeType = types[definedType.type.replace('[]', '')];
              if (nestedTypeType) {
                if (definedType.type.indexOf('[]') > 0) {
                  // nested array
                  const sanitizedArrayMessage = {};
                  const definedArrayType = definedType.type.replace('[]', '');
                  const arrayMsg = msg[msgKey];
                  arrayMsg.forEach((msgArray, arrIndex) => {
                    sanitizedArrayMessage[arrIndex] = sanitizeMessage(
                      msgArray,
                      definedArrayType,
                    );
                  });
                  sanitizedMessage[msgKey] = sanitizedArrayMessage;
                } else {
                  // nested object
                  sanitizedMessage[msgKey] = sanitizeMessage(
                    msg[msgKey],
                    definedType.type,
                  );
                }
              } else {
                // check if it's a valid solidity type
                const isSolidityType = solidityTypes.some(
                  (solidityType) => definedType.type.indexOf(solidityType) >= 0,
                );
                if (isSolidityType) {
                  sanitizedMessage[msgKey] = msg[msgKey];
                }
              } // endif (nestedType)
            } // endif (definedType)
          } // endif (baseTypeType)
        });
        return sanitizedMessage;
      } // end if (version === 'V4')

      return msg;
    };

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
        <Message data={sanitizeMessage(message, primaryType)} />
        <Footer
          cancelAction={onCancel}
          signAction={onSign}
          disabled={hardwareWalletRequiresConnection}
        />
      </div>
    );
  }
}
