import React, { useCallback, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Box,
  BoxFlexDirection,
  Button,
  ButtonIcon,
  ButtonSize,
  ButtonVariant,
  FontWeight,
  IconName,
  Skeleton,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { DEFAULT_ROUTE, PREVIOUS_ROUTE } from '../../helpers/constants/routes';
import { useI18nContext } from '../../hooks/useI18nContext';
import { useMoneyAccountAvailability } from '../../hooks/money/use-money-account-availability';
import { useMoneyActivityItems } from '../../hooks/money/use-money-activity-items';
import { getPrivacyMode } from '../../selectors/selectors';
import { MoneyActivityRow } from './components/money-activity-row';
import { MoneyActivityFilter } from './utils/money-activity-filters';
import { groupMoneyActivityItems } from './utils/group-money-activity';

const FILTERS: {
  id: MoneyActivityFilter;
  labelKey: string;
  testId: string;
}[] = [
  {
    id: MoneyActivityFilter.All,
    labelKey: 'moneyActivityFilterAll',
    testId: 'money-activity-filter-all',
  },
  {
    id: MoneyActivityFilter.Deposits,
    labelKey: 'moneyActivityFilterDeposits',
    testId: 'money-activity-filter-deposits',
  },
  {
    id: MoneyActivityFilter.Transfers,
    labelKey: 'moneyActivityFilterSends',
    testId: 'money-activity-filter-sends',
  },
];

export function MoneyActivityPage() {
  const t = useI18nContext();
  const navigate = useNavigate();
  const privacyMode = useSelector(getPrivacyMode);
  const { availability, isLoading: isAvailabilityLoading } =
    useMoneyAccountAvailability();
  const { buckets } = useMoneyActivityItems();
  const [filter, setFilter] = useState(MoneyActivityFilter.All);

  const filteredItems = buckets[filter];
  const sections = useMemo(
    () => groupMoneyActivityItems(filteredItems, t('moneyActivityPending')),
    [filteredItems, t],
  );

  const handleBack = useCallback(() => {
    navigate(PREVIOUS_ROUTE);
  }, [navigate]);

  if (isAvailabilityLoading) {
    return (
      <div
        className="flex min-h-full flex-col gap-4 bg-background-default p-4"
        data-testid="money-activity-loading"
      >
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }

  if (!availability.isAvailable) {
    return <Navigate to={DEFAULT_ROUTE} replace />;
  }

  return (
    <main
      className="min-h-full bg-background-default pb-5"
      data-testid="money-activity-page"
    >
      <div className="flex items-center px-2 py-2">
        <ButtonIcon
          iconName={IconName.ArrowLeft}
          ariaLabel={t('back')}
          onClick={handleBack}
          data-testid="money-activity-back-button"
        />
      </div>

      <Box paddingLeft={4} paddingRight={4} paddingTop={2} paddingBottom={4}>
        <Text
          variant={TextVariant.HeadingLg}
          fontWeight={FontWeight.Bold}
          data-testid="money-activity-title"
        >
          {t('moneyActivity')}
        </Text>
      </Box>

      <Box
        flexDirection={BoxFlexDirection.Row}
        gap={2}
        paddingLeft={4}
        paddingRight={4}
        paddingBottom={3}
        className="flex-wrap"
      >
        {FILTERS.map((chip) => {
          const isActive = chip.id === filter;
          return (
            <Button
              key={chip.id}
              variant={
                isActive ? ButtonVariant.Primary : ButtonVariant.Secondary
              }
              size={ButtonSize.Md}
              aria-pressed={isActive}
              onClick={() => setFilter(chip.id)}
              data-testid={chip.testId}
            >
              {t(chip.labelKey)}
            </Button>
          );
        })}
      </Box>

      {filteredItems.length === 0 ? (
        <Box paddingLeft={4} paddingRight={4} paddingTop={8}>
          <Text
            variant={TextVariant.BodyMd}
            color={TextColor.TextAlternative}
            data-testid="money-activity-empty"
          >
            {t('moneyActivityEmpty')}
          </Text>
        </Box>
      ) : (
        sections.map((section) => (
          <section key={section.isPending ? 'pending' : section.title}>
            <Box
              paddingLeft={4}
              paddingRight={4}
              paddingTop={2}
              paddingBottom={1}
            >
              <Text
                variant={TextVariant.BodyMd}
                fontWeight={FontWeight.Medium}
                color={TextColor.TextAlternative}
                data-testid={
                  section.isPending
                    ? 'money-activity-pending-header'
                    : 'money-activity-date-header'
                }
              >
                {section.title}
              </Text>
            </Box>
            {section.data.map((item) => (
              <MoneyActivityRow
                key={item.id}
                item={item}
                privacyMode={privacyMode}
              />
            ))}
          </section>
        ))
      )}
    </main>
  );
}

export default MoneyActivityPage;
