import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  BoxBackgroundColor,
  Text,
  TextVariant,
  IconName,
  IconSize,
  IconColor,
  TextAlign,
  FontWeight,
  TextColor,
  ButtonSize,
  ButtonVariant,
  Button,
  Icon,
} from '@metamask/design-system-react';
import { useNavigate, useSearchParams } from 'react-router-dom-v5-compat';
import { Claim } from '@metamask/claims-controller';
import LoadingScreen from '../../../../components/ui/loading-screen';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useClaims } from '../../../../contexts/claims/claims';
import { TRANSACTION_SHIELD_CLAIM_ROUTES } from '../../../../helpers/constants/routes';
import { Tab, Tabs } from '../../../../components/ui/tabs';
import { getShortDateFormatterV2 } from '../../../asset/util';
import { ThemeType } from '../../../../../shared/constants/preferences';
import { useTheme } from '../../../../hooks/useTheme';
import { CLAIMS_TAB_KEYS, ClaimsTabKey } from '../types';

const MAX_PENDING_CLAIMS = 3;

const ClaimsList = () => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const theme = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const { pendingClaims, completedClaims, rejectedClaims, isLoading } =
    useClaims();

  const [defaultTab] = useState(() => {
    const tabParam = searchParams.get('tab');
    if (
      tabParam === CLAIMS_TAB_KEYS.PENDING ||
      tabParam === CLAIMS_TAB_KEYS.HISTORY
    ) {
      return tabParam;
    }
    return undefined;
  });

  // Clear the tab param from the URL after reading it
  useEffect(() => {
    if (searchParams.has('tab')) {
      searchParams.delete('tab');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const claimItem = useCallback(
    (claim: Claim, tabKey: ClaimsTabKey) => {
      const formattedDate = getShortDateFormatterV2().format(
        new Date(claim.createdAt),
      );
      return (
        <Box
          asChild
          key={claim.id}
          data-testid={`claim-item-${claim.id}`}
          backgroundColor={BoxBackgroundColor.BackgroundSection}
          className="claim-item flex items-center justify-between w-full p-4 rounded-lg"
          onClick={() => {
            const viewRoute =
              tabKey === CLAIMS_TAB_KEYS.PENDING
                ? TRANSACTION_SHIELD_CLAIM_ROUTES.VIEW_PENDING.FULL
                : TRANSACTION_SHIELD_CLAIM_ROUTES.VIEW_HISTORY.FULL;
            navigate(`${viewRoute}/${claim.id}`);
          }}
        >
          <button>
            <Box>
              <Text
                variant={TextVariant.BodyMd}
                fontWeight={FontWeight.Medium}
                textAlign={TextAlign.Left}
              >
                {t('shieldClaimsNumber', [claim.shortId])}
              </Text>
              <Text
                variant={TextVariant.BodySm}
                textAlign={TextAlign.Left}
                color={TextColor.TextAlternative}
              >
                {formattedDate}
              </Text>
            </Box>

            <Icon
              name={IconName.ArrowRight}
              size={IconSize.Md}
              color={IconColor.IconDefault}
            />
          </button>
        </Box>
      );
    },
    [navigate, t],
  );

  const emptyClaimsView = useCallback(
    (tabKey: ClaimsTabKey) => {
      const activityIcon =
        theme === ThemeType.dark
          ? './images/empty-state-activity-dark.png'
          : './images/empty-state-activity-light.png';

      return (
        <Box className="h-full flex justify-center items-center">
          <Box className="text-center">
            <img
              src={activityIcon}
              alt={t('activity')}
              className="mb-2 mx-auto"
              width={72}
              height={72}
            />
            <Text
              variant={TextVariant.HeadingSm}
              color={TextColor.TextAlternative}
              className="mb-2"
            >
              {tabKey === CLAIMS_TAB_KEYS.PENDING
                ? t('shieldClaimGroupNoOpenClaims')
                : t('shieldClaimGroupNoCompletedClaims')}
            </Text>
            <Text
              variant={TextVariant.BodyMd}
              color={TextColor.TextAlternative}
              className="mb-4"
            >
              {tabKey === CLAIMS_TAB_KEYS.PENDING
                ? t('shieldClaimGroupNoOpenClaimsDescription')
                : t('shieldClaimGroupNoCompletedClaimsDescription')}
            </Text>
            {tabKey === CLAIMS_TAB_KEYS.PENDING && (
              <Button
                data-testid="claims-list-empty-new-claim-button"
                variant={ButtonVariant.Secondary}
                size={ButtonSize.Lg}
                onClick={() => {
                  navigate(TRANSACTION_SHIELD_CLAIM_ROUTES.NEW.FULL);
                }}
              >
                {t('shieldClaimSubmit')}
              </Button>
            )}
          </Box>
        </Box>
      );
    },
    [navigate, t, theme],
  );

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Tabs
      data-testid="claims-list-page"
      defaultActiveTabKey={defaultTab}
      className="h-full flex flex-col overflow-y-hidden"
      tabListProps={{
        className: 'px-4',
      }}
      tabContentProps={{
        className: 'flex-1 overflow-y-hidden',
      }}
    >
      <Tab
        name={t('shieldClaimsTabPending')}
        className="flex-1 px-4 py-2"
        tabKey="pending"
      >
        {pendingClaims.length > 0 ? (
          <Box className="h-full flex flex-col justify-between">
            <Box className="flex-1 overflow-y-auto">
              <Box padding={4} className="flex flex-col gap-4">
                {/* Active claims */}
                <Box>
                  <Text
                    variant={TextVariant.HeadingSm}
                    fontWeight={FontWeight.Medium}
                    className="mb-3"
                  >
                    {t('shieldClaimGroupActive')}
                  </Text>
                  <Box className="flex flex-col gap-2">
                    {pendingClaims.map((claim) =>
                      claimItem(claim, CLAIMS_TAB_KEYS.PENDING),
                    )}
                  </Box>
                </Box>
                <Text
                  variant={TextVariant.BodySm}
                  color={TextColor.TextAlternative}
                >
                  {t('shieldClaimGroupActiveNote', [MAX_PENDING_CLAIMS])}
                </Text>
              </Box>
            </Box>
            <Box className="p-4">
              <Button
                data-testid="claims-list-submit-claim-button"
                className="w-full"
                variant={ButtonVariant.Primary}
                size={ButtonSize.Lg}
                disabled={pendingClaims.length >= MAX_PENDING_CLAIMS}
                onClick={() => {
                  navigate(TRANSACTION_SHIELD_CLAIM_ROUTES.NEW.FULL);
                }}
              >
                {t('shieldClaimSubmit')}
              </Button>
            </Box>
          </Box>
        ) : (
          emptyClaimsView(CLAIMS_TAB_KEYS.PENDING)
        )}
      </Tab>
      <Tab
        name={t('shieldClaimsTabHistory')}
        className="flex-1 px-4 py-2"
        tabKey="history"
      >
        {completedClaims.length > 0 || rejectedClaims.length > 0 ? (
          <Box padding={4} className="flex flex-col gap-4">
            {/* Completed claims */}
            {completedClaims.length > 0 && (
              <Box>
                <Text
                  variant={TextVariant.HeadingSm}
                  fontWeight={FontWeight.Medium}
                  className="mb-3"
                >
                  {t('shieldClaimGroupCompleted')}
                </Text>
                <Box className="flex flex-col gap-2">
                  {completedClaims.map((claim) =>
                    claimItem(claim, CLAIMS_TAB_KEYS.HISTORY),
                  )}
                </Box>
              </Box>
            )}
            {/* Rejected claims */}
            {rejectedClaims.length > 0 && (
              <Box>
                <Text
                  variant={TextVariant.HeadingSm}
                  fontWeight={FontWeight.Medium}
                  className="mb-3"
                >
                  {t('shieldClaimGroupRejected')}
                </Text>
                <Box className="flex flex-col gap-2">
                  {rejectedClaims.map((claim) =>
                    claimItem(claim, CLAIMS_TAB_KEYS.HISTORY),
                  )}
                </Box>
              </Box>
            )}
          </Box>
        ) : (
          emptyClaimsView(CLAIMS_TAB_KEYS.HISTORY)
        )}
      </Tab>
    </Tabs>
  );
};

export default ClaimsList;
