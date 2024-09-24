import React from 'react';
import { renderWithProvider } from '../../../../../../test/jest';
import configureStore from '../../../../../store/store';
import mockState from '../../../../../../test/data/mock-state.json';
import { SiteCellTooltip } from './site-cell-tooltip';

describe('SiteCellTooltip', () => {
  const store = configureStore({
    metamask: {
      ...mockState.metamask,
    },
  });
  const props = {
    accounts: [
      {
        id: 'e4a2f136-282d-4f06-8149-2e74e704a3fc',
        address: '0x4dd158e8b382ba1649bda883a909037e1298552c',
        options: {},
        methods: [
          'personal_sign',
          'eth_sign',
          'eth_signTransaction',
          'eth_signTypedData_v1',
          'eth_signTypedData_v3',
          'eth_signTypedData_v4',
        ],
        type: 'eip155:eoa',
        metadata: {
          name: 'Account 4',
          nameLastUpdatedAt: 1727088231912,
          importTime: 1727088231225,
          lastSelected: 1727088231278,
          keyring: {
            type: 'HD Key Tree',
          },
        },
        balance: '0x00',
        pinned: false,
        hidden: false,
        active: false,
        keyring: {
          type: 'HD Key Tree',
        },
        label: null,
      },
      {
        id: '96bb1385-2807-479a-a00e-af63e74119cd',
        address: '0x86771cd233a04c004ceebc3c1ad402fe8a37ff32',
        options: {},
        methods: [
          'personal_sign',
          'eth_sign',
          'eth_signTransaction',
          'eth_signTypedData_v1',
          'eth_signTypedData_v3',
          'eth_signTypedData_v4',
        ],
        type: 'eip155:eoa',
        metadata: {
          name: 'Account 5',
          nameLastUpdatedAt: 1727099031302,
          importTime: 1727099031101,
          lastSelected: 1727099031109,
          keyring: {
            type: 'HD Key Tree',
          },
        },
        balance: '0x00',
        pinned: false,
        hidden: false,
        active: false,
        keyring: {
          type: 'HD Key Tree',
        },
        label: null,
      },
      {
        id: '390013ea-34d9-4c58-a2d5-d98cd797aab8',
        address: '0xf0b4efe81d9f277d05a9afeacbf076d86d9c041b',
        options: {},
        methods: [
          'personal_sign',
          'eth_sign',
          'eth_signTransaction',
          'eth_signTypedData_v1',
          'eth_signTypedData_v3',
          'eth_signTypedData_v4',
        ],
        type: 'eip155:eoa',
        metadata: {
          name: 'Account 6',
          importTime: 1727180391924,
          keyring: {
            type: 'HD Key Tree',
          },
          lastSelected: 1727180391971,
          nameLastUpdatedAt: 1727180392652,
        },
        balance: '0x00',
        pinned: false,
        hidden: false,
        active: false,
        keyring: {
          type: 'HD Key Tree',
        },
        label: null,
      },
    ],
    networks: [
      {
        blockExplorerUrls: ['https://etherscan.io'],
        chainId: '0x1',
        defaultBlockExplorerUrlIndex: 0,
        defaultRpcEndpointIndex: 0,
        name: 'Ethereum Mainnet',
        nativeCurrency: 'ETH',
        rpcEndpoints: [
          {
            networkClientId: 'mainnet',
            type: 'infura',
            url: 'https://mainnet.infura.io/v3/{infuraProjectId}',
          },
        ],
      },
      {
        blockExplorerUrls: ['https://era.zksync.network/'],
        chainId: '0x144',
        defaultBlockExplorerUrlIndex: 0,
        defaultRpcEndpointIndex: 0,
        name: 'zkSync Era Mainnet',
        nativeCurrency: 'ETH',
        rpcEndpoints: [
          {
            name: 'ZKsync Era',
            networkClientId: '9ceaf9eb-0aa2-4bd4-bf98-b390b91714d5',
            type: 'custom',
            url: 'https://mainnet.era.zksync.io',
          },
        ],
      },
      {
        blockExplorerUrls: ['https://bscscan.com'],
        chainId: '0x38',
        defaultBlockExplorerUrlIndex: 0,
        defaultRpcEndpointIndex: 0,
        name: 'Binance Smart Chain',
        nativeCurrency: 'BNB',
        rpcEndpoints: [
          {
            name: 'BNB Smart Chain',
            networkClientId: 'f1b61a9b-2238-4344-af5e-36d20f76de10',
            type: 'custom',
            url: 'https://bsc-dataseed.binance.org/',
          },
        ],
      },
      {
        blockExplorerUrls: ['https://polygonscan.com/'],
        chainId: '0x89',
        defaultBlockExplorerUrlIndex: 0,
        defaultRpcEndpointIndex: 0,
        name: 'Polygon',
        nativeCurrency: 'POL',
        rpcEndpoints: [
          {
            name: 'Polygon Mainnet',
            networkClientId: 'cf19f0de-8a83-468c-ad97-49b855a2ca9e',
            type: 'custom',
            url: 'https://polygon-mainnet.infura.io/v3/cb3fa73a8bdf4342b8ed8b07e0740be9',
          },
        ],
      },
      {
        blockExplorerUrls: ['https://lineascan.build'],
        chainId: '0xe708',
        defaultBlockExplorerUrlIndex: 0,
        defaultRpcEndpointIndex: 0,
        name: 'Linea Mainnet',
        nativeCurrency: 'ETH',
        rpcEndpoints: [
          {
            networkClientId: 'linea-mainnet',
            type: 'infura',
            url: 'https://linea-mainnet.infura.io/v3/{infuraProjectId}',
          },
        ],
      },
    ],
  };

  it('should render correctly', () => {
    const { container } = renderWithProvider(
      <SiteCellTooltip {...props} />,
      store,
    );

    expect(container).toMatchSnapshot();
  });

  it('should render Avatar Account correctly', () => {
    const { container } = renderWithProvider(
      <SiteCellTooltip {...props} />,
      store,
    );

    expect(
      container.getElementsByClassName('mm-avatar-account__jazzicon'),
    ).toBeDefined();
  });

  it('should render Avatar Networks correctly', () => {
    const { container } = renderWithProvider(
      <SiteCellTooltip {...props} />,
      store,
    );

    expect(
      container.getElementsByClassName('multichain-avatar-group'),
    ).toBeDefined();
  });
});
