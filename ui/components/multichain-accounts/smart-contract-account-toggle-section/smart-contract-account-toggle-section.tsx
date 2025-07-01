import React, { useState, useCallback } from 'react';
import { Box, ButtonLink, ButtonLinkSize, Text } from '../../component-library';
import {
  AlignItems,
  Display,
  JustifyContent,
  BlockSize,
  TextVariant,
  TextColor,
  BackgroundColor,
} from '../../../helpers/constants/design-system';
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

  // userIntent state per network
  const [userIntentMap, setUserIntentMap] = useState<
    Record<string, boolean | null>
  >({});
  const setUserIntent = useCallback(
    (chainIdHex: string, value: boolean | null) => {
      setUserIntentMap((prev) => ({ ...prev, [chainIdHex]: value }));
    },
    [],
  );

  const NetworkList = () => {
    return (
      <>
        {pending ? (
          <Box
            paddingTop={12}
            paddingBottom={12}
            display={Display.Flex}
            justifyContent={JustifyContent.center}
            alignItems={AlignItems.center}
            data-testid="network-loader"
          >
            <Preloader size={24} />
          </Box>
        ) : (
          <Box>
            {network7702List.map((network) => (
              <SmartContractAccountToggle
                key={network.chainIdHex}
                networkConfig={network}
                address={address}
                userIntent={userIntentMap[network.chainIdHex] ?? null}
                setUserIntent={(value: boolean | null) =>
                  setUserIntent(network.chainIdHex, value)
                }
                returnToPage={returnToPage}
              />
            ))}
          </Box>
        )}
      </>
    );
  };

  return (
    <Box
      width={BlockSize.Full}
      backgroundColor={BackgroundColor.backgroundAlternative}
      paddingTop={3}
      paddingBottom={3}
      paddingLeft={4}
      paddingRight={4}
      style={{ borderRadius: '8px' }}
    >
      <Box>
        <Text variant={TextVariant.bodyMdMedium} marginBottom={2}>
          {t('enableSmartContractAccount')}
        </Text>
        <Text color={TextColor.textAlternative} variant={TextVariant.bodySm}>
          {t('enableSmartContractAccountDescription')}{' '}
          <ButtonLink
            onClick={() => {
              global.platform.openTab({
                url: ZENDESK_URLS.ACCOUNT_UPGRADE,
              });
            }}
            size={ButtonLinkSize.Sm}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: '14px',
              lineHeight: '20px',
              verticalAlign: 'baseline',
            }}
          >
            {t('learnMoreUpperCase')}
          </ButtonLink>
        </Text>
      </Box>
      <Box>
        <NetworkList />
      </Box>
    </Box>
  );
};
