import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Button,
  ButtonIcon,
  ButtonVariant,
  FontWeight,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Skeleton,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import { useI18nContext } from '../../hooks/useI18nContext';
import { useMoneyAccountAvailability } from '../../hooks/money/use-money-account-availability';
import { useMoneyAccountBalance } from '../../hooks/money/use-money-account-balance';
import { useMoneyDepositTokens } from '../../hooks/money/use-money-deposit-tokens';
import { useMoneyVaultApy } from '../../hooks/money/use-money-vault-apy';
import { getPrivacyMode } from '../../selectors/selectors';
import { MoneyActivityPlaceholder } from './components/money-activity-placeholder';
import { MoneyPotentialEarnings } from './components/money-potential-earnings';

const MONEY_ONBOARDING_ARTWORK = './images/money-onboarding-stepper-step-1.png';

type ActionCardProps = {
  icon: IconName;
  label: string;
};

const MoneyActionCard = ({ icon, label }: ActionCardProps) => {
  return (
    <button
      type="button"
      disabled
      className="flex h-[76px] flex-1 flex-col items-center justify-center gap-0.5 rounded-xl bg-background-muted disabled:cursor-default disabled:opacity-100"
    >
      <Icon name={icon} size={IconSize.Lg} color={IconColor.IconDefault} />
      <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium}>
        {label}
      </Text>
    </button>
  );
};

const MoneySectionDivider = () => {
  return <div className="my-5 h-px w-full bg-border-muted" />;
};

