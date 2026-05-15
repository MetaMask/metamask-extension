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
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Claim, ClaimDraft } from '@metamask/claims-controller';
import LoadingScreen from '../../../../components/ui/loading-screen';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useClaims } from '../../../../contexts/claims/claims';
import { TRANSACTION_SHIELD_CLAIM_ROUTES } from '../../../../helpers/constants/routes';
import { Tab, Tabs } from '../../../../components/ui/tabs';
import { getShortDateFormatterV2 } from '../../../asset/util';
import { ThemeType } from '../../../../../shared/constants/preferences';
import { useTheme } from '../../../../hooks/useTheme';
import { CLAIMS_TAB_KEYS, ClaimsTabKey } from '../types';
import { useClaimDraft } from '../../../../hooks/shield/useClaimDraft';
import { MAX_DRAFT_CLAIMS, MAX_PENDING_CLAIMS } from '../claims-form/constants';

const ClaimsList = () => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const theme = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const { pendingClaims, completedClaims, rejectedClaims, isLoading } =
    useClaims();
  const { drafts } = useClaimDraft();

  const [activeTab, setActiveTab] = useState(() => {
    const tabParam = searchParams.get('tab');
    if (
      tabParam === CLAIMS_TAB_KEYS.PENDING ||
      tabParam === CLAIMS_TAB_KEYS.HISTORY
    ) {
      return tabParam;
    }
    return CLAIMS_TAB_KEYS.PENDING;
  });

  // Clear the tab param from the URL after reading it
  useEffect(() => {
    if (searchParams.has('tab')) {
      searchParams.delete('tab');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const claimItem = useCallback(
    (claimData: Claim | ClaimDraft, tabKey: ClaimsTabKey, isDraft = false) => {
      let formattedDate = '';

      if (isDraft) {
        const updatedAt = (claimData as ClaimDraft).updatedAt ?? null;
        if (updatedAt) {
          formattedDate = t('shieldClaimsLastEdited', [
            getShortDateFormatterV2().format(new Date(updatedAt)),
          ]);
        }
      } else {
        formattedDate = getShortDateFormatterV2().format(
          new Date((claimData as Claim).createdAt),
        );
      }

      const id = isDraft
        ? (claimData as ClaimDraft).draftId
        : (claimData as Claim).id;

      const displayId = isDraft
        ? (claimData as ClaimDraft).draftId
        : (claimData as Claim).shortId;
      return (
        <Box
          asChild
          key={id}
          data-testid={`claim-item-${id}`}
          backgroundColor={BoxBackgroundColor.BackgroundSection}
          className="claim-item flex items-center justify-between w-full p-4 rounded-lg"
          onClick={() => {
            if (isDraft) {
              navigate(
                `${TRANSACTION_SHIELD_CLAIM_ROUTES.EDIT_DRAFT.FULL}/${id}`,
              );
            } else {
              const viewRoute =
                tabKey === CLAIMS_TAB_KEYS.PENDING
                  ? TRANSACTION_SHIELD_CLAIM_ROUTES.VIEW_PENDING.FULL
                  : TRANSACTION_SHIELD_CLAIM_ROUTES.VIEW_HISTORY.FULL;
              navigate(`${viewRoute}/${id}`);
            }
          }}
        >
          <button>
            <Box>
              <Text
                variant={TextVariant.BodyMd}
                fontWeight={FontWeight.Medium}
                textAlign={TextAlign.Left}
              >
                {t('shieldClaimsNumber', [displayId])}
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

  const claimsGroup = useCallback(
    (groupDetails: {
      title: string;
      claims: Claim[] | ClaimDraft[];
      tabKey: ClaimsTabKey;
      isDraft?: boolean;
    }) => {
      return (
        <Box>
          <Text
            variant={TextVariant.HeadingSm}
            fontWeight={FontWeight.Medium}
            className="mb-3"
            data-testid={
              groupDetails.isDraft ? 'claims-group-drafts-heading' : undefined
            }
          >
            {groupDetails.title}
          </Text>
          <Box
            className="flex flex-col gap-2"
            data-testid={
              groupDetails.isDraft ? 'claims-group-drafts-list' : undefined
            }
          >
            {groupDetails.claims.map((claim) =>
              claimItem(
                claim,
                groupDetails.tabKey,
                groupDetails.isDraft ?? false,
              ),
            )}
          </Box>
        </Box>
      );
    },
    [claimItem],
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
      activeTab={activeTab}
      onTabClick={setActiveTab}
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
        {pendingClaims.length > 0 || drafts.length > 0 ? (
          <Box className="h-full flex flex-col justify-between">
            <Box className="flex-1 overflow-y-auto">
              <Box padding={4} className="flex flex-col gap-4">
                {/* Active claims */}
                {pendingClaims.length > 0 &&
                  claimsGroup({
                    title: t('shieldClaimGroupActive'),
                    claims: pendingClaims,
                    tabKey: CLAIMS_TAB_KEYS.PENDING,
                  })}
                {/* Draft claims */}
                {drafts.length > 0 &&
                  claimsGroup({
                    title: t('shieldClaimGroupDrafts'),
                    claims: drafts,
                    tabKey: CLAIMS_TAB_KEYS.PENDING,
                    isDraft: true,
                  })}
                <Text
                  variant={TextVariant.BodySm}
                  color={TextColor.TextAlternative}
                >
                  {t('shieldClaimGroupActiveNote', [
                    MAX_DRAFT_CLAIMS,
                    MAX_PENDING_CLAIMS,
                  ])}
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
            {completedClaims.length > 0 &&
              claimsGroup({
                title: t('shieldClaimGroupCompleted'),
                claims: completedClaims,
                tabKey: CLAIMS_TAB_KEYS.HISTORY,
              })}
            {/* Rejected claims */}
            {rejectedClaims.length > 0 &&
              claimsGroup({
                title: t('shieldClaimGroupRejected'),
                claims: rejectedClaims,
                tabKey: CLAIMS_TAB_KEYS.HISTORY,
              })}
          </Box>
        ) : (
          emptyClaimsView(CLAIMS_TAB_KEYS.HISTORY)
        )}
      </Tab>
    </Tabs>
  );
};

export default ClaimsList;
