import React, { ReactElement } from 'react';
import {
  Box,
  BoxFlexDirection,
  BoxAlignItems,
  Text,
  TextVariant,
  TextColor,
  FontWeight,
} from '@metamask/design-system-react';

import ZENDESK_URLS from '../../../../../helpers/constants/zendesk-url';
import {
  ButtonLink,
  ButtonLinkSize,
} from '../../../../../components/component-library';
import { useI18nContext } from '../../../../../hooks/useI18nContext';

const ListItem = ({
  imgSrc,
  title,
  description,
}: {
  imgSrc: string;
  title: string;
  description: ReactElement;
}) => (
  <Box
    alignItems={BoxAlignItems.Start}
    className="smart-account-update-content__list-item"
    style={{ display: 'flex', gap: '8px' }}
  >
    <img width="24px" src={imgSrc} />
    <Box
      flexDirection={BoxFlexDirection.Column}
    >
      <Text
        color={TextColor.TextDefault}
        variant={TextVariant.BodyMd}
        fontWeight={FontWeight.Medium}
      >
        {title}
      </Text>
      <Text
        color={TextColor.TextAlternative}
        variant={TextVariant.BodyMd}
        fontWeight={FontWeight.Normal}
      >
        {description}
      </Text>
    </Box>
  </Box>
);

export const SmartAccountUpdateContent = () => {
  const t = useI18nContext();

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      alignItems={BoxAlignItems.Center}
      style={{ gap: '16px' }}
    >
      <img
        width="100%"
        src="./images/smart-transactions/smart-account-update.svg"
      />
      <Text fontWeight={FontWeight.Bold} variant={TextVariant.HeadingLg}>
        {t('smartAccountSplashTitle')}
      </Text>
      <Box
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Start}
        style={{ gap: '12px' }}
      >
        <ListItem
          imgSrc="./images/speedometer.svg"
          title={t('smartAccountBetterTransaction')}
          description={t('smartAccountBetterTransactionDescription')}
        />
        <ListItem
          imgSrc="./images/petrol-pump.svg"
          title={t('smartAccountPayToken')}
          description={t('smartAccountPayTokenDescription')}
        />
        <ListItem
          imgSrc="./images/sparkle.svg"
          title={t('smartAccountSameAccount')}
          description={
            <span>
              {t('smartAccountFeaturesDescription')}{' '}
              <ButtonLink
                size={ButtonLinkSize.Inherit}
                href={ZENDESK_URLS.ACCOUNT_UPGRADE}
                externalLink
              >
                {t('learnMoreUpperCaseWithDot')}
              </ButtonLink>
            </span>
          }
        />
      </Box>
    </Box>
  );
};
