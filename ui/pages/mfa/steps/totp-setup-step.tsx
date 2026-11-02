import React from 'react';
import {
  BannerAlert,
  BannerAlertSeverity,
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  Button,
  ButtonIcon,
  ButtonSize,
  ButtonVariant,
  FontWeight,
  IconColor,
  IconName,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { MfaFlowTestIds } from '../test-ids';
import StepLayout, { type StepProps } from './step-layout';

/**
 * Shows the setup key in groups of four, as authenticator apps print it.
 *
 * @param secret - The base32 secret.
 * @returns The grouped key.
 */
const formatSetupKey = (secret: string) =>
  secret.match(/.{1,4}/gu)?.join(' ') ?? secret;

/**
 * Adds MetaMask to the user's authenticator app: its phone scans the QR code,
 * or the user types the setup key. The secret and QR code are never stored,
 * and a copied key is cleared from the clipboard.
 *
 * @param props - The step's props.
 * @param props.step - The setup step, with the secret and QR code.
 * @param props.state - The flow state.
 * @param props.onAction - Continues to the code.
 */
const TotpSetupStep = ({ step, state, onAction }: StepProps<'totpSetup'>) => {
  const t = useI18nContext();
  const [isCopied, copy] = useCopyToClipboard({ sensitive: true });

  return (
    <StepLayout
      title={t('mfaTotpSetupTitle')}
      description={t('mfaTotpSetupDescription')}
      error={state.error}
      footer={
        <Button
          variant={ButtonVariant.Primary}
          size={ButtonSize.Lg}
          isFullWidth
          isLoading={state.busy}
          onClick={() => onAction({ type: 'continue' })}
          data-testid={MfaFlowTestIds.PRIMARY_BUTTON}
        >
          {t('mfaTotpSetupContinue')}
        </Button>
      }
    >
      <Box flexDirection={BoxFlexDirection.Column} gap={4} paddingTop={2}>
        {step.isRestart ? (
          <BannerAlert
            severity={BannerAlertSeverity.Warning}
            description={t('mfaTotpSetupRestarted')}
          />
        ) : null}
        {/* The QR code needs a light background to scan in dark mode. */}
        <Box
          alignItems={BoxAlignItems.Center}
          className="self-center rounded-2xl bg-white p-3"
        >
          <img
            src={step.qrCode}
            alt={t('mfaTotpSetupQrAlt')}
            width={200}
            height={200}
            data-testid={MfaFlowTestIds.TOTP_QR_IMAGE}
          />
        </Box>
        <Box
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          gap={3}
          padding={4}
          className="rounded-2xl bg-muted"
        >
          <Box
            flexDirection={BoxFlexDirection.Column}
            gap={1}
            className="flex-1"
          >
            <Text
              variant={TextVariant.BodySm}
              color={TextColor.TextAlternative}
            >
              {t('mfaTotpSetupKey')}
            </Text>
            <Text
              variant={TextVariant.BodyMd}
              fontWeight={FontWeight.Medium}
              className="break-all"
              data-testid={MfaFlowTestIds.TOTP_SETUP_KEY}
            >
              {formatSetupKey(step.secret)}
            </Text>
          </Box>
          <ButtonIcon
            iconName={isCopied ? IconName.CopySuccess : IconName.Copy}
            iconProps={
              isCopied ? { color: IconColor.SuccessDefault } : undefined
            }
            ariaLabel={t('mfaTotpSetupCopy')}
            onClick={() => copy(step.secret)}
            data-testid={MfaFlowTestIds.TOTP_COPY_KEY}
          />
        </Box>
      </Box>
    </StepLayout>
  );
};

export default TotpSetupStep;
