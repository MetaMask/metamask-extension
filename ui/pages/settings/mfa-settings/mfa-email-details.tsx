import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { ENROLLMENT_MAX_SESSION_AGE_MS } from '@metamask/profile-sync-controller/auth';
import {
  AvatarIcon,
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  Button,
  ButtonSize,
  ButtonVariant,
  IconAlert,
  IconAlertSeverity,
  IconName,
  IconSize,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  TextAlign,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { MFA_SETTINGS_ROUTE } from '../../../helpers/constants/routes';
import { formatDate } from '../../../helpers/utils/util';
import { getIsSocialLoginFlow } from '../../../selectors';
import { transitionBack } from '../../../components/ui/transition';
import { toast } from '../../../components/ui/toast/toast';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useMfa } from '../../../hooks/identity/mfa';
import { extensionMfaControllerAdapter } from '../../../hooks/identity/mfa/bindings';
import { MfaFlowError } from '../../../hooks/identity/mfa/engine/errors';
import { isMethodSupported } from '../../../hooks/identity/mfa/engine/planner';
import { maskEmail } from '../../../hooks/identity/mfa/mask-email';
import { removeMfaCredential } from '../../../hooks/identity/mfa/removeMfaCredential';
import { getMfaUsedFor } from './mfa-used-for';
import { MfaSettingsTestIds } from './test-ids';

const MODALS = {
  confirm: {
    title: 'mfaSettingsRemoveEmail',
    description: 'mfaSettingsRemoveEmailDescription',
    testId: MfaSettingsTestIds.CONFIRM_MODAL,
  },
  lastMethod: {
    title: 'mfaSettingsLastEmailTitle',
    description: 'mfaSettingsLastEmailDescription',
    testId: MfaSettingsTestIds.LAST_METHOD_MODAL,
  },
  elsewhere: {
    title: 'mfaSettingsRemoveElsewhereTitle',
    description: 'mfaSettingsRemoveElsewhereDescription',
    testId: MfaSettingsTestIds.ELSEWHERE_MODAL,
  },
};

/**
 * The email method: when it was added, what it protects, and its removal.
 * Removing the last method is refused, and so is removing it here when the
 * other methods only run on mobile; otherwise the user confirms, then proves
 * it's them with another method.
 */
