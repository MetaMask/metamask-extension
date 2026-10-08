import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  BoxFlexDirection,
  Button,
  ButtonSize,
  ButtonVariant,
  FormTextField,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
} from '@metamask/design-system-react';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
import { useAnalytics } from '../../../../hooks/useAnalytics';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useGeoRewardsMetadata } from '../../../../hooks/rewards/useGeoRewardsMetadata';
import {
  selectOptinAllowedForGeoError,
  selectOptinAllowedForGeoLoading,
} from '../../../../ducks/rewards/selectors';
import { selectMoneyReferralAllowedForGeo } from '../../../../ducks/rewards-money/selectors';
import type { MetaMaskReduxState } from '../../../../store/store';
import { useValidateMoneyReferralCode } from '../../../../hooks/rewards/useValidateMoneyReferralCode';
import { ReferralActivatedModal } from './ReferralActivatedModal';
import { useAcceptMoneyReferralCode } from '../../../../hooks/rewards/useAcceptMoneyReferralCode';
import { useReferralMe } from '../../../../hooks/rewards/useReferralMe';

const MONEY_REFERRAL_CODE_MAX_LENGTH = 24;

/**
 * Keeps letters and digits, uppercases them, and caps the length at 24.
 *
 * @param value - Raw code from the route or the text field.
 * @returns The normalized code.
 */
function normalizeMoneyReferralCode(value: string): string {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, MONEY_REFERRAL_CODE_MAX_LENGTH);
}

type AcceptInviteSheetProps = {
  initialCode: string;
  onClose: () => void;
};

type ReferralInteraction = 'viewed' | 'accepted' | 'declined' | 'dismissed';

/**
 * Invite modal opened from `/home?ref=`. Copy comes from referral me.
 * Closes itself when the account is already in the program or the country
 * is excluded, and reports one MetaMetrics response.
 *
 * @param props - The code from the home query and the close handler.
 * @param props.initialCode - Prefill from `ref`.
 * @param props.onClose - Unmounts the sheet.
 */
