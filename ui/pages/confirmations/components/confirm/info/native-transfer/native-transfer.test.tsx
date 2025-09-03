import React from 'react';
import configureMockStore from 'redux-mock-store';
import { useLocation } from 'react-router-dom';

import { getMockTokenTransferConfirmState } from '../../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../../test/lib/confirmations/render-helpers';
import NativeTransferInfo from './native-transfer';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: jest.fn(),
}));

jest.mock(
  '../../../../../../components/app/alert-system/contexts/alertMetricsContext',
  () => ({
    useAlertMetrics: jest.fn(() => ({
      trackAlertMetrics: jest.fn(),
    })),
  }),
);

jest.mock('../../../../../../store/actions', () => ({
  ...jest.requireActual('../../../../../../store/actions'),
  getGasFeeTimeEstimate: jest.fn().mockResolvedValue({
    lowerTimeBound: 0,
    upperTimeBound: 60000,
  }),
}));

describe('NativeTransferInfo', () => {
  const useLocationMock = jest.mocked(useLocation);

  beforeEach(() => {
    jest.resetAllMocks();

    useLocationMock.mockReturnValue({
      search: '',
    } as unknown as ReturnType<typeof useLocationMock>);
  });

  it('renders correctly', () => {
    const state = getMockTokenTransferConfirmState({});
    const mockStore = configureMockStore([])(state);
    const { container } = renderWithConfirmContextProvider(
      <NativeTransferInfo />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });
});
