import React from 'react';
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
} from '@metamask/design-system-react';
import { useNavigate } from 'react-router-dom-v5-compat';
import { Tag } from '../../../../components/component-library';
import {
  BackgroundColor,
  BorderRadius,
  BorderStyle,
  TextColor,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useClaims } from '../../../../contexts/claims/claims';
import { CLAIM_STATUS, ClaimStatus } from '../types';
import { TRANSACTION_SHIELD_CLAIM_ROUTES } from '../../../../helpers/constants/routes';

const ClaimsList = () => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const { pendingClaims, historyClaims, isLoading, error } = useClaims();

  const claimItem = (claimId: string, status?: ClaimStatus) => {
    return (
      <Box
        asChild
        key={claimId}
        data-testid={`claim-item-${claimId}`}
        backgroundColor={BoxBackgroundColor.BackgroundSection}
        className="claim-item flex items-center justify-between w-full p-4 rounded-lg"
        onClick={() => {
          navigate(`${TRANSACTION_SHIELD_CLAIM_ROUTES.VIEW.FULL}/${claimId}`);
        }}
      >
        <button>
          <Box className="flex items-center gap-2">
            <Text variant={TextVariant.BodyMd}>Claim #{claimId}</Text>
            {status && (
              <Tag
                borderStyle={BorderStyle.none}
                borderRadius={BorderRadius.SM}
                label={
                  status === CLAIM_STATUS.COMPLETED
                    ? t('completed')
                    : t('rejected')
                }
                backgroundColor={
                  status === CLAIM_STATUS.COMPLETED
                    ? BackgroundColor.successMuted
                    : BackgroundColor.errorMuted
                }
                labelProps={{
                  color:
                    status === CLAIM_STATUS.COMPLETED
                      ? TextColor.successDefault
                      : TextColor.errorDefault,
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
  };

  // Handle loading state
  if (isLoading) {
    return (
      <Box
        className="claims-list-page flex items-center justify-center w-full p-4"
        data-testid="claims-list-page"
      >
        <Text variant={TextVariant.BodyMd}>{t('loading')}</Text>
      </Box>
    );
  }

  // Handle error state
  if (error) {
    return (
      <Box
        className="claims-list-page flex items-center justify-center w-full p-4"
        data-testid="claims-list-page"
      >
        <Text variant={TextVariant.BodyMd} color={DsTextColor.ErrorDefault}>
          {t('errorLoadingClaims')}
        </Text>
      </Box>
    );
  }

  return (
    <Box className="claims-list-page w-full" data-testid="claims-list-page">
      {pendingClaims.length > 0 && (
        <Box className="pt-4 px-4 pb-0">
          <Text
            className="mb-2 uppercase"
            variant={TextVariant.BodyMd}
            color={DsTextColor.TextAlternative}
          >
            {t('shieldClaimsPendingTitle')}
          </Text>
          <Box className="flex flex-col gap-2">
            {pendingClaims.map((claim) => claimItem(claim.id, claim.status))}
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
            {historyClaims.map((claim) => claimItem(claim.id, claim.status))}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default ClaimsList;
