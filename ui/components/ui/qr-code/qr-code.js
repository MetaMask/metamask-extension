import PropTypes from 'prop-types';
import React from 'react';
import qrCode from 'qrcode-generator';
import { connect } from 'react-redux';
import { isHexPrefixed } from 'ethereumjs-util';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { toChecksumHexAddress } from '../../../../shared/modules/hexstring-utils';
import Tooltip from '../tooltip';
import CopyIcon from '../icon/copy-icon.component';
import { useI18nContext } from '../../../hooks/useI18nContext';

export default connect(mapStateToProps)(QrCodeView);

function mapStateToProps(state) {
  const { buyView, warning } = state.appState;
  return {
    // Qr code is not fetched from state. 'message' and 'data' props are passed instead.
    buyView,
    warning,
  };
}

function QrCodeView(props) {
  const { Qr, warning } = props;
  const { message, data } = Qr;
  const address = `${
    isHexPrefixed(data) ? 'ethereum:' : ''
  }${toChecksumHexAddress(data)}`;
  const [copied, handleCopy] = useCopyToClipboard();
  const t = useI18nContext();
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
          __html: qrImage.createTableTag(4),
        }}
      />
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
          <div className="qr-code__copy-icon">
            <CopyIcon size={11} className="qr-code__copy-icon__svg" color="" />
          </div>
        </div>
      </Tooltip>
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
