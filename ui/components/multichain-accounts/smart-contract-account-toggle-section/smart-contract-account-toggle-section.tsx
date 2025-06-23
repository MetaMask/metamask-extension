import React from 'react';
import { useSelector } from 'react-redux';
import { Hex } from '@metamask/utils';
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
import { AppSliceState } from '../../../ducks/app/app';
import { useEIP7702Networks } from '../../../pages/confirmations/hooks/useEIP7702Networks';
import { SmartContractAccountToggle } from '../smart-contract-account-toggle';
import Preloader from '../../ui/icon/preloader';

export const SmartContractAccountToggleSection = () => {
  const address = useSelector(
    (state: AppSliceState) => state.appState.accountDetailsAddress,
  );
  const t = useI18nContext();
  const { network7702List, pending } = useEIP7702Networks(address);

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
                address={address as Hex}
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
