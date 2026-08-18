import React from 'react';
import { FontWeight, Text, TextVariant } from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';

const CONDENSED_CARDS = [
  {
    key: 'growth',
    image: './images/money-how-it-works.png',
    imageClassName: 'h-[58px] w-[58px]',
    labelKey: 'moneyHowYourMoneyGrows',
  },
  {
    key: 'musd',
    image: './images/money-musd.png',
    imageClassName: 'h-12 w-12',
    labelKey: 'moneyMeetMusd',
  },
  {
    key: 'benefits',
    image: './images/money-benefits.png',
    imageClassName: 'h-[66px] w-[66px]',
    labelKey: 'moneyExploreBenefits',
  },
] as const;

export function MoneyCondensedInfoCards() {
  const t = useI18nContext();

  return (
    <section
      className="flex flex-col gap-3 px-4 py-3"
      aria-label={t('moneyMoreInformation')}
      data-testid="money-condensed-info-cards"
    >
      {CONDENSED_CARDS.map(({ key, image, imageClassName, labelKey }) => (
        <button
          key={key}
          type="button"
          disabled
          className="flex min-h-[110px] w-full items-center gap-4 rounded-xl bg-background-muted p-4 text-left disabled:cursor-default disabled:opacity-100"
          data-testid={`money-condensed-info-card-${key}`}
        >
          <span
            className="flex h-[78px] w-[78px] shrink-0 items-center justify-center rounded-xl bg-background-subsection"
            data-testid={`money-condensed-info-card-${key}-image`}
          >
            <img
              src={image}
              alt=""
              className={imageClassName}
              aria-hidden="true"
            />
          </span>
          <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
            {t(labelKey)}
          </Text>
        </button>
      ))}
    </section>
  );
}
