import React, { useMemo } from 'react';
import { Hex } from '@metamask/utils';
import {
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxFlexDirection,
  BoxJustifyContent,
  FontWeight,
  Text,
  TextButton,
  TextButtonSize,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import ZENDESK_URLS from '../../../helpers/constants/zendesk-url';
import { useEIP7702Networks } from '../../../pages/confirmations/hooks/useEIP7702Networks';
import { SmartContractAccountToggle } from '../smart-contract-account-toggle';
import Preloader from '../../ui/icon/preloader';

type SmartContractAccountToggleSectionProps = {
  address: string;
  returnToPage?: string; // Optional page to return to after transaction
};

export const SmartContractAccountToggleSection = ({
  address,
  returnToPage,
}: SmartContractAccountToggleSectionProps) => {
  const t = useI18nContext();
  const { network7702List, pending } = useEIP7702Networks(address);

  const networkList = useMemo(() => {
    if (pending) {
      return (
        <Box
          paddingTop={12}
          paddingBottom={12}
          flexDirection={BoxFlexDirection.Row}
          justifyContent={BoxJustifyContent.Center}
          alignItems={BoxAlignItems.Center}
          data-testid="network-loader"
        >
          <Preloader size={24} />
        </Box>
      );
    }

    return (
      <Box>
        {network7702List.map((network) => (
          <SmartContractAccountToggle
            key={network.chainIdHex}
            networkConfig={network}
            address={address as Hex}
            returnToPage={returnToPage}
          />
        ))}
      </Box>
    );
  }, [pending, network7702List, address, returnToPage]);

  return (
    <Box
      className="w-full"
      backgroundColor={BoxBackgroundColor.BackgroundSection}
      paddingTop={3}
      paddingBottom={4}
      paddingLeft={4}
      paddingRight={2}
      style={{ borderRadius: '8px' }}
    >
      <Box paddingRight={2}>
        <Text
          variant={TextVariant.BodyMd}
          fontWeight={FontWeight.Medium}
          className="mb-2"
        >
          {t('enableSmartContractAccount')}
        </Text>
        <Text color={TextColor.TextAlternative} variant={TextVariant.BodySm}>
          {t('enableSmartContractAccountDescription')}{' '}
          <TextButton
            size={TextButtonSize.BodySm}
            color={TextColor.PrimaryDefault}
            onClick={() => {
              global.platform.openTab({
                url: ZENDESK_URLS.ACCOUNT_UPGRADE,
              });
            }}
            className="h-[22px] align-baseline text-sm leading-[22px]"
          >
            {t('learnMoreUpperCase')}
          </TextButton>
        </Text>
      </Box>
      <Box>{networkList}</Box>
    </Box>
  );
};
