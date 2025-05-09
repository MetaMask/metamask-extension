import PropTypes from 'prop-types';
import React from 'react';
import qrCode from 'qrcode-generator';
import { connect } from 'react-redux';
import { isHexPrefixed } from 'ethereumjs-util';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { normalizeSafeAddress } from '../../../../app/scripts/lib/multichain/address';
import { Box, Text } from '../../component-library';
import type { CombinedBackgroundAndReduxState } from '../../../store/store';
import {
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';

function mapStateToProps(state: CombinedBackgroundAndReduxState) {
  const { buyView, warning } = state.appState;
  return {
    buyView,
    warning,
  };
}

function QrCodeView({
  Qr,
  warning,
  accountName,
}: {
  Qr: { message: string; data: string };
  warning: null | string;
  accountName?: string;
}) {
  const { message, data } = Qr;
  const checksummedAddress = normalizeSafeAddress(data);
  const address = `${
    isHexPrefixed(data) ? 'ethereum:' : ''
  }${checksummedAddress}`;
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
            <Text
              key={index}
              variant={TextVariant.bodyXs}
              color={TextColor.warningDefault}
            >
              {msg}
            </Text>
          ))}
        </div>
      ) : (
        header
      )}
      {warning ? <span className="qr-code__error">{warning}</span> : null}
      <Box className="qr-code__wrapper" marginBottom={4}>
        <Box
          data-testid="qr-code-image"
          className="qr-code__image"
          dangerouslySetInnerHTML={{
            __html: qrImage.createTableTag(5, 16),
          }}
        />
        <Box className="qr-code__logo">
          <img src="images/logo/metamask-fox.svg" alt="Logo" />
        </Box>
      </Box>
      {accountName ? (
        <Text
          variant={TextVariant.bodyLgMedium}
          textAlign={TextAlign.Center}
          marginBottom={4}
        >
          {accountName}
        </Text>
      ) : null}
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

export default connect(mapStateToProps)(QrCodeView);
