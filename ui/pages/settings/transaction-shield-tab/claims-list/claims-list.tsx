import React, { useMemo } from 'react';
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
import { useAsyncResult } from '../../../../hooks/useAsync';
import { getShieldClaims } from '../../../../store/actions';
import { ShieldClaim, CLAIM_STATUS, ClaimStatus } from '../types';
import { TRANSACTION_SHIELD_CLAIM_VIEW_ROUTE } from '../../../../helpers/constants/routes';

const ClaimsList = () => {
  const t = useI18nContext();
  const navigate = useNavigate();

  const claimsResult = useAsyncResult<ShieldClaim[]>(
    () => getShieldClaims(),
    [],
  );

  const pendingClaims = useMemo(() => {
    return (
      claimsResult.value?.filter(
        (claim) => claim.status === CLAIM_STATUS.PENDING,
      ) ?? []
    );
  }, [claimsResult.value]);

  const historyClaims = useMemo(() => {
    return (
      claimsResult.value?.filter(
        (claim) => claim.status !== CLAIM_STATUS.PENDING,
      ) ?? []
    );
  }, [claimsResult.value]);

  const claimItem = (intercomId: string, status?: ClaimStatus) => {
    return (
      <Box
        asChild
        key={intercomId}
        data-testid={`claim-item-${intercomId}`}
        backgroundColor={BoxBackgroundColor.BackgroundSection}
        className="claim-item flex items-center justify-between w-full p-4 rounded-lg"
        onClick={() => {
          navigate(`${TRANSACTION_SHIELD_CLAIM_VIEW_ROUTE}/${intercomId}`);
        }}
      >
        <button>
          <Box className="flex items-center gap-2">
            <Text variant={TextVariant.BodyMd}>Claim #{intercomId}</Text>
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
  if (claimsResult.status === 'pending') {
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
  if (claimsResult.status === 'error') {
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
            {pendingClaims.map((claim) =>
              claimItem(claim.intercomId, claim.status),
            )}
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
            {historyClaims.map((claim) =>
              claimItem(claim.intercomId, claim.status),
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default ClaimsList;
