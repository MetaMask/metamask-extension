import React from 'react';
import { render } from '@testing-library/react';
import { createMemoryRouterWrapper } from '../../../test/lib/render-helpers-navigate';
import { submitRequestToBackground } from '../../store/background-connection';
import PerpsLayout from './perps-layout';

jest.mock('../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn().mockResolvedValue(undefined),
}));

describe('PerpsLayout', () => {
  const mockSubmitRequestToBackground = jest.mocked(submitRequestToBackground);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('signals perpsViewActive on mount and unmount', () => {
    const { unmount } = render(<PerpsLayout />, {
      wrapper: createMemoryRouterWrapper(),
    });

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
