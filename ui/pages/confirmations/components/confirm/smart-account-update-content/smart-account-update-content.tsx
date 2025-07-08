import React, { ReactElement } from 'react';
import { Hex } from '@metamask/utils';
import { NameType } from '@metamask/name-controller';
import { useSelector } from 'react-redux';

import ZENDESK_URLS from '../../../../../helpers/constants/zendesk-url';
import {
  AvatarAccount,
  AvatarAccountSize,
  AvatarAccountVariant,
  Box,
  ButtonLink,
  ButtonLinkSize,
  Text,
} from '../../../../../components/component-library';
import {
  AlignItems,
  BlockSize,
  BorderColor,
  Display,
  FlexDirection,
  FontWeight,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { getUseBlockie } from '../../../../../selectors';
import Name from '../../../../../components/app/name';

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
    className="smart-account-update__list-item"
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

export const SmartAccountUpdateContent = ({
  selectedAddresses,
  chainId,
}: {
  selectedAddresses: Hex[];
  chainId?: Hex;
}) => {
  const t = useI18nContext();
  const useBlockie = useSelector(getUseBlockie);

  return (
    <>
      <img
        width="100%"
        src="./images/smart-transactions/smart-account-update.svg"
      />
      <Text fontWeight={FontWeight.Bold} variant={TextVariant.headingLg}>
        {t('smartAccountSplashTitle')}
      </Text>
      {selectedAddresses?.length > 0 && (
        <Box
          display={Display.Flex}
          alignItems={AlignItems.center}
          justifyContent={JustifyContent.center}
          width={BlockSize.Full}
        >
          <Text
            color={TextColor.textAlternative}
            marginInlineEnd={2}
            variant={TextVariant.bodyMd}
          >
            {t('smartAccountRequestFor')}
          </Text>
          {selectedAddresses.length === 1 && chainId ? (
            <Name
              value={selectedAddresses[0]}
              type={NameType.ETHEREUM_ADDRESS}
              variation={chainId}
            />
          ) : (
            <Box display={Display.Flex}>
              {selectedAddresses.map((address) => (
                <AvatarAccount
                  borderColor={BorderColor.transparent}
                  className="smart-account-update-content__acc-avatar"
                  size={AvatarAccountSize.Sm}
                  address={address}
                  variant={
                    useBlockie
                      ? AvatarAccountVariant.Blockies
                      : AvatarAccountVariant.Jazzicon
                  }
                  marginInlineEnd={2}
                />
              ))}
            </Box>
          )}
        </Box>
      )}
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