const MfaEmailDetails = () => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const { credentials, verifyOrEnroll } = useMfa();
  const isSocialLogin = useSelector(getIsSocialLoginFlow);
  const [modal, setModal] = useState<'confirm' | 'lastMethod' | 'elsewhere'>();
  const [isRemoving, setIsRemoving] = useState(false);

  const active = credentials.filter(({ status }) => status === 'active');
  const email = active.find(({ type }) => type === 'email_otp');
  const others = active.filter((other) => other !== email);
  // Only methods this client can run may prove it's the user.
  const verifyWith = [...new Set(others.map(({ type }) => type))].filter(
    (method) => isMethodSupported(method, 'extension'),
  );

  if (email?.type !== 'email_otp') {
    return null;
  }

  const remove = async () => {
    setModal(undefined);
    setIsRemoving(true);
    try {
      const { token } = await verifyOrEnroll({
        methods: verifyWith,
        verifyWith,
        maxSessionAgeMs: ENROLLMENT_MAX_SESSION_AGE_MS,
        reason: { operation: 'settings.removeEmail' },
      });
      await removeMfaCredential(email, token);
      await extensionMfaControllerAdapter
        .refreshEnrolledCredentials()
        .catch(() => undefined);
      toast.success(t('mfaSettingsEmailRemoved'));
      transitionBack(() => navigate(MFA_SETTINGS_ROUTE, { replace: true }));
    } catch (error) {
      // The kit has already shown its own errors, or the user backed out.
      if (!(error instanceof MfaFlowError)) {
        toast.error(t('mfaSettingsRemoveFailed'));
      }
    } finally {
      setIsRemoving(false);
    }
  };

  const openRemoval = () => {
    if (others.length === 0) {
      setModal('lastMethod');
      return;
    }
    setModal(verifyWith.length ? 'confirm' : 'elsewhere');
  };

  const isConfirm = modal === 'confirm';

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      justifyContent={BoxJustifyContent.Between}
      gap={6}
      padding={4}
      className="h-full min-h-0"
      data-testid={MfaSettingsTestIds.EMAIL_DETAILS}
    >
      <Box flexDirection={BoxFlexDirection.Column} gap={6}>
        <Box
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          gap={4}
          padding={4}
          className="rounded-2xl border border-muted"
        >
          <AvatarIcon iconName={IconName.Mail} />
          <Box flexDirection={BoxFlexDirection.Column}>
            <Text variant={TextVariant.BodyMd}>
              {email.email ? maskEmail(email.email) : t('mfaMethodEmail')}
            </Text>
            {email.enrolledAt ? (
              <Text
                variant={TextVariant.BodySm}
                color={TextColor.TextAlternative}
              >
                {t('mfaSettingsAddedOn', [
                  formatDate(email.enrolledAt, "LLL d, y 'at' h:mm a"),
                ])}
              </Text>
            ) : null}
          </Box>
        </Box>
        <Box flexDirection={BoxFlexDirection.Column} gap={4}>
          <Text variant={TextVariant.HeadingSm}>{t('mfaSettingsUsedFor')}</Text>
          {getMfaUsedFor('email_otp', { isSocialLogin }).map(
            ({ key, icon, label }) => (
              <Box
                key={key}
                flexDirection={BoxFlexDirection.Row}
                alignItems={BoxAlignItems.Center}
                gap={4}
              >
                <AvatarIcon iconName={icon} />
                <Text variant={TextVariant.BodyMd}>{t(label)}</Text>
              </Box>
            ),
          )}
        </Box>
      </Box>
      <Button
        variant={ButtonVariant.Secondary}
        size={ButtonSize.Lg}
        isDanger
        isFullWidth
        isLoading={isRemoving}
        onClick={openRemoval}
        data-testid={MfaSettingsTestIds.REMOVE_BUTTON}
      >
        {t('mfaSettingsRemoveEmail')}
      </Button>
      {modal ? (
        <Modal
          isOpen
          onClose={() => setModal(undefined)}
          data-testid={MODALS[modal].testId}
        >
          <ModalOverlay />
          <ModalContent>
            <ModalHeader
              onClose={() => setModal(undefined)}
              closeButtonProps={{ ariaLabel: t('close') }}
            />
            <ModalBody>
              <Box flexDirection={BoxFlexDirection.Column} gap={4}>
                <Box
                  flexDirection={BoxFlexDirection.Column}
                  alignItems={BoxAlignItems.Center}
                  gap={2}
                >
                  <IconAlert
                    severity={IconAlertSeverity.Danger}
                    size={IconSize.Xl}
                  />
                  <Text
                    variant={TextVariant.HeadingSm}
                    textAlign={TextAlign.Center}
                  >
                    {t(MODALS[modal].title)}
                  </Text>
                </Box>
                <Text
                  variant={TextVariant.BodyMd}
                  color={TextColor.TextAlternative}
                >
                  {t(MODALS[modal].description)}
                </Text>
              </Box>
            </ModalBody>
            <ModalFooter>
              <Box flexDirection={BoxFlexDirection.Column} gap={4}>
                {isConfirm ? (
                  <Button
                    variant={ButtonVariant.Primary}
                    size={ButtonSize.Lg}
                    isDanger
                    isFullWidth
                    onClick={remove}
                    data-testid={MfaSettingsTestIds.CONFIRM_BUTTON}
                  >
                    {t('remove')}
                  </Button>
                ) : null}
                <Button
                  variant={
                    isConfirm ? ButtonVariant.Secondary : ButtonVariant.Primary
                  }
                  size={ButtonSize.Lg}
                  isFullWidth
                  onClick={() => setModal(undefined)}
                >
                  {t(isConfirm ? 'cancel' : 'gotIt')}
                </Button>
              </Box>
            </ModalFooter>
          </ModalContent>
        </Modal>
      ) : null}
    </Box>
  );
};

export default MfaEmailDetails;
