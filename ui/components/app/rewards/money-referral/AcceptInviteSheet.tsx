import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  BoxFlexDirection,
  Button,
  ButtonSize,
  ButtonVariant,
  HelpText,
  HelpTextSeverity,
  Label,
  Modal,
  ModalBody,
  ModalContent,
  ModalContentSize,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  TextColor,
  TextField,
  TextFieldSize,
  TextVariant,
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
import { useAcceptMoneyReferralCode } from '../../../../hooks/rewards/useAcceptMoneyReferralCode';
import { useReferralMe } from '../../../../hooks/rewards/useReferralMe';
import { REWARDS_MONEY_INVITE_ALLOWED_CAPABILITIES } from '../../../../hooks/rewards/rewards-money-messenger';
import { RouteMessengerProvider } from '../../../../contexts/route-messenger';
import { ReferralActivatedModal } from './ReferralActivatedModal';

const MONEY_REFERRAL_CODE_MAX_LENGTH = 24;

const referralCodeInputProps = {
  className: 'px-4 font-medium',
  autoCapitalize: 'characters',
  'data-testid': 'money-referral-code-input',
};

/**
 * Keeps letters and digits, uppercases them, and caps the length at 24.
 *
 * @param value - Raw code from the route or the text field.
 * @returns The normalized code.
 */
function normalizeMoneyReferralCode(value: string): string {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]/gu, '')
    .slice(0, MONEY_REFERRAL_CODE_MAX_LENGTH);
}

type AcceptInviteSheetProps = {
  initialCode: string;
  onClose: () => void;
};

type ReferralInteraction = 'viewed' | 'accepted' | 'declined' | 'dismissed';

const AcceptInviteSheetContent = ({
  initialCode,
  onClose,
}: AcceptInviteSheetProps) => {
  const t = useI18nContext();
  const { trackEvent, createEventBuilder } = useAnalytics();
  const { referralMe, isSettled, fetchReferralMe } = useReferralMe();
  useGeoRewardsMetadata({});

  const [code, setCode] = useState(() =>
    normalizeMoneyReferralCode(initialCode),
  );
  const [showActivated, setShowActivated] = useState(false);
  const [hasSeenEligibleInvite, setHasSeenEligibleInvite] = useState(false);
  const [acceptStarted, setAcceptStarted] = useState(false);
  const hasTrackedViewRef = useRef(false);
  const hasRespondedRef = useRef(false);

  const acceptAllowedForGeo = useSelector(selectMoneyReferralAllowedForGeo);
  const geoLoading = useSelector(selectOptinAllowedForGeoLoading);
  const geoError = useSelector(selectOptinAllowedForGeoError);
  const geoLocation = useSelector(
    (state: MetaMaskReduxState) => state.rewards.geoLocation,
  );

  const { isValid, isUnknownError, isRejectedCode, validateCode } =
    useValidateMoneyReferralCode(code);

  const handleAccepted = useCallback(() => {
    setShowActivated(true);
  }, []);

  const { isAccepting, isAcceptCoolingDown, errorMessage, accept } =
    useAcceptMoneyReferralCode({
      validateCode,
      fetchReferralMe,
      onAccepted: handleAccepted,
    });

  const variant = referralMe?.variant;
  const shouldDismissForRole =
    isSettled &&
    variant !== undefined &&
    variant !== 'NONE' &&
    !hasSeenEligibleInvite;
  const geoSettled = !geoLoading && (geoLocation !== null || geoError);
  const shouldDismissForGeo =
    geoSettled && !acceptAllowedForGeo && !acceptStarted && !isAccepting;
  const shouldDismissForMissingPayload = isSettled && referralMe === null;
  const isOfferOnScreen =
    referralMe !== null &&
    isSettled &&
    geoSettled &&
    !shouldDismissForRole &&
    !shouldDismissForGeo &&
    !shouldDismissForMissingPayload;

  const trackInteraction = useCallback(
    (interactionType: ReferralInteraction) => {
      const properties: Record<string, string> = {
        // eslint-disable-next-line @typescript-eslint/naming-convention -- analytics property
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
      ).catch(() => undefined);
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
    setHasSeenEligibleInvite(true);
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
    setAcceptStarted(true);
    accept(code)
      .then((didAccept) => {
        if (didAccept) {
          trackResponded('accepted');
        }
      })
      .catch(() => undefined);
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
    (isRejectedCode ? t('rewardsMoneyReferralCodeError') : '') ||
    (isUnknownError ? t('rewardsMoneyReferralCodeUnknownError') : '');
  const canAccept =
    isValid && acceptAllowedForGeo && !isAccepting && !isAcceptCoolingDown;

  return (
    <Modal isOpen onClose={handleDismiss} data-testid="money-referral-invite">
      <ModalOverlay />
      <ModalContent className="items-center" size={ModalContentSize.Md}>
        <ModalHeader
          onClose={handleDismiss}
          closeButtonProps={{ ariaLabel: t('close') }}
        >
          {copy?.inviteTitle ?? ''}
        </ModalHeader>
        <ModalBody>
          <Box flexDirection={BoxFlexDirection.Column} gap={4}>
            <Text
              variant={TextVariant.BodyMd}
              color={TextColor.TextAlternative}
            >
              {copy?.inviteMessageBody ?? ''}
            </Text>
            <Box flexDirection={BoxFlexDirection.Column} gap={2}>
              <Label
                htmlFor="money-referral-code"
                color={TextColor.TextAlternative}
              >
                {copy?.inviteReferralCode ?? ''}
              </Label>
              <TextField
                id="money-referral-code"
                value={code}
                size={TextFieldSize.Lg}
                isError={Boolean(fieldError)}
                className="h-14 w-full"
                onChange={(event) => {
                  setCode(normalizeMoneyReferralCode(event.target.value));
                }}
                inputProps={referralCodeInputProps}
              />
              {fieldError ? (
                <HelpText severity={HelpTextSeverity.Danger}>
                  {fieldError}
                </HelpText>
              ) : null}
            </Box>
          </Box>
        </ModalBody>
        <ModalFooter>
          <Box
            flexDirection={BoxFlexDirection.Column}
            gap={2}
            className="w-full"
          >
            <Button
              variant={ButtonVariant.Primary}
              size={ButtonSize.Lg}
              isFullWidth
              isDisabled={!canAccept}
              onClick={handleAccept}
              data-testid="money-referral-accept"
            >
              {copy?.inviteAccept ?? ''}
            </Button>
            <Button
              variant={ButtonVariant.Tertiary}
              size={ButtonSize.Lg}
              isFullWidth
              onClick={handleDecline}
              className="text-default"
              data-testid="money-referral-decline"
            >
              {copy?.inviteDecline ?? ''}
            </Button>
          </Box>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

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
  return (
    <RouteMessengerProvider
      path="rewards-money-accept-invite"
      capabilities={REWARDS_MONEY_INVITE_ALLOWED_CAPABILITIES}
    >
      <AcceptInviteSheetContent initialCode={initialCode} onClose={onClose} />
    </RouteMessengerProvider>
  );
}
