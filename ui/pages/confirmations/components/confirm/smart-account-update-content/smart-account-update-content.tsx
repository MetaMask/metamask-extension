import React, { ReactElement } from 'react';

import ZENDESK_URLS from '../../../../../helpers/constants/zendesk-url';
import {
  Box,
  ButtonLink,
  ButtonLinkSize,
  Text,
} from '../../../../../components/component-library';
import {
  AlignItems,
  Display,
  FlexDirection,
  FontWeight,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
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
    display={Display.Flex}
    alignItems={AlignItems.flexStart}
    className="smart-account-update-content__list-item"
  >
    <img width="24px" src={imgSrc} />
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      marginInlineStart={2}
    >
      <Text
        color={TextColor.textDefault}
        variant={TextVariant.bodyMd}
        fontWeight={FontWeight.Medium}
      >
        {title}
      </Text>
      <Text
        color={TextColor.textAlternative}
        variant={TextVariant.bodyMd}
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
    <>
      <img
        width="100%"
        src="./images/smart-transactions/smart-account-update.svg"
      />
      <Text fontWeight={FontWeight.Bold} variant={TextVariant.headingLg}>
        {t('smartAccountSplashTitle')}
      </Text>
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.flexStart}
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
            <>
              <Text
                color={TextColor.textAlternative}
                variant={TextVariant.bodyMd}
                fontWeight={FontWeight.Normal}
              >
                {t('smartAccountFeaturesDescription')}{' '}
                <ButtonLink
                  size={ButtonLinkSize.Inherit}
                  href={ZENDESK_URLS.ACCOUNT_UPGRADE}
                  externalLink
                >
                  {t('learnMoreUpperCaseWithDot')}
                </ButtonLink>
              </Text>
            </>
          }
        />
      </Box>
    </>
  );
};
