import React, { useContext, useState } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { debounce } from 'lodash';
import classnames from 'classnames';
import { I18nContext } from '../../../../contexts/i18n';
import { getMetaMaskIdentities, getAccountName } from '../../../../selectors';
import Address from '../../transaction-decoding/components/decoding/address';
import {
  isValidHexAddress,
  toChecksumHexAddress,
} from '../../../../../shared/modules/hexstring-utils';

export default function SignatureRequestMessage({
  data,
  onMessageScrolled,
  setMessageRootRef,
  messageRootRef,
  messageIsScrollable,
}) {
  const t = useContext(I18nContext);
  const [messageIsScrolled, setMessageIsScrolled] = useState(false);
  const identities = useSelector(getMetaMaskIdentities);
  const setMessageIsScrolledAtBottom = () => {
    if (!messageRootRef || messageIsScrolled) {
      return;
    }

    const { scrollTop, offsetHeight, scrollHeight } = messageRootRef;
    const isAtBottom = Math.round(scrollTop) + offsetHeight >= scrollHeight;

    if (isAtBottom) {
      setMessageIsScrolled(true);
      onMessageScrolled();
    }
  };

  const renderNode = (renderData) => {
    return (
      <div className="signature-request-message--node">
        {Object.entries(renderData).map(([label, value], i) => (
          <div
            className={classnames('signature-request-message--node', {
              'signature-request-message--node-leaf':
                typeof value !== 'object' || value === null,
            })}
            key={i}
          >
            <span
              className={classnames('signature-request-message--node-label', {
                'signature-request-message--node-label-bold':
                  typeof value === 'object',
              })}
            >
              {label.charAt(0).toUpperCase() + label.slice(1)}:{' '}
            </span>
            {typeof value === 'object' && value !== null ? (
              renderNode(value)
            ) : (
              <span className="signature-request-message--node-value">
                {isValidHexAddress(value, {
                  mixedCaseUseChecksum: true,
                }) ? (
                  <div className="signature-request-message--node-value__address">
                    <Address
                      addressOnly
                      checksummedRecipientAddress={toChecksumHexAddress(value)}
                      recipientName={getAccountName(identities, value)}
                    />
                  </div>
                ) : (
                  `${value}`
                )}
              </span>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderScrollButton = () => {
    return (
      <div
        onClick={() => {
          setMessageIsScrolled(true);
          onMessageScrolled();
          messageRootRef?.scrollTo(0, messageRootRef?.scrollHeight);
        }}
        className="signature-request-message__scroll-button"
        data-testid="signature-request-scroll-button"
      >
        <i className="fa fa-arrow-down" title={t('scrollDown')} />
      </div>
    );
  };

  return (
    <div
      onScroll={debounce(setMessageIsScrolledAtBottom, 25)}
      className="signature-request-message"
    >
      {messageIsScrollable ? renderScrollButton() : null}
      <div className="signature-request-message--root" ref={setMessageRootRef}>
        <div className="signature-request-message__title">
          {t('signatureRequest1')}
        </div>
        {renderNode(data)}
      </div>
    </div>
  );
}

SignatureRequestMessage.propTypes = {
  data: PropTypes.object.isRequired,
  onMessageScrolled: PropTypes.func,
  setMessageRootRef: PropTypes.func,
  messageRootRef: PropTypes.object,
  messageIsScrollable: PropTypes.bool,
};
