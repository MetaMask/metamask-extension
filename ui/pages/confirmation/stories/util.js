import React from 'react';
import { Provider } from 'react-redux';
import { NetworkStatus } from '@metamask/network-controller';
import { NetworkType } from '@metamask/controller-utils';
import { EthAccountType, EthMethod } from '@metamask/keyring-api';
import configureStore from '../../../store/store';
import { Box } from '../../../components/component-library';

const STORE_MOCK = {
  metamask: {
    approvalFlows: [],
    currentCurrency: 'USD',
    keyrings: [
      {
        accounts: ['0x71C7656EC7ab88b098defB751B7401B5f6d8976F'],
        type: 'TestKeyring',
      },
    ],
    networksMetadata: {
      testNetworkClientId: {
        status: NetworkStatus.Available,
      },
    },
    pendingApprovals: {
      testId: {
        id: 'testId',
        origin: 'npm:@test/test-snap',
      },
    },
    providerConfig: {
      type: NetworkType.rpc,
      nickname: 'Test Network',
    },
    selectedNetworkClientId: 'testNetworkClientId',
    subjectMetadata: {
      'npm:@test/test-snap': {
        name: 'Test Snap',
        version: '1.0.0',
      },
    },
    tokenList: {},
    internalAccounts: {
      selectedAccount: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
      accounts: {
        'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3': {
          address: '0x64a845a5b02460acf8a3d84503b0d68d028b4bb4',
          id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
          metadata: {
            name: 'This is a Really Long Account Name',
            keyring: {
              type: 'HD Key Tree',
            },
          },
          options: {},
          methods: [...Object.values(EthMethod)],
          type: EthAccountType.Eoa,
        },
        '07c2cfec-36c9-46c4-8115-3836d3ac9047': {
          address: '0xb19ac54efa18cc3a14a5b821bfec73d284bf0c5e',
          id: '07c2cfec-36c9-46c4-8115-3836d3ac9047',
          metadata: {
            name: 'Account 2',
            keyring: {
              type: 'HD Key Tree',
            },
          },
          options: {},
          methods: [...Object.values(EthMethod)],
          type: EthAccountType.Eoa,
        },
      }
    },
  },
};

// eslint-disable-next-line react/prop-types
export function PendingApproval({ children, requestData, type }) {
  const mockState = { ...STORE_MOCK };
  const pendingApproval = mockState.metamask.pendingApprovals.testId;

  pendingApproval.type = type;
  pendingApproval.requestData = requestData;

  return (
    <Provider store={configureStore(mockState)}>
      <Box
        style={{
          height: '592px',
          width: '360px',
          border: '1px solid lightgrey',
          margin: '0 auto',
        }}
      >
        {children}
      </Box>
    </Provider>
  );
}
