import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
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
  ModalBody,
  ModalFooter,
  ModalHeader,
  Text,
  TextAlign,
  TextColor,
  TextField,
  TextFieldSize,
  TextVariant,
} from '@metamask/design-system-react';
import { normalizeMoneyReferralCode } from '#shared/lib/money-referral-code';
import { ReferralDialog } from '#ui/components/app/rewards/money-referral/ReferralDialog';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
import type { ReferralLocalizedText } from '../../../../../shared/types/rewards-money';
import { useAnalytics } from '../../../../hooks/useAnalytics';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useGeoRewardsMetadata } from '../../../../hooks/rewards/useGeoRewardsMetadata';
import {
  selectOptinAllowedForGeoError,
  selectOptinAllowedForGeoLoading,
} from '../../../../ducks/rewards/selectors';
import {
  canAcceptMoneyReferralInvite,
  selectMoneyReferralAllowedForGeo,
} from '../../../../ducks/rewards-money/selectors';
import type { MetaMaskReduxState } from '../../../../store/store';
import { useValidateMoneyReferralCode } from '../../../../hooks/rewards/useValidateMoneyReferralCode';
import {
  useAcceptMoneyReferralCode,
  type ReferralRefusalReason,
} from '../../../../hooks/rewards/useAcceptMoneyReferralCode';
import { useReferralMe } from '../../../../hooks/rewards/useReferralMe';
import { REWARDS_MONEY_INVITE_ALLOWED_CAPABILITIES } from '../../../../hooks/rewards/rewards-money-messenger';
import { RouteMessengerProvider } from '../../../../contexts/route-messenger';
import { ReferralActivatedModal } from './ReferralActivatedModal';

const MONEY_REFERRAL_CODE_ERROR_ID = 'money-referral-code-error';

type Translate = (key: string) => string;

/**
 * Invite copy, resolved per key.
 *
 * The server owns this screen's words. A missing title falls back to the
 * localized referral-code label, and a missing body is omitted. The buttons
 * reuse strings the app already has. The code label uses
 * `rewardsMoneyReferralCodeLabel`, the same words as mobile's referral-code
 * string, which extension did not already have.
 *
 * @param localizedText - Server copy, absent when referral me never arrived.
 * @param t - Locale lookup.
 * @returns The words the sheet renders.
 */
function inviteCopy(
  localizedText: ReferralLocalizedText | undefined,
  t: Translate,
) {
  return {
    title: localizedText?.inviteTitle || t('rewardsMoneyReferralCodeLabel'),
    body: localizedText?.inviteMessageBody ?? '',
    codeLabel:
      localizedText?.inviteReferralCode ?? t('rewardsMoneyReferralCodeLabel'),
    decline: localizedText?.inviteDecline ?? t('musdEducationNotNow'),
    accept: localizedText?.inviteAccept ?? t('continue'),
  };
}

const referralCodeInputProps = {
  className: 'px-4 font-medium',
  autoCapitalize: 'characters',
  'data-testid': 'money-referral-code-input',
};

type AcceptInviteSheetProps = {
  initialCode: string;
  onClose: () => void;
};

type ReferralInteraction = 'viewed' | 'accepted' | 'declined' | 'dismissed';

