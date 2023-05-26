import PropTypes from 'prop-types';
import React, { useContext } from 'react';
import qrCode from 'qrcode-generator';
import { connect } from 'react-redux';
import { isHexPrefixed } from 'ethereumjs-util';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { toChecksumHexAddress } from '../../../../shared/modules/hexstring-utils';
import Tooltip from '../tooltip';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { AddressCopyButton } from '../../multichain/address-copy-button';
import Box from '../box/box';
import { Icon, IconName, IconSize } from '../../component-library';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';

export default connect(mapStateToProps)(QrCodeView);

function mapStateToProps(state) {
  const { buyView, warning } = state.appState;
  return {
    // Qr code is not fetched from state. 'message' and 'data' props are passed instead.
    buyView,
    warning,
  };
}

function QrCodeView({ Qr, warning }) {
  const [copied, handleCopy] = useCopyToClipboard();
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);
  const { message, data } = Qr;
  const address = `${
    isHexPrefixed(data) ? 'ethereum:' : ''
  }${toChecksumHexAddress(data)}`;
  const qrImage = qrCode(4, 'M');
  qrImage.addData(address);
  qrImage.make();

  const header = message ? (
    <div className="qr-code__header">{message}</div>
  ) : null;

  return (
    <div className="qr-code">
      {Array.isArray(message) ? (
        <div className="qr-code__message-container">
          {message.map((msg, index) => (
            <div className="qr_code__message" key={index}>
              {msg}
            </div>
          ))}
        </div>
      ) : (
        header
      )}
      {warning ? <span className="qr-code__error">{warning}</span> : null}
      <div
        className="qr-code__wrapper"
        dangerouslySetInnerHTML={{
          __html: process.env.MULTICHAIN
            ? qrImage.createTableTag(5, 24)
            : qrImage.createTableTag(4),
        }}
      />
      {process.env.MULTICHAIN ? (
        <Box marginBottom={6}>
          <AddressCopyButton
            wrap
            address={toChecksumHexAddress(data)}
            onClick={() => {
              trackEvent({
                category: MetaMetricsEventCategory.Accounts,
                event: MetaMetricsEventName.PublicAddressCopied,
                properties: {
                  location: 'Account Details Modal',
                },
              });
            }}
          />
        </Box>
      ) : (
        <Tooltip
          wrapperClassName="qr-code__address-container__tooltip-wrapper"
          position="bottom"
          title={copied ? t('copiedExclamation') : t('copyToClipboard')}
        >
          <div
            className="qr-code__address-container"
            onClick={() => {
              handleCopy(toChecksumHexAddress(data));
            }}
          >
            <div className="qr-code__address">{toChecksumHexAddress(data)}</div>
            <Icon
              name={copied ? IconName.CopySuccess : IconName.Copy}
              size={IconSize.Sm}
              marginInlineStart={3}
            />
          </div>
        </Tooltip>
      )}
    </div>
  );
}

QrCodeView.propTypes = {
  warning: PropTypes.node,
  Qr: PropTypes.shape({
    message: PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.node),
      PropTypes.node,
    ]),
    data: PropTypes.string.isRequired,
  }).isRequired,
};
