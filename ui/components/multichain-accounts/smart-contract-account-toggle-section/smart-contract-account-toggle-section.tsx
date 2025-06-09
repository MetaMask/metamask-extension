import React from 'react';
import { Box, ButtonLink, ButtonLinkSize, Text } from '../../component-library';
import { AlignItems,Display, JustifyContent,  BlockSize, TextVariant } from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import ZENDESK_URLS from '../../../helpers/constants/zendesk-url';
import { useSelector } from 'react-redux';
import { AppSliceState } from '../../../ducks/app/app';
import { useEIP7702Networks } from '../../../pages/confirmations/hooks/useEIP7702Networks';
import { SmartContractAccountToggle } from '../smart-contract-account-toggle';
import { Hex } from '@metamask/utils';
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
        {pending ? (<Box
          paddingTop={12}
          paddingBottom={12}
          display={Display.Flex}
          justifyContent={JustifyContent.center}
          alignItems={AlignItems.center}
          data-testid="network-loader"
        >
          <Preloader size={18} />
        </Box>) : (
          <Box>
            {network7702List.map((network) => (
              <SmartContractAccountToggle key={network.chainIdHex} networkConfig={network} address={address as Hex} />
            ))}
          </Box>
        )}
      </>
    )
  }

  return (
    <Box width={BlockSize.Full}>
      <Box>
        <Text variant={TextVariant.bodyMdMedium}>{t('enableSmartContractAccount')}</Text>
        <Text variant={TextVariant.bodySm}>{t('enableSmartContractAccountDescription')}</Text>
        <ButtonLink
          onClick={() => {
            global.platform.openTab({
              url: ZENDESK_URLS.ACCOUNT_UPGRADE,
            });
          }}
          size={ButtonLinkSize.Sm}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('learnMoreUpperCase')}
        </ButtonLink>
      </Box>
      <Box>
        <NetworkList />
      </Box>
    </Box>
  )
};
