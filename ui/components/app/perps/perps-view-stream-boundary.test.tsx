import React from 'react';
import { render, screen } from '@testing-library/react';
import { submitRequestToBackground } from '../../../store/background-connection';
import { PerpsViewStreamBoundary } from './perps-view-stream-boundary';

jest.mock('../../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn().mockResolvedValue(undefined),
}));

describe('PerpsViewStreamBoundary', () => {
  const mockSubmitRequestToBackground = jest.mocked(submitRequestToBackground);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('signals perpsViewActive on mount and unmount', () => {
    const { unmount } = render(
      <PerpsViewStreamBoundary>
        <div data-testid="perps-content" />
      </PerpsViewStreamBoundary>,
    );

    expect(screen.getByTestId('perps-content')).toBeInTheDocument();
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
