import React from 'react';
import configureMockStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import { renderHook } from '@testing-library/react-hooks';
import { render } from '@testing-library/react';

import useTransactionInsights from '.';

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

const renderTransactionInsightHook = (store) => {
  const wrapper = ({ children }) => (
    <Provider store={configureMockStore()(store)}>{children}</Provider>
  );

  return renderHook(() => useTransactionInsights({ txData }), { wrapper });
};

describe('Transaction Insight', () => {
  it('should match snapshot for one snap', () => {
    const { result } = renderTransactionInsightHook(storeOneSnap);
    const InsightComponent = result.current;
    const { container } = render(InsightComponent);
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot for two snaps', () => {
    const { result } = renderTransactionInsightHook(storeTwoSnaps);
    const InsightComponent = result.current;
    const { container } = render(InsightComponent);
    expect(container).toMatchSnapshot();
  });
});
