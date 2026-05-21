import PropTypes from 'prop-types';
import React, { useContext } from 'react';
import qrCode from 'qrcode-generator';
import { isHexPrefixed } from 'ethereumjs-util';
import { Box, BoxAlignItems } from '@metamask/design-system-react';
import { normalizeSafeAddress } from '../../../../shared/lib/multichain/address';
import { Icon, IconName, IconSize, Text } from '../../component-library';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  IconColor,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';

const PREFIX_LEN = 6;
const SUFFIX_LEN = 5;
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
function QrCodeView({
  Qr,
  accountName,
  location = 'Account Details Modal',
}: {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Qr: { message?: string; data: string };
  accountName?: string;
  location?: string;
}) {
  const { trackEvent } = useContext(MetaMetricsContext);

  // useCopyToClipboard analysis: As of writing this, this is only used for public addresses
  const [copied, handleCopy] = useCopyToClipboard({ clearDelayMs: null });
  const t = useI18nContext();
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
  const addressStart = data.substring(0, PREFIX_LEN);
  const addressMiddle: string = data.substring(
    PREFIX_LEN,
    data.length - SUFFIX_LEN,
  );
  const addressEnd: string = data.substring(data.length - SUFFIX_LEN);
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
      <Box className="qr-code__wrapper" marginBottom={4}>
        <Box
          data-testid="qr-code-image"
          className="qr-code__image"
          dangerouslySetInnerHTML={{
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
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
      <Text
        variant={TextVariant.bodyMd}
        className="qr-code__address-segments"
        marginBottom={4}
      >
        {addressStart}
        <Text
          variant={TextVariant.bodyMd}
          color={TextColor.textMuted}
          className="qr-code__address-inner-segment"
        >
          {addressMiddle}
        </Text>
        {addressEnd}
      </Text>
      <Box
        marginBottom={4}
        gap={2}
        alignItems={BoxAlignItems.Center}
        color={TextColor.primaryDefault}
        className="flex qr-code__copy-button"
        data-testid="address-copy-button-text"
        data-clipboard-text={checksummedAddress}
        onClick={() => {
          handleCopy(checksummedAddress);
          trackEvent({
            category: MetaMetricsEventCategory.Accounts,
            event: MetaMetricsEventName.PublicAddressCopied,
            properties: {
              location,
            },
          });
        }}
      >
        <Icon
          name={copied ? IconName.CopySuccess : IconName.Copy}
          size={IconSize.Sm}
          color={IconColor.primaryDefault}
        />
        {t('copyAddressShort')}
      </Box>
    </div>
  );
}

QrCodeView.propTypes = {
  Qr: PropTypes.shape({
    message: PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.node),
      PropTypes.node,
    ]),
    data: PropTypes.string.isRequired,
  }).isRequired,
  location: PropTypes.string,
};

export default QrCodeView;
