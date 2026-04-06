import React from 'react';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import configureStore from '../../store/store';
import { submitRequestToBackground } from '../../store/background-connection';
import mockState from '../../../test/data/mock-state.json';
import PerpsLayout from './perps-layout';

jest.mock('../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn().mockResolvedValue(undefined),
}));

describe('PerpsLayout', () => {
  const mockSubmitRequestToBackground = jest.mocked(submitRequestToBackground);
  const store = configureStore({
    metamask: {
      ...mockState.metamask,
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('signals perpsViewActive on mount and unmount', () => {
    const { unmount } = renderWithProvider(<PerpsLayout />, store);

    expect(mockSubmitRequestToBackground).toHaveBeenNthCalledWith(
      1,
      'perpsViewActive',
      [true],
    );

    unmount();

    expect(mockSubmitRequestToBackground).toHaveBeenNthCalledWith(
      2,
      'perpsViewActive',
      [false],
    );
  });
});
