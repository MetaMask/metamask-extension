import React, { useCallback, useLayoutEffect, useRef } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  ButtonIcon,
  FontWeight,
  IconName,
  Skeleton,
  Text,
  TextAlign,
  TextButton,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { DEFAULT_ROUTE, PREVIOUS_ROUTE } from '../../helpers/constants/routes';
import { useI18nContext } from '../../hooks/useI18nContext';
import { useMoneyAccountAvailability } from '../../hooks/money/use-money-account-availability';
import { useMoneyAccountBalance } from '../../hooks/money/useMoneyAccountBalance';
import { MoneyFaqItem } from './components/money-faq-item';
import { MONEY_NO_FEE_DEPOSIT_TOKEN_BULLETS } from './constants/no-fee-deposit-tokens';
import { MONEY_CARD_FEES_URL } from './constants/urls';

const FAQ_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

/**
 * Money Home and How it works share RootLayout's overflow container, so
 * home scroll would otherwise carry over when opening this page.
 *
 * @param element - A node on the How it works page.
 */
function resetOverflowAncestorScroll(element: HTMLElement | null): void {
  let node = element;
  while (node) {
    node.scrollTop = 0;
    node = node.parentElement;
  }
}

const MoneySectionDivider = () => {
  return <div className="my-5 h-px w-full bg-border-muted" />;
};

const FaqDivider = () => {
  return <div className="h-px w-full bg-border-muted" />;
};

/**
 * Full-screen Money How it works page: intro copy, FAQ accordions, and
 * risk disclosures. Ported from mobile's MoneyHowItWorksView.
 *
 * @returns The How it works page.
 */
export function MoneyHowItWorksPage() {
  const t = useI18nContext();
  const navigate = useNavigate();
  const pageRef = useRef<HTMLDivElement>(null);
  const { availability, isLoading: isAvailabilityLoading } =
    useMoneyAccountAvailability();
  const { apyPercentFormatted } = useMoneyAccountBalance({
    enabled: availability.isAvailable,
  });

  useLayoutEffect(() => {
    resetOverflowAncestorScroll(pageRef.current);
  }, []);

  const handleBack = useCallback(() => {
    navigate(PREVIOUS_ROUTE);
  }, [navigate]);

  const handleCardFees = useCallback(() => {
    global.platform.openTab({ url: MONEY_CARD_FEES_URL });
  }, []);

  const apyDisplay = apyPercentFormatted;

  const getFaqAnswer = (
    number: (typeof FAQ_NUMBERS)[number],
  ): React.ReactNode => {
    if (number === 1) {
      return apyDisplay
        ? t('moneyFaqAnswer1WithApy', [apyDisplay])
        : t('moneyFaqAnswer1');
    }
    if (number === 4) {
      return (
        <>
          {t('moneyFaqAnswer4')}
          <TextButton
            onClick={handleCardFees}
            data-testid="money-how-it-works-faq-link"
          >
            {t('moneyFaqAnswer4Link')}
          </TextButton>
        </>
      );
    }
    if (number === 5) {
      return apyDisplay
        ? t('moneyFaqAnswer5WithApy', [apyDisplay])
        : t('moneyFaqAnswer5');
    }
    if (number === 7) {
      return (
        <>
          {t('moneyFaqAnswer7')}
          {'\n\n'}
          {MONEY_NO_FEE_DEPOSIT_TOKEN_BULLETS}
          {'\n\n'}
          {t('moneyFaqAnswer7Suffix')}
        </>
      );
    }
    return t(`moneyFaqAnswer${number}`);
  };

  let body: React.ReactNode;
  if (isAvailabilityLoading) {
    body = (
      <div
        className="flex min-h-full flex-col gap-4 bg-background-default p-4"
        data-testid="money-how-it-works-loading"
      >
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  } else if (availability.isAvailable) {
    body = (
      <main
        className="min-h-full bg-background-default pb-5"
        data-testid="money-how-it-works-page"
      >
        <div className="grid grid-cols-[auto_1fr_auto] items-center px-4 py-4">
          <ButtonIcon
            iconName={IconName.ArrowLeft}
            ariaLabel={t('back')}
            onClick={handleBack}
            data-testid="money-how-it-works-back-button"
          />
          <Text
            variant={TextVariant.HeadingSm}
            fontWeight={FontWeight.Bold}
            textAlign={TextAlign.Center}
            data-testid="money-how-it-works-title"
          >
            {t('money')}
          </Text>
          <div className="w-10" aria-hidden />
        </div>

        <section className="flex flex-col gap-3 px-4 pb-3 pt-6">
          <Text
            variant={TextVariant.HeadingMd}
            fontWeight={FontWeight.Bold}
            data-testid="money-how-it-works-section-title"
          >
            {t('moneyHowItWorks')}
          </Text>
          <Text
            variant={TextVariant.BodyMd}
            color={TextColor.TextAlternative}
            data-testid="money-how-it-works-description-1"
          >
            {apyDisplay
              ? t('moneyHowItWorksPageDescription1WithApy', [apyDisplay])
              : t('moneyHowItWorksPageDescription1')}
          </Text>
          <Text
            variant={TextVariant.BodyMd}
            color={TextColor.TextAlternative}
            data-testid="money-how-it-works-description-2"
          >
            {t('moneyHowItWorksPageDescription2')}
          </Text>
          <Text
            variant={TextVariant.BodyMd}
            color={TextColor.TextAlternative}
            data-testid="money-how-it-works-description-3"
          >
            {t('moneyHowItWorksPageDescription3')}
          </Text>
        </section>

        <MoneySectionDivider />

        <div className="px-4 py-5">
          <Text
            variant={TextVariant.HeadingMd}
            fontWeight={FontWeight.Bold}
            data-testid="money-how-it-works-faq-title"
          >
            {t('moneyHowItWorksFaqTitle')}
          </Text>
        </div>

        {FAQ_NUMBERS.map((number, index) => (
          <React.Fragment key={number}>
            {index > 0 ? <FaqDivider /> : null}
            <MoneyFaqItem
              question={t(`moneyFaqQuestion${number}`)}
              answer={getFaqAnswer(number)}
              testId={`money-how-it-works-faq-item-${number}`}
            />
          </React.Fragment>
        ))}

        <MoneySectionDivider />

        <section className="flex flex-col gap-3 px-4 py-5">
          <Text
            variant={TextVariant.HeadingMd}
            fontWeight={FontWeight.Bold}
            data-testid="money-how-it-works-disclosures-title"
          >
            {t('moneyDisclosuresTitle')}
          </Text>
          <Text
            variant={TextVariant.BodyMd}
            color={TextColor.TextAlternative}
            data-testid="money-how-it-works-disclosures-body"
          >
            {t('moneyDisclosuresBody')}
          </Text>
        </section>
      </main>
    );
  } else {
    body = <Navigate to={DEFAULT_ROUTE} replace />;
  }

  return (
    <div ref={pageRef} className="contents">
      {body}
    </div>
  );
}

export default MoneyHowItWorksPage;
