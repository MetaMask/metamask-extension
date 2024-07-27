import React from 'react';
import { Provider } from 'react-redux';
import { NetworkStatus } from '@metamask/network-controller';
import configureStore from '../../../../store/store';
import testData from '../../../../../.storybook/test-data';
import { Box } from '../../../../components/component-library';

const STORE_MOCK = {
  ...testData,
  metamask: {
    approvalFlows: [],
    currentCurrency: 'USD',
    keyrings: [
      {
        accounts: ['0x71C7656EC7ab88b098defB751B7401B5f6d8976F'],
        type: 'TestKeyring',
      },
      ...testData.metamask.keyrings,
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
    selectedNetworkClientId: 'testNetworkClientId',
    subjectMetadata: {
      'npm:@test/test-snap': {
        name: 'Test Snap',
        version: '1.0.0',
      },
    },
    tokenList: {},
    accounts: testData.metamask.accounts,
    internalAccounts: testData.metamask.internalAccounts,
    accountsByChainId: testData.metamask.accountsByChainId,
    snaps: {
      'npm:@test/test-snap': {
        id: 'npm:@test/test-snap',
        manifest: {
          description: 'Test Snap',
        },
      },
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
