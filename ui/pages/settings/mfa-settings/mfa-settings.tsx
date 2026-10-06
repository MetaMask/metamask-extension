import React, { useEffect } from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  Button,
  ButtonSize,
  ButtonVariant,
  FontWeight,
  Icon,
  IconColor,
  IconName,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import type { EnrolledCredential } from '@metamask/profile-sync-controller/sdk';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { isMfaKitEnabled, useMfa } from '../../../hooks/identity/mfa';
import { extensionMfaControllerAdapter } from '../../../hooks/identity/mfa/bindings';
import { MfaSettingsTestIds } from './test-ids';
import MfaQaPresets from './mfa-qa-presets';

/**
 * The profile's verification methods, and the QA presets outside production.
 */
const MfaSettings = () => {
  const t = useI18nContext();
  const { credentials, enroll } = useMfa();
  const email = credentials.find(({ type }) => type === 'email_otp');
  const isEmailActive = email?.status === 'active';

  useEffect(() => {
    extensionMfaControllerAdapter
      .refreshEnrolledCredentials()
      .catch(() => undefined);
  }, []);

  const getEmailSubtitle = (credential?: EnrolledCredential) => {
    if (credential?.type !== 'email_otp') {
      return undefined;
    }
    if (credential.status === 'pending') {
      return t('mfaSettingsEmailPending');
    }
    return credential.email ?? t('mfaSettingsEmailLinked');
  };

  const setUpEmail = () => {
    enroll({
      method: 'email_otp',
      reason: { operation: 'settings.addEmail' },
    }).catch(() => undefined);
  };

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      gap={6}
      padding={4}
      data-testid={MfaSettingsTestIds.CONTAINER}
    >
      <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
        {t('mfaSettingsDescription')}
      </Text>
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        gap={3}
        data-testid={MfaSettingsTestIds.EMAIL_ROW}
      >
        <Icon name={IconName.Mail} color={IconColor.IconAlternative} />
        <Box flexDirection={BoxFlexDirection.Column} className="flex-1">
          <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
            {t('mfaMethodEmail')}
          </Text>
          {email ? (
            <Text
              variant={TextVariant.BodySm}
              color={TextColor.TextAlternative}
            >
              {getEmailSubtitle(email)}
            </Text>
          ) : null}
        </Box>
        {isEmailActive ? (
          <Icon name={IconName.Check} color={IconColor.SuccessDefault} />
        ) : (
          <Button
            variant={ButtonVariant.Secondary}
            size={ButtonSize.Sm}
            onClick={setUpEmail}
            data-testid={MfaSettingsTestIds.EMAIL_BUTTON}
          >
            {t(email ? 'mfaSettingsFinishSetup' : 'mfaSettingsSetUp')}
          </Button>
        )}
      </Box>
      {isMfaKitEnabled() ? <MfaQaPresets /> : null}
    </Box>
  );
};

export default MfaSettings;
