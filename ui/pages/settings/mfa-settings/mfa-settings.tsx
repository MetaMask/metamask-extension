import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
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
import {
  MFA_SETTINGS_EMAIL_ROUTE,
  MFA_SETTINGS_TOTP_ROUTE,
} from '../../../helpers/constants/routes';
import { transitionForward } from '../../../components/ui/transition';
import { toast } from '../../../components/ui/toast/toast';
import { getIsSocialLoginFlow } from '../../../selectors';
import { getMfaUiKitMethods } from '../../../selectors/identity/mfa-ui-kit';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { isMfaDevBuild, useMfa } from '../../../hooks/identity/mfa';
import { extensionMfaControllerAdapter } from '../../../hooks/identity/mfa/bindings';
import type { MfaDetailsMethod } from './mfa-method-details';
import { MfaSettingsTestIds } from './test-ids';
import MfaQaPresets from './mfa-qa-presets';

const ROWS: {
  method: MfaDetailsMethod;
  label: string;
  route: string;
  operation: string;
  successMessage: string;
  testId: string;
}[] = [
  {
    method: 'email_otp',
    label: 'mfaMethodEmail',
    route: MFA_SETTINGS_EMAIL_ROUTE,
    operation: 'settings.addEmail',
    successMessage: 'mfaSettingsEmailVerified',
    testId: MfaSettingsTestIds.EMAIL_ROW,
  },
  {
    method: 'totp',
    label: 'mfaMethodTotp',
    route: MFA_SETTINGS_TOTP_ROUTE,
    operation: 'settings.addAuthenticatorApp',
    successMessage: 'mfaSettingsAuthenticatorAppAdded',
    testId: MfaSettingsTestIds.TOTP_ROW,
  },
];

/**
 * The profile's verification methods: "Add" sets one up, the chevron opens
 * one that is set up. Passkeys are mobile only, so they do not show here.
 * Email is hidden for social login users: their login email is not a real
 * second factor.
 */
const MfaSettings = () => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const { credentials, enroll } = useMfa();
  const isSocialLogin = useSelector(getIsSocialLoginFlow);
  const methods = useSelector(getMfaUiKitMethods);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const activeTypes = new Set(
    credentials
      .filter(({ status }) => status === 'active')
      .map(({ type }) => type),
  );

  useEffect(() => {
    extensionMfaControllerAdapter
      .refreshEnrolledCredentials()
      .catch(() => undefined);
  }, []);

  const rows = ROWS.map((row) => ({
    ...row,
    isSetUp: activeTypes.has(row.method),
  })).filter(
    ({ method, isSetUp }) =>
      !(isSocialLogin && method === 'email_otp') &&
      (isSetUp || methods.includes(method)),
  );

  const open = ({
    method,
    route,
    operation,
    successMessage,
    isSetUp,
  }: (typeof rows)[number]) => {
    if (isSetUp) {
      transitionForward(() => navigate(route));
      return;
    }
    setIsEnrolling(true);
    enroll({ method, reason: { operation } })
      .then(() => toast.success(t(successMessage)))
      .catch(() => undefined)
      .finally(() => setIsEnrolling(false));
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
      {rows.map((row) => (
        <Box
          key={row.method}
          asChild
          flexDirection={BoxFlexDirection.Row}
          justifyContent={BoxJustifyContent.Between}
          alignItems={BoxAlignItems.Center}
          paddingVertical={3}
          paddingHorizontal={4}
          className="w-full border-0 bg-transparent text-left text-inherit cursor-pointer hover:bg-background-default-hover disabled:cursor-default"
        >
          <button
            type="button"
            onClick={() => open(row)}
            disabled={isEnrolling}
            aria-busy={isEnrolling}
            data-testid={row.testId}
          >
            <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
              {t(row.label)}
            </Text>
            <Box
              flexDirection={BoxFlexDirection.Row}
              alignItems={BoxAlignItems.Center}
              gap={1}
            >
              {row.isSetUp ? null : (
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
      ))}
      {isMfaDevBuild() ? (
        <Box padding={4}>
          <MfaQaPresets />
        </Box>
      ) : null}
    </Box>
  );
};

export default MfaSettings;
