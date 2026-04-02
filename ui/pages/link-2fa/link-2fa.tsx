import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxFlexDirection,
  BoxJustifyContent,
  Button,
  ButtonIcon,
  ButtonIconSize,
  ButtonSize,
  ButtonVariant,
  FontWeight,
  Icon,
  IconName,
  IconColor,
  IconSize,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../hooks/useI18nContext';
import { ACCOUNT_LIST_PAGE_ROUTE, DEFAULT_ROUTE } from '../../helpers/constants/routes';

type Step = 'qr' | 'success';

export const Link2FAPage: React.FC = () => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('qr');

  const handleClose = useCallback(
    () => navigate(ACCOUNT_LIST_PAGE_ROUTE, { replace: true }),
    [navigate],
  );

  const handleGoToWallet = useCallback(() => {
    localStorage.setItem('mm-2fa-wallet-created', 'true');
    navigate(DEFAULT_ROUTE, { replace: true });
  }, [navigate]);

  if (step === 'success') {
    return (
      <Box
        backgroundColor={BoxBackgroundColor.BackgroundDefault}
        className="flex flex-col h-full items-center justify-center px-6"
      >
        <Box
          backgroundColor={BoxBackgroundColor.SuccessMuted}
          className="rounded-full p-6 mb-6"
        >
          <Icon
            name={IconName.ShieldLock}
            color={IconColor.SuccessDefault}
            size={IconSize.Xl}
          />
        </Box>
        <Text
          variant={TextVariant.HeadingLg}
          fontWeight={FontWeight.Bold}
          className="text-center"
        >
          {t('twoFALinkRestoredTitle')}
        </Text>
        <Text
          variant={TextVariant.BodySm}
          color={TextColor.TextAlternative}
          className="mt-2 text-center max-w-[300px]"
        >
          {t('twoFALinkRestoredSubtitle')}
        </Text>
        <Box className="mt-8 w-full">
          <Button
            variant={ButtonVariant.Primary}
            size={ButtonSize.Lg}
            isFullWidth
            onClick={handleGoToWallet}
          >
            {t('twoFALinkGoToWallet')}
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      backgroundColor={BoxBackgroundColor.BackgroundDefault}
      className="flex flex-col h-full"
    >
      {/* Header */}
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        justifyContent={BoxJustifyContent.Between}
        padding={4}
        className="shrink-0"
      >
        <ButtonIcon
          iconName={IconName.ArrowLeft}
          ariaLabel="Back"
          size={ButtonIconSize.Sm}
          onClick={handleClose}
        />
        <Text variant={TextVariant.HeadingSm} fontWeight={FontWeight.Bold}>
          {t('twoFALink2FATitle')}
        </Text>
        <ButtonIcon
          iconName={IconName.Close}
          ariaLabel="Close"
          size={ButtonIconSize.Sm}
          onClick={handleClose}
        />
      </Box>

      <Box className="flex-1 overflow-y-auto flex flex-col items-center" paddingHorizontal={4}>
        {/* QR Code placeholder */}
        <Box
          flexDirection={BoxFlexDirection.Row}
          justifyContent={BoxJustifyContent.Center}
          alignItems={BoxAlignItems.Center}
          backgroundColor={BoxBackgroundColor.BackgroundMuted}
          className="rounded-2xl mt-6 mb-6"
          style={{ width: 220, height: 220 }}
        >
          <Icon
            name={IconName.QrCode}
            color={IconColor.IconMuted}
            size={IconSize.Xl}
          />
        </Box>

        <Text
          variant={TextVariant.HeadingMd}
          fontWeight={FontWeight.Bold}
          className="text-center"
        >
          {t('twoFALinkScanTitle')}
        </Text>
        <Text
          variant={TextVariant.BodySm}
          color={TextColor.TextAlternative}
          className="mt-1 text-center"
        >
          {t('twoFALinkScanSubtitle')}
        </Text>
      </Box>

      <Box padding={4} className="shrink-0">
        <Button
          variant={ButtonVariant.Primary}
          size={ButtonSize.Lg}
          isFullWidth
          onClick={() => setStep('success')}
        >
          {t('twoFALinkScanDone')}
        </Button>
      </Box>
    </Box>
  );
};

export default Link2FAPage;
