import React, { useCallback, useMemo } from 'react';
import {
  Box,
  Text,
  TextVariant,
  Button,
  ButtonSize,
  ButtonVariant,
} from '@metamask/design-system-react';
import qrCode from 'qrcode-generator';
import { useDispatch, useSelector } from 'react-redux';
import { getSocialLoginType } from '../../../selectors/seedless-onboarding/social-sync';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { setOnboardingModalOpen } from '../../../ducks/rewards';
import { ModalBody } from '../../component-library/modal-body/modal-body';

const QrCodeView = ({ data }: { data: string }) => {
  const qrImage = qrCode(0, 'M');
  qrImage.addData(data);
  qrImage.make();

  return (
    <Box className="qr-code__wrapper my-2">
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
  );
};

// eslint-disable-next-line @typescript-eslint/naming-convention
export default function RewardsQRCode() {
  const socialType = useSelector(getSocialLoginType);
  const t = useI18nContext();
  const dispatch = useDispatch();

  const handleClose = useCallback(() => {
    dispatch(setOnboardingModalOpen(false));
  }, [dispatch]);

  const dataToEncode = useMemo(() => {
    if (socialType) {
      return `https://link.metamask.io/onboarding?type=${socialType}&existing=true`;
    }

    return `https://link.metamask.io/onboarding?type=srp`;
  }, [socialType]);

  return (
    <ModalBody
      className="w-full h-full pt-8 pb-4 flex flex-col"
      data-testid="rewards-onboarding-qrcode-container"
    >
      <Box className="flex flex-1 flex-col items-center justify-center gap-4">
        <Text variant={TextVariant.HeadingSm} className="text-center">
          {t('rewardsQRCodeTitle')}
        </Text>
        <Text
          variant={TextVariant.BodyMd}
          className="text-center text-alternative"
        >
          {t('rewardsQRCodeDescription')}
        </Text>
        <QrCodeView data={dataToEncode} />
        <Button
          variant={ButtonVariant.Primary}
          size={ButtonSize.Lg}
          onClick={handleClose}
          className="w-full my-2"
        >
          {t('gotIt')}
        </Button>
      </Box>
    </ModalBody>
  );
}
