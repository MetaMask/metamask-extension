import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  Button,
  ButtonSize,
  ButtonVariant,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalContentSize,
  ModalHeader,
  ModalOverlay,
  TextField,
  TextFieldSize,
  TextFieldType,
} from '../../../component-library';
import { BlockSize } from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useIsHardwareWalletAccount } from '../../../../hooks/useIsHardwareWalletAccount';
import { submitRequestToBackground } from '../../../../store/background-connection';
import { useDispatch } from '../../../../store/hooks';
import { setupPerpsAgentWallet } from '../../../../store/actions';
import { getSelectedInternalAccount } from '../../../../../shared/lib/selectors/accounts';
import { PERPS_AGENT_SETUP_ERROR_CODES } from '../../../../../shared/constants/perps';
import { getIsPerpsAgentWalletEnabled } from '../../../../selectors/perps/feature-flags';
// The controller types are type-only (erased at build); the flattened-state
// type deliberately omits perps controller slices, so the UI mirrors the
// runtime shape locally below and reuses the controller's exported types here.
/* eslint-disable import-x/no-restricted-paths */
import type {
  AgentRegistration,
  PerpsAgentWalletSetupStatus,
} from '../../../../../app/scripts/controllers/perps/agent-wallet/types';
/* eslint-enable import-x/no-restricted-paths */

/**
 * The PerpsAgentWalletController state is flattened onto `state.metamask` by
 * ComposableObservableStore.getFlatState(); the global flattened-state type
 * deliberately omits perps controller slices, so this narrow local type is
 * what the selectors read (same approach as the other perps selectors).
 */
type PerpsAgentWalletFlatState = {
  metamask: {
    agentsByAccount?: Record<string, AgentRegistration>;
    setupStatusByAccount?: Record<string, PerpsAgentWalletSetupStatus>;
  };
};

/** Why a setup attempt failed, classified from the stable background error codes. */
export type PerpsAgentWalletSetupErrorKind =
  | 'wrong-password'
  | 'rejected'
  | 'submission-failed';

/**
 * Classify a setup failure thrown across the background boundary. Only an
 * error's `message` survives extension RPC serialization, so matching is on
 * the stable prefixes the background API applies
 * ({@link PERPS_AGENT_SETUP_ERROR_CODES}); the underlying text distinguishes
 * a wrong password from a rejected master signature.
 *
 * @param error - The error captured by the caller.
 * @returns The failure kind for UI messaging.
 */
export const classifyAgentSetupError = (
  error: unknown,
): PerpsAgentWalletSetupErrorKind => {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes(PERPS_AGENT_SETUP_ERROR_CODES.SUBMISSION_FAILED)) {
    return 'submission-failed';
  }
  if (
    message.includes(PERPS_AGENT_SETUP_ERROR_CODES.REJECTED) &&
    message.toLowerCase().includes('password')
  ) {
    return 'wrong-password';
  }
  return 'rejected';
};

/**
 * Drives the perps agent wallet setup surface for the selected EVM account.
 *
 * @returns The setup state: the account's lifecycle `status`, the active
 * `agent` registration (or null), a `setup` callback, whether the session
 * `canSetup` (password-unlocked, ruling R1), the last failure `error` kind,
 * and whether the remote flag `isFlagEnabled`.
 */
