import * as React from 'react';
import { useSelector } from 'react-redux';
import configureStore from 'redux-mock-store';
import mockState from '../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers';
import {
  getQueuedRequestCount,
  pendingApprovalsSortedSelector,
} from '../../../../../selectors';
import { QueuedRequestsBannerAlert } from './queued-requests-banner-alert';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));

jest.mock('../../../../../selectors', () => ({
  ...jest.requireActual('../../../../../selectors'),
  getQueuedRequestCount: jest.fn(),
  pendingApprovalsSortedSelector: jest.fn(),
}));

describe('<QueuedRequestsBannerAlert />', () => {
  const useSelectorMock = useSelector as jest.Mock;

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should render component without banner', () => {
    useSelectorMock.mockImplementation((selector) => {
      if (selector === getQueuedRequestCount) {
        return 0;
      } else if (selector === pendingApprovalsSortedSelector) {
        return [
          {
            id: '741bad30-45b6-11ef-b6ec-870d18dd6c01',
            origin: 'http://127.0.0.1:8080',
            type: 'transaction',
            time: 1721383540624,
            requestData: {
              txId: '741bad30-45b6-11ef-b6ec-870d18dd6c01',
            },
            requestState: null,
            expectsResult: true,
          },
        ];
      }
      return undefined;
    });

    const store = configureStore()(mockState);

    const { container } = renderWithProvider(
      <QueuedRequestsBannerAlert />,
      store,
    );

    expect(container).toMatchSnapshot();
  });

  it('should render component with banner', () => {
    useSelectorMock.mockImplementation((selector) => {
      if (selector === getQueuedRequestCount) {
        return 5;
      } else if (selector === pendingApprovalsSortedSelector) {
        return [
          {
            id: '741bad30-45b6-11ef-b6ec-870d18dd6c01',
            origin: 'http://127.0.0.1:8080',
            type: 'transaction',
            time: 1721383540624,
            requestData: {
              txId: '741bad30-45b6-11ef-b6ec-870d18dd6c01',
            },
            requestState: null,
            expectsResult: true,
          },
        ];
      }
      return undefined;
    });

    const store = configureStore()(mockState);

    const { container } = renderWithProvider(
      <QueuedRequestsBannerAlert />,
      store,
    );

    expect(container).toMatchSnapshot();
  });
});
