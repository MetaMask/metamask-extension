import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { useSelector } from 'react-redux';

import { DEFAULT_ROUTE } from '../../../../helpers/constants/routes';
import useCurrentConfirmation from '../../hooks/useCurrentConfirmation';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));

jest.mock('../../hooks/useCurrentConfirmation', () => jest.fn());

jest.mock('../../hooks/useSyncConfirmPath', () => () => undefined);

// eslint-disable-next-line import/first
import { ConfirmContextProvider } from '.';

describe('ConfirmContextProvider', () => {
  const mockUseSelector = jest.mocked(useSelector);
  const mockUseCurrentConfirmation = jest.mocked(useCurrentConfirmation);

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSelector.mockReturnValue(false);
    mockUseCurrentConfirmation.mockReturnValue({
      currentConfirmation: { id: 'mock-confirmation' },
    });
  });

  it('navigates to Activity tab when confirmation disappears', async () => {
    const { rerender } = render(
      <ConfirmContextProvider>
        <div />
      </ConfirmContextProvider>,
    );

    expect(mockNavigate).not.toHaveBeenCalled();

    mockUseCurrentConfirmation.mockReturnValue({
      currentConfirmation: undefined,
    });

    rerender(
      <ConfirmContextProvider>
        <div />
      </ConfirmContextProvider>,
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        `${DEFAULT_ROUTE}?tab=activity`,
        {
          replace: true,
        },
      );
    });
  });
});
