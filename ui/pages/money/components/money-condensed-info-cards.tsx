import React from 'react';
import { FontWeight, Text, TextVariant } from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { MONEY_LANDING_URL, MUSD_PRICE_URL } from '../constants/urls';

const CARD_CLASS_NAME =
  'flex min-h-[110px] w-full items-center gap-4 rounded-xl bg-background-section p-4 text-left no-underline text-inherit';

const CONDENSED_CARDS = [
  {
    key: 'growth',
    image: './images/money-how-it-works.png',
    imageClassName: 'h-[58px] w-[58px]',
    imageWidth: 58,
    imageHeight: 58,
    labelKey: 'moneyHowYourMoneyGrows',
    // Pending designs — keep inert until the how-it-works destination ships.
    href: undefined,
  },
  {
    key: 'musd',
    image: './images/money-musd.png',
    imageClassName: 'h-12 w-12',
    imageWidth: 48,
    imageHeight: 48,
    labelKey: 'moneyMeetMusd',
    href: MUSD_PRICE_URL,
  },
  {
    key: 'benefits',
    image: './images/money-benefits.png',
    imageClassName: 'h-[66px] w-[66px]',
    imageWidth: 66,
    imageHeight: 66,
    labelKey: 'moneyExploreBenefits',
    href: MONEY_LANDING_URL,
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
      {CONDENSED_CARDS.map(
        ({
          key,
          image,
          imageClassName,
          imageWidth,
          imageHeight,
          labelKey,
          href,
        }) => {
          const content = (
            <>
              <span
                className="flex h-[78px] w-[78px] shrink-0 items-center justify-center rounded-xl bg-background-muted"
                data-testid={`money-condensed-info-card-${key}-image`}
              >
                <img
                  src={image}
                  alt=""
                  width={imageWidth}
                  height={imageHeight}
                  className={imageClassName}
                  aria-hidden="true"
                />
              </span>
              <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
                {t(labelKey)}
              </Text>
            </>
          );

          if (href === undefined) {
            return (
              <article
                key={key}
                className={CARD_CLASS_NAME}
                data-testid={`money-condensed-info-card-${key}`}
              >
                {content}
              </article>
            );
          }

          return (
            <a
              key={key}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(event) => {
                event.preventDefault();
                global.platform.openTab({ url: href });
              }}
              className={`${CARD_CLASS_NAME} cursor-pointer`}
              data-testid={`money-condensed-info-card-${key}`}
            >
              {content}
            </a>
          );
        },
      )}
    </section>
  );
}
