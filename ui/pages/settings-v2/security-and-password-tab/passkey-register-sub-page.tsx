import React, { useContext, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Text,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  ButtonSize,
  ButtonVariant,
  Button,
  FontWeight,
  TextVariant,
  TextColor,
  IconName,
  IconSize,
  Icon,
  IconColor,
} from '@metamask/design-system-react';
import { SECURITY_AND_PASSWORD_ROUTE } from '../../../helpers/constants/routes';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  startPasskeyRegistration,
  cancelPasskeyCeremony,
} from '../../../../shared/lib/passkey';
import {
  protectVaultKeyWithPasskey,
  generatePasskeyRegistrationOptions,
  forceUpdateMetamaskState,
} from '../../../store/actions';
import { toast, ToastContent } from '../../../components/ui/toast/toast';
import { SECOND } from '../../../../shared/constants/time';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';

const passkeySettingsToastDurationMs = 5 * SECOND;

export default function PasskeyRegisterSubPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const t = useI18nContext();
  const { trackEvent } = useContext(MetaMetricsContext);
  const [isRegisteringPasskey, setIsRegisteringPasskey] = useState(false);

  const fromChangePassword =
    new URLSearchParams(location.search).get('from') === 'change-password';

  useEffect(
    () => () => {
      cancelPasskeyCeremony();
    },
    [],
  );

  const goToSettings = () => {
    navigate(SECURITY_AND_PASSWORD_ROUTE, { replace: true });
  };

  const handleRegisterPasskey = async () => {
    setIsRegisteringPasskey(true);
    try {
      const options = await generatePasskeyRegistrationOptions();
      const registrationResponse = await startPasskeyRegistration(options);
      await protectVaultKeyWithPasskey(registrationResponse);
      await forceUpdateMetamaskState(dispatch);
      toast.success(
        <ToastContent title={t('passkeySettingsToastTurnedOn')} />,
        { duration: passkeySettingsToastDurationMs },
      );
      trackEvent({
        category: MetaMetricsEventCategory.Settings,
        event: MetaMetricsEventName.SettingsUpdated,
        properties: {
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          passkey_registered: true,
        },
      });
      goToSettings();
    } catch {
      // User cancelled or authenticator unavailable — stay on this screen
    } finally {
      setIsRegisteringPasskey(false);
    }
  };

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      justifyContent={BoxJustifyContent.Start}
      alignItems={BoxAlignItems.Stretch}
      gap={6}
      padding={4}
      className="h-full min-h-0"
    >
      {fromChangePassword && (
        <Box
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          gap={2}
          padding={3}
          className="shrink-0 rounded-lg"
          style={{ backgroundColor: 'var(--color-success-muted)' }}
          data-testid="register-passkey-password-changed-banner"
        >
          <Icon
            name={IconName.Confirmation}
            size={IconSize.Sm}
            color={IconColor.SuccessDefault}
          />
          <Text
            variant={TextVariant.BodyMd}
            fontWeight={FontWeight.Medium}
            color={TextColor.TextDefault}
          >
            {t('passwordChangedRecently')}
          </Text>
        </Box>
      )}

      <Text
        variant={TextVariant.BodyMd}
        color={TextColor.TextAlternative}
        data-testid="register-passkey-description"
      >
        {t('passkeyDescription')}
      </Text>

      <Box
        flexDirection={BoxFlexDirection.Column}
        gap={4}
        className="w-full shrink-0"
      >
        <Button
          variant={ButtonVariant.Primary}
          size={ButtonSize.Lg}
          className="w-full"
          data-testid="register-passkey-set-up-button"
          disabled={isRegisteringPasskey}
          isLoading={isRegisteringPasskey}
          aria-label={t('setUpPasskey')}
          onClick={() => {
            handleRegisterPasskey();
          }}
        >
          {t('setUpPasskey')}
        </Button>
        <Button
          variant={ButtonVariant.Tertiary}
          size={ButtonSize.Md}
          className="w-full"
          data-testid="register-passkey-cancel-button"
          disabled={isRegisteringPasskey}
          onClick={goToSettings}
        >
          {fromChangePassword ? t('maybeLater') : t('cancel')}
        </Button>
      </Box>
    </Box>
  );
}