export function usePerpsAgentWalletSetup(): {
  status: PerpsAgentWalletSetupStatus;
  setup: (password: string) => Promise<boolean>;
  agent: AgentRegistration | null;
  canSetup: boolean;
  error: PerpsAgentWalletSetupErrorKind | null;
  isFlagEnabled: boolean;
} {
  const dispatch = useDispatch();
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const address = selectedAccount?.address;
  const isFlagEnabled = useSelector(getIsPerpsAgentWalletEnabled);
  const agent = useSelector((state: PerpsAgentWalletFlatState) =>
    address ? (state.metamask.agentsByAccount?.[address] ?? null) : null,
  );
  const status = useSelector(
    (state: PerpsAgentWalletFlatState): PerpsAgentWalletSetupStatus =>
      (address ? state.metamask.setupStatusByAccount?.[address] : undefined) ??
      'idle',
  );
  const [canSetup, setCanSetup] = useState(false);
  const [error, setError] = useState<PerpsAgentWalletSetupErrorKind | null>(
    null,
  );

  // Ruling R1: `perpsCanSetupAgentWallet` is true only while the session was
  // password-unlocked. A passkey/social-login (encryptionKey) unlock keeps it
  // false, so the CTA stays hidden and perps falls back to master signing.
  // Only fetched when the flag is on and an account is selected; the derived
  // `canSetup` return value re-gates on both so a stale `true` never leaks.
  useEffect(() => {
    if (!isFlagEnabled || !address) {
      return;
    }
    let cancelled = false;
    submitRequestToBackground<boolean>('perpsCanSetupAgentWallet')
      .then((result) => {
        if (!cancelled) {
          setCanSetup(Boolean(result));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCanSetup(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [address, isFlagEnabled]);

  const setup = useCallback(
    async (password: string): Promise<boolean> => {
      if (!address) {
        return false;
      }
      setError(null);
      try {
        await dispatch(setupPerpsAgentWallet(password));
        return true;
      } catch (err) {
        setError(classifyAgentSetupError(err));
        return false;
      }
    },
    [address, dispatch],
  );

  return {
    status,
    setup,
    agent,
    canSetup: canSetup && isFlagEnabled && Boolean(address),
    error,
    isFlagEnabled,
  };
}

/**
 * Perps agent wallet ("one-tap trading") entry point: a setup CTA with a
 * password-gated review screen, an active status row, and a retry entry on
 * failure. Everything is gated on the `perpsAgentWalletEnabled` remote flag;
 * the component renders nothing while the flag is off.
 */
export const AgentWalletSetup = () => {
  const t = useI18nContext();
  const { status, setup, agent, canSetup, error, isFlagEnabled } =
    usePerpsAgentWalletSetup();
  // Hardware wallets sign the approveAgent on the device; this switches the
  // confirm helper copy ONLY — never the setup logic.
  const isHardwareWallet = useIsHardwareWalletAccount();
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = useCallback(async () => {
    setIsSubmitting(true);
    const ok = await setup(password);
    setIsSubmitting(false);
    if (ok) {
      setIsReviewOpen(false);
      setPassword('');
    }
  }, [password, setup]);

  const handleCancel = useCallback(() => {
    setIsReviewOpen(false);
    setPassword('');
  }, []);

  if (!isFlagEnabled) {
    return null;
  }

  // The review screen is open when the user opened it, or while the flow is
  // awaiting the master signature in the background.
  const isReviewVisible =
    isReviewOpen || status === 'awaiting-approval' || isSubmitting;
  const showCta = canSetup && !agent;

  const statusRow = agent ? (
    <Box
      paddingLeft={4}
      paddingRight={4}
      paddingTop={2}
      data-testid="perps-agent-wallet-status-active"
    >
      <Text variant={TextVariant.BodySm} color={TextColor.TextDefault}>
        {t('perpsAgentWalletStatusActive')}
      </Text>
      <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
        {agent.agentAddress}
      </Text>
    </Box>
  ) : null;

  const ctaBlock = showCta ? (
    <Box paddingLeft={4} paddingRight={4}>
      {status === 'failed' ? (
        <Text
          variant={TextVariant.BodySm}
          color={TextColor.ErrorDefault}
          data-testid="perps-agent-wallet-failed"
        >
          {t('somethingWentWrong')}
        </Text>
      ) : null}
      <Button
        variant={ButtonVariant.Secondary}
        size={ButtonSize.Lg}
        isFullWidth
        onClick={() => setIsReviewOpen(true)}
        data-testid="perps-agent-wallet-cta"
      >
        {t('perpsAgentWalletCta')}
      </Button>
    </Box>
  ) : null;

  return (
    <>
      {statusRow}
      {ctaBlock}

      {isReviewVisible ? (
        <Modal
          isOpen
          onClose={handleCancel}
          data-testid="perps-agent-wallet-review"
        >
          <ModalOverlay />
          <ModalContent size={ModalContentSize.Sm}>
            <ModalHeader onClose={handleCancel}>
              {t('perpsAgentWalletReviewTitle')}
            </ModalHeader>
            <ModalBody>
              <Box flexDirection={BoxFlexDirection.Column} gap={4}>
                <Box flexDirection={BoxFlexDirection.Column} gap={1}>
                  <Text
                    variant={TextVariant.BodyMd}
                    color={TextColor.TextDefault}
                    data-testid="perps-agent-wallet-name"
                  >
                    metamask-perps
                  </Text>
                  {agent ? (
                    <Text
                      variant={TextVariant.BodySm}
                      color={TextColor.TextAlternative}
                      data-testid="perps-agent-wallet-address"
                    >
                      {agent.agentAddress}
                    </Text>
                  ) : null}
                </Box>

                <Text
                  variant={TextVariant.BodyMd}
                  color={TextColor.TextAlternative}
                  data-testid="perps-agent-wallet-capability"
                >
                  {t('perpsAgentWalletCapabilityLine')}
                </Text>
                <Text
                  variant={TextVariant.BodySm}
                  color={TextColor.TextAlternative}
                  data-testid="perps-agent-wallet-rotation"
                >
                  {t('perpsAgentWalletRotationLine')}
                </Text>

                <Box flexDirection={BoxFlexDirection.Column} gap={1}>
                  <Text variant={TextVariant.BodyMd} color={TextColor.TextDefault}>
                    {t('enterYourPassword')}
                  </Text>
                  <TextField
                    type={TextFieldType.Password}
                    placeholder={t('password')}
                    size={TextFieldSize.Lg}
                    value={password}
                    onChange={(
                      event: React.ChangeEvent<HTMLInputElement>,
                    ) => setPassword(event.target.value)}
                    error={error === 'wrong-password'}
                    disabled={isSubmitting}
                    width={BlockSize.Full}
                    testId="perps-agent-wallet-password-input"
                  />
                  {error === 'wrong-password' ? (
                    <Text
                      variant={TextVariant.BodySm}
                      color={TextColor.ErrorDefault}
                      data-testid="perps-agent-wallet-wrong-password"
                    >
                      {t('wrongPassword')}
                    </Text>
                  ) : null}
                  {error === 'submission-failed' || error === 'rejected' ? (
                    <Text
                      variant={TextVariant.BodySm}
                      color={TextColor.ErrorDefault}
                      data-testid="perps-agent-wallet-error"
                    >
                      {t('somethingWentWrong')}
                    </Text>
                  ) : null}
                </Box>

                <Box
                  flexDirection={BoxFlexDirection.Row}
                  gap={4}
                  alignItems={BoxAlignItems.Center}
                >
                  <Button
                    isFullWidth
                    variant={ButtonVariant.Secondary}
                    size={ButtonSize.Lg}
                    onClick={handleCancel}
                    data-testid="perps-agent-wallet-cancel"
                  >
                    {t('cancel')}
                  </Button>
                  <Button
                    isFullWidth
                    variant={ButtonVariant.Primary}
                    size={ButtonSize.Lg}
                    onClick={handleConfirm}
                    isDisabled={isSubmitting || password.length === 0}
                    data-testid="perps-agent-wallet-confirm"
                  >
                    {isHardwareWallet
                      ? t('perpsAgentWalletConfirmOnDevice')
                      : t('confirm')}
                  </Button>
                </Box>
              </Box>
            </ModalBody>
          </ModalContent>
        </Modal>
      ) : null}
    </>
  );
};

export default AgentWalletSetup;
