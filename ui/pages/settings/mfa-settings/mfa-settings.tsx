import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  FontWeight,
  Icon,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { MFA_SETTINGS_EMAIL_ROUTE } from '../../../helpers/constants/routes';
import { transitionForward } from '../../../components/ui/transition';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { isMfaKitEnabled, useMfa } from '../../../hooks/identity/mfa';
import { extensionMfaControllerAdapter } from '../../../hooks/identity/mfa/bindings';
import { MfaSettingsTestIds } from './test-ids';
import MfaQaPresets from './mfa-qa-presets';

/**
 * The profile's verification methods: "Add" sets one up, the chevron opens
 * one that is set up. Passkeys are mobile only, so only email shows here.
 */
const MfaSettings = () => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const { credentials, enroll } = useMfa();
  const hasEmail = credentials.some(
    ({ type, status }) => type === 'email_otp' && status === 'active',
  );

  useEffect(() => {
    extensionMfaControllerAdapter
      .refreshEnrolledCredentials()
      .catch(() => undefined);
  }, []);

  const openEmail = () => {
    if (hasEmail) {
      transitionForward(() => navigate(MFA_SETTINGS_EMAIL_ROUTE));
      return;
    }
    enroll({
      method: 'email_otp',
      reason: { operation: 'settings.addEmail' },
    }).catch(() => undefined);
  };

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      data-testid={MfaSettingsTestIds.CONTAINER}
    >
      <Text
        variant={TextVariant.BodyMd}
        color={TextColor.TextAlternative}
        className="px-4 pt-4 pb-2"
      >
        {t('mfaSettingsNotice')}
      </Text>
      <Box
        asChild
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.Between}
        alignItems={BoxAlignItems.Center}
        paddingVertical={3}
        paddingHorizontal={4}
        className="w-full hover:bg-background-default-hover"
      >
        <button
          type="button"
          onClick={openEmail}
          data-testid={MfaSettingsTestIds.EMAIL_ROW}
        >
          <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
            {t('mfaMethodEmail')}
          </Text>
          <Box
            flexDirection={BoxFlexDirection.Row}
            alignItems={BoxAlignItems.Center}
            gap={1}
          >
            {hasEmail ? null : (
              <Text
                variant={TextVariant.BodyMd}
                fontWeight={FontWeight.Medium}
                color={TextColor.TextAlternative}
              >
                {t('mfaSettingsAdd')}
              </Text>
            )}
            <Icon
              name={IconName.ArrowRight}
              size={IconSize.Sm}
              className="text-icon-alternative"
            />
          </Box>
        </button>
      </Box>
      {isMfaKitEnabled() ? (
        <Box padding={4}>
          <MfaQaPresets />
        </Box>
      ) : null}
    </Box>
  );
};

export default MfaSettings;