const AcceptInviteSheetContent = ({
  initialCode,
  onClose,
}: AcceptInviteSheetProps) => {
  const titleId = useId();
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
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

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

  const {
    isAccepting,
    isAcceptCoolingDown,
    errorMessage,
    refusalReason,
    clearError,
    accept,
  } = useAcceptMoneyReferralCode({
    validateCode,
    fetchReferralMe,
    onAccepted: handleAccepted,
  });

  const eligibleInvite =
    referralMe !== null && canAcceptMoneyReferralInvite(referralMe);
  const shouldDismissForRole =
    isSettled &&
    referralMe !== null &&
    !eligibleInvite &&
    !hasSeenEligibleInvite;
  const geoSettled = !geoLoading && (geoLocation !== null || geoError);
  const shouldDismissForGeo =
    geoSettled && !acceptAllowedForGeo && !acceptStarted && !isAccepting;
  const failedRead = isSettled && referralMe === null;
  const isOfferOnScreen =
    eligibleInvite && isSettled && geoSettled && !shouldDismissForGeo;
  const showSheet =
    isOfferOnScreen || (failedRead && geoSettled && !shouldDismissForGeo);

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
      const properties: Record<string, string> = {
        // eslint-disable-next-line @typescript-eslint/naming-convention -- analytics property
        interaction_type: interactionType,
      };
      if (code) {
        properties.referral_code = code;
      }
      if (
        refusalReason &&
        (interactionType === 'declined' || interactionType === 'dismissed')
      ) {
        properties.refusal_reason = refusalReason;
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
    [code, createEventBuilder, refusalReason, trackEvent],
  );

  const trackRefused = useCallback(
    (reason: ReferralRefusalReason) => {
      if (!hasTrackedViewRef.current) {
        return;
      }
      const properties: Record<string, string> = {
        // eslint-disable-next-line @typescript-eslint/naming-convention -- analytics property
        interaction_type: 'refused',
        // eslint-disable-next-line @typescript-eslint/naming-convention -- analytics property
        refusal_reason: reason,
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

  useEffect(() => {
    if (!isOfferOnScreen || hasTrackedViewRef.current) {
      return;
    }
    setHasSeenEligibleInvite(true);
    hasTrackedViewRef.current = true;
    trackInteraction('viewed');
  }, [isOfferOnScreen, trackInteraction]);

  useEffect(() => {
    if (shouldDismissForRole) {
      onClose();
    }
  }, [onClose, shouldDismissForRole]);

  useEffect(() => {
    if (!shouldDismissForGeo) {
      return;
    }
    trackResponded('dismissed');
    onClose();
  }, [onClose, shouldDismissForGeo, trackResponded]);

  const handleDecline = useCallback(() => {
    if (isAccepting) {
      return;
    }
    trackResponded('declined');
    onClose();
  }, [isAccepting, onClose, trackResponded]);

  const handleDismiss = useCallback(() => {
    if (isAccepting) {
      return;
    }
    trackResponded('dismissed');
    onClose();
  }, [isAccepting, onClose, trackResponded]);

  const handleAccept = useCallback(() => {
    setAcceptStarted(true);
    setHasSeenEligibleInvite(true);
    accept(code)
      .then((result) => {
        if (!mountedRef.current) {
          return;
        }
        if (result.accepted) {
          trackResponded('accepted');
          return;
        }
        if (result.refusalReason) {
          trackRefused(result.refusalReason);
        }
      })
      .catch(() => undefined);
  }, [accept, code, trackRefused, trackResponded]);

  if (showActivated) {
    return <ReferralActivatedModal referralMe={referralMe} onClose={onClose} />;
  }

  if (!showSheet) {
    return null;
  }

  const copy = inviteCopy(referralMe?.localized_text, (key) => t(key));
  const fieldError =
    errorMessage ||
    (isRejectedCode ? t('rewardsMoneyReferralCodeError') : '') ||
    (isUnknownError ? t('rewardsMoneyReferralCodeUnknownError') : '');
  const canAccept =
    isValid && acceptAllowedForGeo && !isAccepting && !isAcceptCoolingDown;

  return (
    <ReferralDialog
      onClose={handleDismiss}
      data-testid="money-referral-invite"
      aria-labelledby={titleId}
    >
      <ModalHeader
        onClose={handleDismiss}
        closeButtonProps={{ ariaLabel: t('close'), isDisabled: isAccepting }}
      >
        <Text
          asChild
          variant={TextVariant.HeadingSm}
          textAlign={TextAlign.Center}
        >
          <h2 id={titleId}>{copy.title}</h2>
        </Text>
      </ModalHeader>
      <ModalBody>
        <Box flexDirection={BoxFlexDirection.Column} gap={4}>
          {copy.body ? (
            <Text
              variant={TextVariant.BodyMd}
              color={TextColor.TextAlternative}
            >
              {copy.body}
            </Text>
          ) : null}
          <Box flexDirection={BoxFlexDirection.Column} gap={2}>
            <Label
              htmlFor="money-referral-code"
              color={TextColor.TextAlternative}
            >
              {copy.codeLabel}
            </Label>
            <TextField
              id="money-referral-code"
              value={code}
              size={TextFieldSize.Lg}
              isError={Boolean(fieldError)}
              isDisabled={isAccepting}
              className="h-14 w-full"
              onChange={(event) => {
                setCode(normalizeMoneyReferralCode(event.target.value));
                clearError();
              }}
              inputProps={{
                ...referralCodeInputProps,
                'aria-describedby': fieldError
                  ? MONEY_REFERRAL_CODE_ERROR_ID
                  : undefined,
              }}
            />
            {fieldError ? (
              <HelpText severity={HelpTextSeverity.Danger} asChild>
                <span id={MONEY_REFERRAL_CODE_ERROR_ID} role="alert">
                  {fieldError}
                </span>
              </HelpText>
            ) : null}
          </Box>
        </Box>
      </ModalBody>
      <ModalFooter>
        <Box flexDirection={BoxFlexDirection.Column} gap={2} className="w-full">
          <Button
            variant={ButtonVariant.Primary}
            size={ButtonSize.Lg}
            isFullWidth
            isDisabled={!canAccept}
            onClick={handleAccept}
            data-testid="money-referral-accept"
          >
            {copy.accept}
          </Button>
          <Button
            variant={ButtonVariant.Tertiary}
            size={ButtonSize.Lg}
            isFullWidth
            onClick={handleDecline}
            isDisabled={isAccepting}
            className="text-default"
            data-testid="money-referral-decline"
          >
            {copy.decline}
          </Button>
        </Box>
      </ModalFooter>
    </ReferralDialog>
  );
};

/**
 * Invite modal opened from `/home?ref=`. Copy comes from referral me.
 * Closes itself when the account is already a referrer or referee, or the
 * country is excluded. A cashback-experiment member can still accept.
 * A failed referral-me read leaves the sheet up. Reports one MetaMetrics
 * response, plus a `refused` event that does not lock that response.
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
