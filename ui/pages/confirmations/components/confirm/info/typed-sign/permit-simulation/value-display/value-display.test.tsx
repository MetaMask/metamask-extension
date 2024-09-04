import React from 'react';
import { act } from 'react-dom/test-utils';
import configureMockStore from 'redux-mock-store';

import mockState from '../../../../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../../../../test/lib/render-helpers';
import PermitSimulationValueDisplay from './value-display';

jest.mock('../../../../../../../../store/actions', () => {
  return {
    getTokenStandardAndDetails: jest.fn().mockResolvedValue({ decimals: 4 }),
  };
});

describe('PermitSimulationValueDisplay', () => {
  it('renders component correctly', async () => {
    const mockStore = configureMockStore([])(mockState);

    await act(async () => {
      const { container, findByText } = renderWithProvider(
        <PermitSimulationValueDisplay
          tokenContract="0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
          value="4321"
        />,
        mockStore,
      );

      expect(await findByText('0.432')).toBeInTheDocument();
      expect(container).toMatchSnapshot();
    });
  });
});