export function MoneyHomePage() {
  const t = useI18nContext();
  const { availability, isLoading: isAvailabilityLoading } =
    useMoneyAccountAvailability();
  const address = availability.isAvailable ? availability.address : undefined;
  const { query: balanceQuery, formattedBalance } =
    useMoneyAccountBalance(address);
  const { query: apyQuery, apyDecimal, formattedApy } = useMoneyVaultApy(
    availability.isAvailable,
  );
  const { tokens: depositTokens, isNoFeeToken } = useMoneyDepositTokens();
  const privacyMode = useSelector(getPrivacyMode);

  if (isAvailabilityLoading) {
    return (
      <div
        className="flex min-h-full flex-col gap-4 bg-background-default p-4"
        data-testid="money-home-loading"
      >
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-12 w-36" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    );
  }

  if (!availability.isAvailable) {
    return <Navigate to={DEFAULT_ROUTE} replace />;
  }

  const balanceDisplay =
    balanceQuery.isError || formattedBalance === undefined
      ? t('moneyBalanceUnavailable')
      : formattedBalance;
  const apyDisplay = formattedApy;

  return (
    <main
      className="min-h-full bg-background-default pb-5"
      data-testid="money-home-page"
    >
      <header className="flex h-14 items-center justify-between px-4">
        <Text variant={TextVariant.HeadingLg} fontWeight={FontWeight.Bold}>
          {t('money')}
        </Text>
        <ButtonIcon
          iconName={IconName.MoreVertical}
          ariaLabel={t('moneyMoreOptions')}
          disabled
        />
      </header>

      <div className="flex flex-col gap-2 px-4 pt-2 sm:items-center">
        <div className="flex w-full max-w-[784px] flex-col gap-1 sm:items-center">
          {balanceQuery.isLoading ? (
            <Skeleton className="h-[50px] w-36" />
          ) : (
            <Text
              variant={TextVariant.DisplayLg}
              fontWeight={FontWeight.Medium}
              data-testid="money-balance"
            >
              {balanceDisplay}
            </Text>
          )}
          <div className="flex h-6 items-center gap-1">
            {apyQuery.isLoading && !apyDisplay ? (
              <Skeleton className="h-4 w-24" />
            ) : (
              <>
                {apyDisplay ? (
                  <Text
                    variant={TextVariant.BodyMd}
                    className="text-success-default"
                  >
                    {t('moneyApy', [apyDisplay])}
                  </Text>
                ) : null}
                <Text
                  variant={TextVariant.BodyMd}
                  color={TextColor.TextAlternative}
                >
                  {apyDisplay ? `• ${t('moneyMusd')}` : t('moneyMusd')}
                </Text>
                <Icon
                  name={IconName.Info}
                  size={IconSize.Sm}
                  color={IconColor.IconAlternative}
                />
              </>
            )}
          </div>
        </div>

        <div className="mt-2 flex w-full max-w-[389px] gap-2 py-2">
          <MoneyActionCard icon={IconName.Add} label={t('moneyAdd')} />
          <MoneyActionCard
            icon={IconName.Arrow2UpRight}
            label={t('moneySend')}
          />
        </div>

        <section className="mt-1 flex w-full max-w-[389px] flex-col gap-4 overflow-hidden rounded-2xl bg-background-muted p-4">
          <img
            src={MONEY_ONBOARDING_ARTWORK}
            alt=""
            className="h-[185px] w-full rounded-[14px] object-cover"
          />
          <div>
            <Text variant={TextVariant.HeadingLg} fontWeight={FontWeight.Bold}>
              {apyDisplay
                ? t('moneyEarnApyTitle', [apyDisplay])
                : t('moneyEarnTitle')}
            </Text>
            <Text
              variant={TextVariant.BodyMd}
              color={TextColor.TextAlternative}
              className="mt-1"
            >
              {apyDisplay
                ? t('moneyFundDescriptionWithApy', [apyDisplay])
                : t('moneyFundDescription')}
            </Text>
          </div>
          <Button disabled className="w-full">
            {t('addFunds')}
          </Button>
        </section>
      </div>

      <div className="mx-auto mt-3 w-full max-w-[816px]">
        <section className="px-4 py-3">
          <div className="flex items-center gap-1">
            <Text variant={TextVariant.HeadingMd} fontWeight={FontWeight.Bold}>
              {t('moneyHowItWorks')}
            </Text>
            <Icon
              name={IconName.ArrowRight}
              size={IconSize.Md}
              color={IconColor.IconAlternative}
            />
          </div>
          <Text
            variant={TextVariant.BodyMd}
            color={TextColor.TextAlternative}
            className="mt-2"
            data-testid="money-how-it-works-description"
          >
            {apyDisplay ? (
              <>
                {t('moneyHowItWorksPrefix')}{' '}
                <span className="text-success-default">
                  {t('moneyApy', [apyDisplay])}
                </span>
                {`. ${t('moneyHowItWorksSuffix')}`}
              </>
            ) : (
              t('moneyHowItWorksDescription')
            )}
          </Text>
        </section>

        <MoneySectionDivider />
        <MoneyActivityPlaceholder />

        <MoneySectionDivider />
        <MoneyPotentialEarnings
          tokens={depositTokens}
          apyDecimal={apyDecimal}
          isNoFeeToken={isNoFeeToken}
          privacyMode={privacyMode}
        />

        <MoneySectionDivider />
        <section className="px-4 py-3">
          <Text variant={TextVariant.HeadingMd} fontWeight={FontWeight.Bold}>
            {t('moneyBenefits')}
          </Text>
          <ul className="mt-3 flex flex-col gap-3">
            {[
              apyDisplay
                ? t('moneyBenefitAutoEarnWithApy', [apyDisplay])
                : t('moneyBenefitAutoEarn'),
              t('moneyBenefitStablecoin'),
              t('moneyBenefitLiquidity'),
              t('moneyBenefitSend'),
            ].map((benefit) => (
              <li key={benefit} className="flex items-start gap-3">
                <Icon
                  name={IconName.Check}
                  size={IconSize.Md}
                  color={IconColor.SuccessDefault}
                  className="mt-0.5 shrink-0"
                />
                <Text variant={TextVariant.BodyMd}>{benefit}</Text>
              </li>
            ))}
          </ul>
          <Button
            variant={ButtonVariant.Secondary}
            disabled
            className="mt-4 w-full"
          >
            {t('moneyLearnMore')}
          </Button>
        </section>
      </div>
    </main>
  );
}

export default MoneyHomePage;
