import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Provider } from 'react-redux';
import { Hex } from '@metamask/utils';
import configureStore from '../../../store/store';
import { Box, ButtonLink, ButtonLinkSize, Text } from '../../component-library';
import {
  AlignItems,
  Display,
  JustifyContent,
  BlockSize,
  TextVariant,
  TextColor,
} from '../../../helpers/constants/design-system';
import { BackgroundColor } from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import ZENDESK_URLS from '../../../helpers/constants/zendesk-url';
import { useSelector } from 'react-redux';
import { AppSliceState } from '../../../ducks/app/app';
import { SmartContractAccountToggleStory } from '../smart-contract-account-toggle/smart-contract-account-toggle-story';
import Preloader from '../../ui/icon/preloader';

const mockAddress: Hex = '0x742d35Cc6634C0532925a3b8D4E8f3c9B26e6e6e';

// Mock network data for stories
const mockNetworkResults = [
  {
    chainId: 'eip155:1',
    chainIdHex: '0x1' as Hex,
    name: 'Ethereum Mainnet',
    isEvm: true,
    nativeCurrency: 'ETH',
    blockExplorerUrls: ['https://etherscan.io'],
    defaultBlockExplorerUrlIndex: 0,
    isSupported: false,
    delegationAddress: undefined,
    upgradeContractAddress: '0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B' as Hex,
  },
  {
    chainId: 'eip155:11155111',
    chainIdHex: '0xaa36a7' as Hex,
    name: 'Sepolia',
    isEvm: true,
    nativeCurrency: 'SepoliaETH',
    blockExplorerUrls: ['https://sepolia.etherscan.io'],
    defaultBlockExplorerUrlIndex: 0,
    isSupported: false,
    delegationAddress: undefined,
    upgradeContractAddress: '0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B' as Hex,
  },
];

// Story wrapper component that exactly mirrors the original
const SmartContractAccountToggleSectionStory = ({
  pending = false,
  networks = [],
  disabled = false,
}: {
  pending?: boolean;
  networks?: any[];
  disabled?: boolean;
}) => {
  const address = useSelector(
    (state: AppSliceState) => state.appState.accountDetailsAddress,
  );
  const t = useI18nContext();
  // Instead of calling useEIP7702Networks, we use the passed props
  const { network7702List, pending: networksPending } = {
    network7702List: networks,
    pending,
  };

  const NetworkList = () => {
    return (
      <>
        {networksPending ? (
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
              <SmartContractAccountToggleStory
                key={network.chainIdHex}
                networkConfig={network}
                address={address as Hex}
                disabled={disabled}
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
        <Text
          variant={TextVariant.bodyMdMedium}
          style={{ marginBottom: '10px' }}
        >
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

// Create a minimal mock store with only the necessary state
const mockStore = configureStore({
  appState: {
    accountDetailsAddress: mockAddress,
  },
});

const meta: Meta<typeof SmartContractAccountToggleSectionStory> = {
  title: 'Components/MultichainAccounts/SmartContractAccountToggleSection',
  component: SmartContractAccountToggleSectionStory,
  parameters: {
    docs: {
      description: {
        component:
          'A section component that displays smart contract account toggle controls for all EIP-7702 compatible networks.',
      },
    },
  },
  decorators: [
    (Story) => (
      <Provider store={mockStore}>
        <Box style={{ width: '368px' }}>
          <Story />
        </Box>
      </Provider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SmartContractAccountToggleSectionStory>;

export const Loading: Story = {
  args: {
    pending: true,
    networks: [],
  },
  parameters: {
    docs: {
      description: {
        story: 'Loading state while fetching network support information.',
      },
    },
  },
};

export const WithNetworks: Story = {
  args: {
    pending: false,
    networks: mockNetworkResults,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Shows the NetworkList with available networks that can be upgraded to smart contract accounts.',
      },
    },
  },
};

export const Disabled: Story = {
  args: {
    pending: false,
    networks: mockNetworkResults,
    disabled: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the section with all toggles in disabled state.',
      },
    },
  },
};
