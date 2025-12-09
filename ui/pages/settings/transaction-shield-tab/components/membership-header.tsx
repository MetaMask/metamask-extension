import React, { useMemo } from 'react';
import {
  Box,
  BoxAlignItems,
  BoxJustifyContent,
  FontWeight,
  Text,
  TextVariant,
} from '@metamask/design-system-react';
import classnames from 'classnames';
import { ThemeType } from '../../../../../shared/constants/preferences';
import { useTheme } from '../../../../hooks/useTheme';
import { Skeleton } from '../../../../components/component-library/skeleton';
import {
  BackgroundColor,
  BorderRadius,
  BorderStyle,
  TextColor as DSTextColor,
  TextVariant as DSTextVariant,
} from '../../../../helpers/constants/design-system';
import { Tag } from '../../../../components/component-library';
import ShieldBannerAnimation from '../shield-banner-animation';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { getShortDateFormatterV2 } from '../../../asset/util';

type MembershipHeaderProps = {
  showSkeletonLoader: boolean;
  isCancelled: boolean;
  isTrialing: boolean;
  isPaused: boolean;
  customerId?: string;
  startDate?: string;
  endDate?: string;
  trialDaysLeft?: string;
  cancelledDate?: string;
  className?: string;
};

const MembershipHeader = ({
  showSkeletonLoader,
  isCancelled,
  isTrialing,
  isPaused,
  customerId,
  startDate,
  endDate,
  trialDaysLeft,
  cancelledDate,
  className,
}: MembershipHeaderProps) => {
  const t = useI18nContext();
  const theme = useTheme();
  const isLightTheme = theme === ThemeType.light;

  const isInactive = isCancelled || isPaused;

  const membershipPeriod = useMemo(() => {
    if (!startDate || !endDate) {
      return '';
    }
    const startDateFormatted = getShortDateFormatterV2().format(
      new Date(startDate),
    );
    const endDateFormatted = getShortDateFormatterV2().format(
      new Date(endDate),
    );
    return `${startDateFormatted} - ${endDateFormatted}`;
  }, [startDate, endDate]);

  const trialDaysLeftText = useMemo(() => {
    if (!isTrialing || !trialDaysLeft) {
      return '';
    }
    return t('shieldTxMembershipFreeTrialDaysLeft', [trialDaysLeft]);
  }, [isTrialing, t, trialDaysLeft]);

  const cancelledText = useMemo(() => {
    if (!isCancelled || !cancelledDate) {
      return '';
    }
    return t('shieldTxMembershipCancelledDate', [
      getShortDateFormatterV2().format(new Date(cancelledDate)),
    ]);
  }, [isCancelled, t, cancelledDate]);

  const membershipDetailsText = useMemo(() => {
    if (isCancelled) {
      return cancelledText;
    }
    if (isTrialing) {
      return trialDaysLeftText;
    }
    return membershipPeriod;
  }, [isCancelled, cancelledText, membershipPeriod, trialDaysLeftText]);

  return (
    <Box
      data-theme={isInactive ? theme : ThemeType.dark}
      className={classnames(
        'transaction-shield-page__row transaction-shield-page__membership flex py-4 pl-4 pr-2',
        {
          'transaction-shield-page__membership--loading': showSkeletonLoader,
          'transaction-shield-page__membership--inactive':
            isInactive && !showSkeletonLoader,
          'transaction-shield-page__membership--active':
            !isInactive && !showSkeletonLoader,
          'transaction-shield-page__membership--inactive-light':
            isLightTheme && isInactive && !showSkeletonLoader,
        },
        className ?? '',
      )}
      alignItems={BoxAlignItems.Center}
      justifyContent={BoxJustifyContent.Between}
    >
      <Box className="flex flex-col justify-between w-full h-full">
        <Box className="flex flex-col" gap={showSkeletonLoader ? 2 : 0}>
          {showSkeletonLoader ? (
            <Skeleton className="w-2/3 h-5" />
          ) : (
            <Box className="flex items-center gap-3">
              <Text
                variant={TextVariant.HeadingSm}
                fontWeight={FontWeight.Medium}
                className="transaction-shield-page__membership-text"
                data-testid="shield-detail-membership-status"
              >
                {isInactive
                  ? t('shieldTxMembershipInactive')
                  : t('shieldTxMembershipActive')}
              </Text>
              {isTrialing && (
                <Tag
                  label={t('shieldTxMembershipFreeTrial')}
                  labelProps={{
                    variant: DSTextVariant.bodySmMedium,
                    color: DSTextColor.successDefault,
                  }}
                  borderStyle={BorderStyle.none}
                  borderRadius={BorderRadius.SM}
                  backgroundColor={BackgroundColor.successMuted}
                  data-testid="shield-detail-trial-tag"
                />
              )}
              {isPaused && (
                <Tag
                  label={t('shieldTxMembershipPaused')}
                  labelProps={{
                    variant: DSTextVariant.bodySmMedium,
                    color: DSTextColor.textAlternative,
                  }}
                  borderStyle={BorderStyle.none}
                  borderRadius={BorderRadius.SM}
                  backgroundColor={BackgroundColor.backgroundMuted}
                  data-testid="shield-detail-paused-tag"
                />
              )}
            </Box>
          )}
          {showSkeletonLoader ? (
            <Skeleton width="60%" height={16} />
          ) : (
            <Text
              variant={TextVariant.BodyXs}
              className="transaction-shield-page__membership-text"
              data-testid="shield-detail-note"
            >
              {membershipDetailsText}
            </Text>
          )}
        </Box>
        <Box>
          {showSkeletonLoader ? (
            <Skeleton width="60%" height={16} />
          ) : (
            <Text
              variant={TextVariant.BodyXs}
              className="transaction-shield-page__membership-text"
              data-testid="shield-detail-customer-id"
            >
              {t('shieldTxMembershipId')}: {customerId || ''}
            </Text>
          )}
        </Box>
      </Box>
      {!showSkeletonLoader && (
        <ShieldBannerAnimation
          containerClassName="transaction-shield-page-shield-banner__container"
          canvasClassName="transaction-shield-page-shield-banner__canvas"
          isInactive={isInactive}
        />
      )}
    </Box>
  );
};

export default MembershipHeader;
