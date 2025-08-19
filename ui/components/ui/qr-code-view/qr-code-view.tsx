import React, { useContext } from 'react';
import qrCode from 'qrcode-generator';
import { isHexPrefixed } from 'ethereumjs-util';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { normalizeSafeAddress } from '../../../../app/scripts/lib/multichain/address';
import {
  Box,
  IconName,
  Text,
  BoxAlignItems,
  TextAlign,
  TextColor,
  TextVariant,
  Button,
  ButtonVariant,
  FontWeight,
  BoxFlexDirection,
  BoxJustifyContent,
  twMerge,
} from '@metamask/design-system-react';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { MINUTE } from '../../../../shared/constants/time';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';

const PREFIX_LEN = 6;
const SUFFIX_LEN = 5;

export interface QrData {
  message?: string | string[];
  data: string;
}

export interface QrCodeViewProps {
  Qr: QrData;
  warning?: string | null;
  accountName?: string;
  location?: string;
  className?: string;
}

function QrCodeView({
  Qr,
  warning,
  accountName,
  location = 'Account Details Modal',
  className,
}: QrCodeViewProps) {
  const trackEvent = useContext(MetaMetricsContext);
  const [copied, handleCopy] = useCopyToClipboard(MINUTE);
  const t = useI18nContext();
  const { message, data } = Qr;
  const checksummedAddress = normalizeSafeAddress(data);
  const address = `${
    isHexPrefixed(data) ? 'ethereum:' : ''
  }${checksummedAddress}`;
  const qrImage = qrCode(4, 'M');
  qrImage.addData(address);
  qrImage.make();
  const header = message ? <Text>{message}</Text> : null;
  const addressStart = data.substring(0, PREFIX_LEN);
  const addressMiddle: string = data.substring(
    PREFIX_LEN,
    data.length - SUFFIX_LEN,
  );
  const addressEnd: string = data.substring(data.length - SUFFIX_LEN);
  return (
    <Box
      className={twMerge('flex gap-4', className)}
      flexDirection={BoxFlexDirection.Column}
      justifyContent={BoxJustifyContent.Center}
      alignItems={BoxAlignItems.Center}
    >
      {Array.isArray(message) ? (
        <>
          {message.map((msg, index) => (
            <Text key={index} variant={TextVariant.BodySm}>
              {msg}
            </Text>
          ))}
        </>
      ) : (
        header
      )}
      {warning ? (
        <Text asChild color={TextColor.ErrorDefault}>
          <span>{warning}</span>
        </Text>
      ) : null}
      <Box className="relative inline-block">
        <Box
          data-testid="qr-code-image"
          className="relative border border-default rounded-2xl"
          dangerouslySetInnerHTML={{
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            __html: qrImage.createTableTag(5, 16),
          }}
        />
        <Box className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 bg-white flex overflow-hidden justify-center items-center h-10 w-11">
          <img src="images/logo/metamask-fox.svg" alt="Logo" />
        </Box>
      </Box>
      {accountName ? (
        <Text
          variant={TextVariant.BodyLg}
          fontWeight={FontWeight.Medium}
          textAlign={TextAlign.Center}
        >
          {accountName}
        </Text>
      ) : null}
      <Text asChild className="break-all" textAlign={TextAlign.Center}>
        <span>
          {addressStart}
          <Text className="" color={TextColor.TextAlternative} asChild>
            <span>{addressMiddle}</span>
          </Text>
          {addressEnd}
        </span>
      </Text>
      <Button
        data-testid="address-copy-button-text"
        data-clipboard-text={checksummedAddress}
        variant={ButtonVariant.Tertiary}
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
        endIconName={copied ? IconName.CopySuccess : IconName.Copy}
      >
        {t('copyAddressShort')}
      </Button>
    </Box>
  );
}

export default QrCodeView;
