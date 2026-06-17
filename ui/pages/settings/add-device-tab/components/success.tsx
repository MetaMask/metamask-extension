import React from 'react';
import {
  Box,
  Button,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextAlign,
  TextColor,
  TextVariant,
  FontWeight,
  BoxFlexDirection,
  BoxAlignItems,
  BoxJustifyContent,
  BoxBackgroundColor,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { ScrollContainer } from '../../../../contexts/scroll-container';

type SuccessProps = {
  onDone: () => void;
};

const Success = ({ onDone }: SuccessProps) => {
  const t = useI18nContext();

  const wallets = [
    {
      name: 'Main Wallet',
      accounts_count: 5,
    },
    {
      name: 'Secondary Wallet',
      accounts_count: 2,
    },
    {
      name: 'Tertiary Wallet',
      accounts_count: 3,
    },
    {
      name: 'Quaternary Wallet',
      accounts_count: 4,
    },
    {
      name: 'Quinary Wallet',
      accounts_count: 1,
    },
    {
      name: 'Senary Wallet',
      accounts_count: 0,
    },
    {
      name: 'Septenary Wallet',
      accounts_count: 0,
    },
    {
      name: 'Octonary Wallet',
      accounts_count: 0,
    },
    {
      name: 'Nonary Wallet',
      accounts_count: 0,
    },
    {
      name: 'Decenary Wallet',
      accounts_count: 0,
    },
  ];

  return (
    <Box flexDirection={BoxFlexDirection.Column} className="flex-1 min-h-0">
      <Box
        className="text-center"
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Center}
        gap={2}
      >
        <Icon
          name={IconName.Confirmation}
          size={IconSize.Xl}
          color={IconColor.SuccessDefault}
          className="mx-auto"
        />
        <Text
          variant={TextVariant.HeadingLg}
          color={TextColor.TextDefault}
          fontWeight={FontWeight.Bold}
          textAlign={TextAlign.Center}
        >
          {t('add_device_success_title')}
        </Text>
        <Text
          variant={TextVariant.BodyMd}
          color={TextColor.TextAlternative}
          textAlign={TextAlign.Center}
        >
          {t('add_device_success_desc', [5, 2])}
        </Text>
      </Box>
      <ScrollContainer className="flex flex-1 flex-col overflow-y-auto min-h-0 mt-8">
        <Box flexDirection={BoxFlexDirection.Column}>
          {wallets.map((wallet) => (
            <Box
              key={wallet.name}
              flexDirection={BoxFlexDirection.Row}
              alignItems={BoxAlignItems.Center}
              justifyContent={BoxJustifyContent.Between}
              padding={2}
            >
              <Box
                flexDirection={BoxFlexDirection.Row}
                alignItems={BoxAlignItems.Center}
                gap={3}
              >
                <Box
                  backgroundColor={BoxBackgroundColor.PrimaryMuted}
                  padding={2}
                  className="rounded-md"
                >
                  <Icon name={IconName.Wallet} />
                </Box>
                <Box
                  flexDirection={BoxFlexDirection.Column}
                  alignItems={BoxAlignItems.Start}
                >
                  <Text
                    variant={TextVariant.BodyMd}
                    fontWeight={FontWeight.Medium}
                    color={TextColor.TextDefault}
                  >
                    {wallet.name}
                  </Text>
                  <Text
                    variant={TextVariant.BodySm}
                    color={TextColor.TextAlternative}
                  >
                    {`${wallet.accounts_count} ${t('accounts')}`}
                  </Text>
                </Box>
              </Box>
              <Icon name={IconName.Check} color={IconColor.SuccessDefault} />
            </Box>
          ))}
        </Box>
      </ScrollContainer>
      <Button className="w-full mt-10" onClick={onDone}>
        {t('done')}
      </Button>
    </Box>
  );
};

export default Success;
