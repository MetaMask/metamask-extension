import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import { renderWithProvider } from '../../../test/lib/render-helpers';
import { setBackgroundConnection } from '../../../test/jest';

import TransactionInsights from '.';

const middleware = [thunk];

setBackgroundConnection({
  getGasFeeTimeEstimate: jest.fn(),
  getGasFeeEstimatesAndStartPolling: jest.fn(),
  promisifiedBackground: jest.fn(),
  tryReverseResolveAddress: jest.fn(),
  getNextNonce: jest.fn(),
});

const txData = {
  id: 1,
  txParams: {},
  type: 'simpleSend',
};

const storeOneSnap = {
  metamask: {
    snaps: {
      test1: {
        enabled: true,
        id: 'test1',
        manifest: {
          proposedName: 'Transaction Example Snap 1',
          description: 'A transaction example snap 1.',
        },
      },
    },
    subjects: {
      test1: {
        permissions: {
          'endowment:transaction-insight': {},
        },
      },
    },
  },
};

const storeTwoSnaps = {
  metamask: {
    snaps: {
      test1: {
        enabled: true,
        id: 'test1',
        manifest: {
          proposedName: 'Transaction Example Snap 1',
          description: 'A transaction example snap 1.',
        },
      },
      test2: {
        enabled: true,
        id: 'test2',
        manifest: {
          proposedName: 'Transaction Example Snap 2',
          description: 'A transaction example snap 2.',
        },
      },
    },
    subjects: {
      test1: {
        permissions: {
          'endowment:transaction-insight': {},
        },
      },
      test2: {
        permissions: {
          'endowment:transaction-insight': {},
        },
      },
    },
  },
};

describe('Transaction Insight', () => {
  it('should match snapshot for one snap', () => {
    const store = configureMockStore(middleware)(storeOneSnap);
    const { container } = renderWithProvider(
      <TransactionInsights txData={txData} />,
      store,
    );
    expect(container).toMatchSnapshot();
  });
  it('should match snapshot for two snaps', () => {
    const store = configureMockStore(middleware)(storeTwoSnaps);
    const { container } = renderWithProvider(
      <TransactionInsights txData={txData} />,
      store,
    );
    expect(container).toMatchSnapshot();
  });
});
