import React, { useMemo } from 'react';
import {
  Box,
  Text,
  TextVariant,
  Button,
  ButtonSize,
  ButtonVariant,
} from '@metamask/design-system-react';
import qrCode from 'qrcode-generator';
import { ModalBody } from '../../component-library/modal-body/modal-body';

export type DeeplinkQRCodeProps = {
  title: string;
  description: string;
  data: string;
  onDone: () => void;
  doneLabel: string;
  testId: string;
};

export const QRCodeImage = ({ data }: { data: string }) => {
  const qrMarkup = useMemo(() => {
    const qrImage = qrCode(0, 'M');
    qrImage.addData(data);
    qrImage.make();
    return qrImage.createTableTag(5, 16);
  }, [data]);

  return (
    <Box className="qr-code__wrapper my-2">
      <Box
        data-testid="qr-code-image"
        className="qr-code__image"
        dangerouslySetInnerHTML={{
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          __html: qrMarkup,
        }}
      />
      <Box className="qr-code__logo">
        <img src="images/logo/metamask-fox.svg" alt="Logo" />
      </Box>
    </Box>
  );
};

export function DeeplinkQRCode({
  title,
  description,
  data,
  onDone,
  doneLabel,
  testId,
}: DeeplinkQRCodeProps) {
  return (
    <ModalBody
      className="w-full h-full pt-8 pb-4 flex flex-col"
      data-testid={testId}
    >
      <Box className="flex flex-1 flex-col items-center justify-center gap-4">
        <Text variant={TextVariant.HeadingSm} className="text-center">
          {title}
        </Text>
        <Text
          variant={TextVariant.BodyMd}
          className="text-center text-alternative"
        >
          {description}
        </Text>
        <QRCodeImage data={data} />
        <Button
          variant={ButtonVariant.Primary}
          size={ButtonSize.Lg}
          onClick={onDone}
          className="w-full my-2"
        >
          {doneLabel}
        </Button>
      </Box>
    </ModalBody>
  );
}
