import React, { useLayoutEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import {
  ButtonIcon,
  FontWeight,
  IconName,
  Skeleton,
  Text,
  TextButton,
  TextButtonSize,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import {
  DEFAULT_ROUTE,
  MONEY_HOME_ROUTE,
} from '../../helpers/constants/routes';
import { useI18nContext } from '../../hooks/useI18nContext';
import { useMoneyAccountAvailability } from '../../hooks/money/use-money-account-availability';
import { useMoneyAccountBalance } from '../../hooks/money/useMoneyAccountBalance';
import { useInAppBack } from '../../hooks/useInAppBack';
import { MoneyFaqItem } from './components/money-faq-item';
import { MoneySectionDivider } from './components/money-section-divider';
import { MONEY_CARD_FEES_URL } from './constants/urls';
import { resetOverflowAncestorScroll } from './utils/reset-overflow-ancestor-scroll';

const APY_FALLBACK = '—';

type FaqDefinition = {
  id: string;
  questionKey: string;
  answerKey: string;
  usesApy?: boolean;
  link?: {
    labelKey: string;
    url: string;
    testId: string;
  };
};

const FAQ_ITEMS: FaqDefinition[] = [
  {
    id: 'money-account',
    questionKey: 'moneyHowItWorksFaqMoneyAccountQuestion',
    answerKey: 'moneyHowItWorksFaqMoneyAccountAnswer',
    usesApy: true,
  },
  {
    id: 'musd',
    questionKey: 'moneyHowItWorksFaqMusdQuestion',
    answerKey: 'moneyHowItWorksFaqMusdAnswer',
  },
  {
    id: 'yield',
    questionKey: 'moneyHowItWorksFaqYieldQuestion',
    answerKey: 'moneyHowItWorksFaqYieldAnswer',
  },
  {
    id: 'locked',
    questionKey: 'moneyHowItWorksFaqLockedQuestion',
    answerKey: 'moneyHowItWorksFaqLockedAnswer',
  },
  {
    id: 'fees',
    questionKey: 'moneyHowItWorksFaqFeesQuestion',
    answerKey: 'moneyHowItWorksFaqFeesAnswer',
    link: {
      labelKey: 'moneyHowItWorksFaqFeesLink',
      url: MONEY_CARD_FEES_URL,
      testId: 'money-how-it-works-faq-fees-link',
    },
  },
  {
    id: 'apy',
    questionKey: 'moneyHowItWorksFaqApyQuestion',
    answerKey: 'moneyHowItWorksFaqApyAnswer',
    usesApy: true,
  },
  {
    id: 'spending',
    questionKey: 'moneyHowItWorksFaqSpendingQuestion',
    answerKey: 'moneyHowItWorksFaqSpendingAnswer',
  },
  {
    id: 'control',
    questionKey: 'moneyHowItWorksFaqControlQuestion',
    answerKey: 'moneyHowItWorksFaqControlAnswer',
  },
];

const MoneyHowItWorksSkeleton = () => {
  return (
    <div
      className="flex min-h-full flex-col gap-4 bg-background-default p-4"
      data-testid="money-how-it-works-loading"
    >
      <Skeleton className="h-8 w-8" />
      <Skeleton className="h-10 w-40" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
};

type MoneyHowItWorksContentProps = {
  apyDisplay: string;
  onBack: () => void;
};

const MoneyHowItWorksContent = ({
  apyDisplay,
  onBack,
}: MoneyHowItWorksContentProps) => {
  const t = useI18nContext();

  return (
    <main
      className="min-h-full bg-background-default pb-5"
      data-testid="money-how-it-works-page"
    >
      <div className="flex items-center px-2 py-2">
        <ButtonIcon
          iconName={IconName.ArrowLeft}
          ariaLabel={t('back')}
          onClick={onBack}
          data-testid="money-how-it-works-back-button"
        />
      </div>

      <div className="flex flex-col gap-3 px-4 pb-3 pt-6">
        <Text
          variant={TextVariant.HeadingLg}
          fontWeight={FontWeight.Bold}
          data-testid="money-how-it-works-title"
        >
          {t('moneyHowItWorks')}
        </Text>
        <Text
          variant={TextVariant.BodyMd}
          color={TextColor.TextAlternative}
          data-testid="money-how-it-works-description-1"
        >
          {t('moneyHowItWorksDescription1', [apyDisplay])}
        </Text>
        <Text
          variant={TextVariant.BodyMd}
          color={TextColor.TextAlternative}
          data-testid="money-how-it-works-description-2"
        >
          {t('moneyHowItWorksDescription2')}
        </Text>
        <Text
          variant={TextVariant.BodyMd}
          color={TextColor.TextAlternative}
          data-testid="money-how-it-works-description-3"
        >
          {t('moneyHowItWorksDescription3')}
        </Text>
      </div>

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

      {FAQ_ITEMS.map((item, index) => {
        const answerText = item.usesApy
          ? t(item.answerKey, [apyDisplay])
          : t(item.answerKey);
        const { link } = item;
        const answer = link ? (
          <>
            {answerText}
            <TextButton size={TextButtonSize.BodyMd} asChild>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(event) => {
                  event.preventDefault();
                  global.platform.openTab({ url: link.url });
                }}
                data-testid={link.testId}
              >
                {t(link.labelKey)}
              </a>
            </TextButton>
          </>
        ) : (
          answerText
        );

        return (
          <React.Fragment key={item.id}>
            {index > 0 ? <div className="h-px w-full bg-border-muted" /> : null}
            <MoneyFaqItem
              question={t(item.questionKey)}
              answer={answer}
              testId={`money-how-it-works-faq-${item.id}`}
            />
          </React.Fragment>
        );
      })}

      <MoneySectionDivider />

      <div className="flex flex-col gap-3 px-4 py-5">
        <Text
          variant={TextVariant.HeadingMd}
          fontWeight={FontWeight.Bold}
          data-testid="money-how-it-works-disclosures-title"
        >
          {t('moneyHowItWorksDisclosuresTitle')}
        </Text>
        <Text
          variant={TextVariant.BodyMd}
          color={TextColor.TextAlternative}
          data-testid="money-how-it-works-disclosures-body"
        >
          {t('moneyHowItWorksDisclosuresBody')}
        </Text>
      </div>
    </main>
  );
};

/**
 * Money How it works page: intro copy, FAQ accordion, and disclosures.
 *
 * @returns The How it works page, or a redirect when Money is unavailable.
 */
export function MoneyHowItWorksPage() {
  const pageRef = useRef<HTMLDivElement>(null);
  const { availability, isLoading: isAvailabilityLoading } =
    useMoneyAccountAvailability();
  const { apyPercentFormatted } = useMoneyAccountBalance({
    enabled: availability.isAvailable,
  });
  const apyDisplay = apyPercentFormatted ?? APY_FALLBACK;

  useLayoutEffect(() => {
    resetOverflowAncestorScroll(pageRef.current);
  }, []);

  const handleBack = useInAppBack(MONEY_HOME_ROUTE);

  if (isAvailabilityLoading) {
    return (
      <div ref={pageRef} className="contents">
        <MoneyHowItWorksSkeleton />
      </div>
    );
  }

  if (!availability.isAvailable) {
    return <Navigate to={DEFAULT_ROUTE} replace />;
  }

  return (
    <div ref={pageRef} className="contents">
      <MoneyHowItWorksContent apyDisplay={apyDisplay} onBack={handleBack} />
    </div>
  );
}

export default MoneyHowItWorksPage;
