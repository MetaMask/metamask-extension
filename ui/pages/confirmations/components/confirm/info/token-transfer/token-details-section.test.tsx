import React from 'react';
import configureMockStore from 'redux-mock-store';
import { getMockTokenTransferConfirmState } from '../../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../../test/lib/confirmations/render-helpers';
import { TokenDetailsSection } from './token-details-section';

jest.mock(
  '../../../../../../components/app/alert-system/contexts/alertMetricsContext',
  () => ({
    useAlertMetrics: jest.fn(() => ({
      trackAlertMetrics: jest.fn(),
    })),
  }),
);

describe('TokenDetailsSection', () => {
  it('renders correctly', () => {
    const state = getMockTokenTransferConfirmState({});
    const mockStore = configureMockStore([])(state);
    const { container } = renderWithConfirmContextProvider(
      <TokenDetailsSection />,
      mockStore,
    );
    expect(container).toMatchSnapshot();
  });
});