export function AcceptInviteSheet({
  initialCode,
  onClose,
}: AcceptInviteSheetProps) {
  const t = useI18nContext();
  const { trackEvent, createEventBuilder } = useAnalytics();
  const { referralMe, isSettled, fetchReferralMe } = useReferralMe();
  useGeoRewardsMetadata();

  const [code, setCode] = useState(() =>
    normalizeMoneyReferralCode(initialCode),
  );
  const [showActivated, setShowActivated] = useState(false);
  const hasSeenEligibleInviteRef = useRef(false);
  const hasTrackedViewRef = useRef(false);
  const hasRespondedRef = useRef(false);
  const acceptStartedRef = useRef(false);

  const acceptAllowedForGeo = useSelector(selectMoneyReferralAllowedForGeo);
  const geoLoading = useSelector(selectOptinAllowedForGeoLoading);
  const geoError = useSelector(selectOptinAllowedForGeoError);
  const geoLocation = useSelector(
    (state: MetaMaskReduxState) => state.rewards.geoLocation,
  );

  const {
    isValidating,
    isValid,
    isUnknownError,
    isRejectedCode,
    validateCode,
  } = useValidateMoneyReferralCode(code);

  const handleAccepted = useCallback(() => {
    setShowActivated(true);
  }, []);

  const { isAccepting, errorMessage, accept } = useAcceptMoneyReferralCode({
    validateCode,
    fetchReferralMe,
    onAccepted: handleAccepted,
  });

  const variant = referralMe?.variant;
  const shouldDismissForRole =
    isSettled &&
    variant !== undefined &&
    variant !== 'NONE' &&
    !hasSeenEligibleInviteRef.current;
  const geoSettled = !geoLoading && (geoLocation !== null || geoError);
  const shouldDismissForGeo =
    geoSettled &&
    !acceptAllowedForGeo &&
    !acceptStartedRef.current &&
    !isAccepting;
  const shouldDismissForMissingPayload = isSettled && referralMe === null;
  const isOfferOnScreen =
    referralMe !== null &&
    isSettled &&
    geoSettled &&
    !shouldDismissForRole &&
    !shouldDismissForGeo &&
    !shouldDismissForMissingPayload;

  if (isOfferOnScreen) {
    hasSeenEligibleInviteRef.current = true;
  }

  const trackInteraction = useCallback(
    (interactionType: ReferralInteraction) => {
      const properties: Record<string, string> = {
        interaction_type: interactionType,
      };
      if (code) {
        properties.referral_code = code;
      }
      trackEvent(
        createEventBuilder(
          MetaMetricsEventName.RewardsMoneyReferralOfferInteracted,
        )
          .addCategory(MetaMetricsEventCategory.Rewards)
          .addProperties(properties)
          .build(),
      );
    },
    [code, createEventBuilder, trackEvent],
  );

  const trackResponded = useCallback(
    (interactionType: Exclude<ReferralInteraction, 'viewed'>) => {
      if (hasRespondedRef.current) {
        return;
      }
      hasRespondedRef.current = true;
      if (!hasTrackedViewRef.current) {
        return;
      }
      trackInteraction(interactionType);
    },
    [trackInteraction],
  );

  useEffect(() => {
    if (!isOfferOnScreen || hasTrackedViewRef.current) {
      return;
    }
    hasSeenEligibleInviteRef.current = true;
    hasTrackedViewRef.current = true;
    trackInteraction('viewed');
  }, [isOfferOnScreen, trackInteraction]);

  useEffect(() => {
    if (shouldDismissForRole || shouldDismissForMissingPayload) {
      onClose();
    }
  }, [onClose, shouldDismissForMissingPayload, shouldDismissForRole]);

  useEffect(() => {
    if (!shouldDismissForGeo) {
      return;
    }
    trackResponded('dismissed');
    onClose();
  }, [onClose, shouldDismissForGeo, trackResponded]);

  const handleDecline = useCallback(() => {
    trackResponded('declined');
    onClose();
  }, [onClose, trackResponded]);

  const handleDismiss = useCallback(() => {
    trackResponded('dismissed');
    onClose();
  }, [onClose, trackResponded]);

  const handleAccept = useCallback(() => {
    acceptStartedRef.current = true;
    void accept(code).then((didAccept) => {
      if (didAccept) {
        trackResponded('accepted');
      }
    });
  }, [accept, code, trackResponded]);

  if (showActivated) {
    return <ReferralActivatedModal referralMe={referralMe} onClose={onClose} />;
  }

  if (!isOfferOnScreen) {
    return null;
  }

  const copy = referralMe?.localized_text;
  const fieldError =
    errorMessage ||
    (isRejectedCode ? t('rewardsOnboardingReferralCodeError') : '') ||
    (isUnknownError ? t('rewardsOnboardingReferralCodeUnknownError') : '');
  const canAccept = isValid && acceptAllowedForGeo && !isAccepting;

  return (
    <Modal isOpen onClose={handleDismiss} data-testid="money-referral-invite">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader
          onClose={handleDismiss}
          closeButtonProps={{ ariaLabel: t('close') }}
        >
          {copy?.inviteTitle ?? ''}
        </ModalHeader>
        <ModalBody>
          <Box flexDirection={BoxFlexDirection.Column} gap={4}>
            <Text>{copy?.inviteMessageBody ?? ''}</Text>
            <FormTextField
              id="money-referral-code"
              label={copy?.inviteReferralCode ?? ''}
              value={code}
              isError={Boolean(fieldError)}
              helpText={fieldError || undefined}
              onChange={(event) => {
                setCode(normalizeMoneyReferralCode(event.target.value));
              }}
              inputProps={{
                'data-testid': 'money-referral-code-input',
                autoCapitalize: 'characters',
              }}
            />
          </Box>
        </ModalBody>
        <ModalFooter>
          <Box flexDirection={BoxFlexDirection.Column} gap={2}>
            <Button
              size={ButtonSize.Lg}
              variant={ButtonVariant.Primary}
              isDisabled={!canAccept}
              onClick={handleAccept}
              data-testid="money-referral-accept"
            >
              {copy?.inviteAccept ?? ''}
            </Button>
            <Button
              size={ButtonSize.Lg}
              variant={ButtonVariant.Tertiary}
              onClick={handleDecline}
              data-testid="money-referral-decline"
            >
              {copy?.inviteDecline ?? ''}
            </Button>
          </Box>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
