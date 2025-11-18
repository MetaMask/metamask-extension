import React, { useCallback, useMemo } from 'react';
import {
  Box,
  BoxBackgroundColor,
  Text,
  TextColor as DsTextColor,
  TextVariant,
  Icon,
  IconName,
  IconSize,
  IconColor,
  TextAlign,
  Button,
  ButtonSize,
} from '@metamask/design-system-react';
import { useNavigate } from 'react-router-dom-v5-compat';
import { Claim, ClaimStatusEnum } from '@metamask/claims-controller';
import { useSelector } from 'react-redux';
import LoadingScreen from '../../../../components/ui/loading-screen';
import {
  BannerAlertSeverity,
  BannerAlert,
  Tag,
} from '../../../../components/component-library';
import {
  BackgroundColor,
  BorderRadius,
  BorderStyle,
  TextColor,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useClaims } from '../../../../contexts/claims/claims';
import { TRANSACTION_SHIELD_CLAIM_ROUTES } from '../../../../helpers/constants/routes';
import { getLatestShieldSubscription } from '../../../../selectors/subscription';

const CLAIM_STATUS_MAP: Record<
  ClaimStatusEnum,
  { label: string; backgroundColor: BackgroundColor; textColor: TextColor }
> = {
  [ClaimStatusEnum.CREATED]: {
    label: 'shieldClaimStatusCreated',
    backgroundColor: BackgroundColor.warningMuted,
    textColor: TextColor.warningDefault,
  },
  [ClaimStatusEnum.SUBMITTED]: {
    label: 'shieldClaimStatusSubmitted',
    backgroundColor: BackgroundColor.warningMuted,
    textColor: TextColor.warningDefault,
  },
  [ClaimStatusEnum.IN_PROGRESS]: {
    label: 'shieldClaimStatusInProgress',
    backgroundColor: BackgroundColor.warningMuted,
    textColor: TextColor.warningDefault,
  },
  [ClaimStatusEnum.WAITING_FOR_CUSTOMER]: {
    label: 'shieldClaimStatusWaitingForCustomer',
    backgroundColor: BackgroundColor.warningMuted,
    textColor: TextColor.warningDefault,
  },
  [ClaimStatusEnum.APPROVED]: {
    label: 'shieldClaimStatusApproved',
    backgroundColor: BackgroundColor.successMuted,
    textColor: TextColor.successDefault,
  },
  [ClaimStatusEnum.REJECTED]: {
    label: 'shieldClaimStatusRejected',
    backgroundColor: BackgroundColor.errorMuted,
    textColor: TextColor.errorDefault,
  },
  [ClaimStatusEnum.UNKNOWN]: {
    label: 'shieldClaimStatusUnknown',
    backgroundColor: BackgroundColor.warningMuted,
    textColor: TextColor.warningDefault,
  },
};

const ClaimsList = () => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const { pendingClaims, historyClaims, isLoading } = useClaims();
  const latestShieldSubscription = useSelector(getLatestShieldSubscription);
  const isShieldSubscriptionEligibleForSupport = useMemo(() => {
    return latestShieldSubscription?.isEligibleForSupport ?? false;
  }, [latestShieldSubscription]);

  const handleSubmitClaim = useCallback(() => {
    navigate(TRANSACTION_SHIELD_CLAIM_ROUTES.NEW.FULL);
  }, [navigate]);

  const claimItem = useCallback(
    (claim: Claim) => {
      // add leading zero to claim number if it is less than 1000
      const claimNumber = claim.shortId.toString().padStart(3, '0');
      return (
        <Box
          asChild
          key={claim.id}
          data-testid={`claim-item-${claim.id}`}
          backgroundColor={BoxBackgroundColor.BackgroundSection}
          className="claim-item flex items-center justify-between w-full p-4 rounded-lg"
          onClick={() => {
            navigate(
              `${TRANSACTION_SHIELD_CLAIM_ROUTES.VIEW.FULL}/${claim.id}`,
            );
          }}
        >
          <button>
            <Box className="flex items-center gap-2">
              <Text variant={TextVariant.BodyMd} textAlign={TextAlign.Left}>
                {t('shieldClaimsNumber', [claimNumber])}
              </Text>
              {claim.status && (
                <Tag
                  borderStyle={BorderStyle.none}
                  borderRadius={BorderRadius.SM}
                  label={t(CLAIM_STATUS_MAP[claim.status].label)}
                  backgroundColor={
                    CLAIM_STATUS_MAP[claim.status].backgroundColor
                  }
                  labelProps={{
                    color: CLAIM_STATUS_MAP[claim.status]?.textColor,
                  }}
                />
              )}
            </Box>

            <Box className="flex items-center gap-2">
              <Text
                variant={TextVariant.BodyMd}
                color={DsTextColor.TextAlternative}
              >
                {t('viewDetails')}
              </Text>
              <Icon
                name={IconName.ArrowRight}
                size={IconSize.Md}
                color={IconColor.IconAlternative}
              />
            </Box>
          </button>
        </Box>
      );
    },
    [navigate, t],
  );

  return (
    <Box className="claims-list-page w-full" data-testid="claims-list-page">
      {isShieldSubscriptionEligibleForSupport && (
        <Box className="p-4">
          <Button
            data-testid="submit-claim-button"
            size={ButtonSize.Lg}
            onClick={handleSubmitClaim}
            className="w-full"
          >
            {t('shieldTxMembershipSubmitCase')}
          </Button>
        </Box>
      )}
      {pendingClaims.length > 0 && (
        <Box className="pt-4 px-4 pb-0">
          <Text
            className="mb-2 uppercase"
            variant={TextVariant.BodyMd}
            color={DsTextColor.TextAlternative}
          >
            {t('shieldClaimsPendingTitle')}
          </Text>
          {pendingClaims.length > 0 && (
            <BannerAlert
              severity={BannerAlertSeverity.Info}
              title={t('shieldClaimsPendingAlertTitle')}
              description={t('shieldClaimsPendingAlertDescription')}
              className="mb-2"
            />
          )}
          <Box className="flex flex-col gap-2">
            {pendingClaims.map((claim) => claimItem(claim))}
          </Box>
        </Box>
      )}
      {historyClaims.length > 0 && (
        <Box className="pt-4 px-4 pb-0">
          <Text
            className="mb-2 uppercase"
            variant={TextVariant.BodyMd}
            color={DsTextColor.TextAlternative}
          >
            {t('shieldClaimsHistoryTitle')}
          </Text>
          <Box className="flex flex-col gap-2">
            {historyClaims.map((claim) => claimItem(claim))}
          </Box>
        </Box>
      )}
      {isLoading && <LoadingScreen />}
    </Box>
  );
};

export default ClaimsList;
