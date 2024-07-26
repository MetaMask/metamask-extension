import PropTypes from 'prop-types';
import React, { useContext } from 'react';
import qrCode from 'qrcode-generator';
import { connect } from 'react-redux';
import { isHexPrefixed } from 'ethereumjs-util';
import { normalizeSafeAddress } from '../../../../app/scripts/lib/multichain/address';
import { AddressCopyButton } from '../../multichain';
import Box from '../box/box';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import type { CombinedBackgroundAndReduxState } from '../../../store/store';
import { Text } from '../../component-library';
import {
  TextVariant,
  TextColor,
} from '../../../helpers/constants/design-system';

export default connect(mapStateToProps)(QrCodeView);

function mapStateToProps(state: CombinedBackgroundAndReduxState) {
  const { buyView, warning } = state.appState;
  return {
    // Qr code is not fetched from state. 'message' and 'data' props are passed instead.
    buyView,
    warning,
  };
}

function QrCodeView({
  Qr,
  warning,
}: {
  Qr: { message: string; data: string };
  warning: null | string;
}) {
  const trackEvent = useContext(MetaMetricsContext);
  const { message, data } = Qr;
  const address = `${
    isHexPrefixed(data) ? 'ethereum:' : ''
  }${normalizeSafeAddress(data)}`;
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
      <div
        data-testid="qr-code-image"
        className="qr-code__wrapper"
        dangerouslySetInnerHTML={{
          __html: qrImage.createTableTag(5, 24),
        }}
      />
      <Box marginBottom={6}>
        <AddressCopyButton
          wrap
          address={data}
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
