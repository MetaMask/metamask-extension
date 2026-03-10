import React from 'react';
import { render, waitFor } from '@testing-library/react';

import { DEFAULT_ROUTE } from '../../../../helpers/constants/routes';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

let mockCurrentConfirmation: unknown = { id: 'mock-confirmation' };

jest.mock('../../hooks/useCurrentConfirmation', () => () => ({
  currentConfirmation: mockCurrentConfirmation,
}));

jest.mock('../../hooks/useSyncConfirmPath', () => () => undefined);

// eslint-disable-next-line import/first
import { ConfirmContextProvider } from '.';

describe('ConfirmContextProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentConfirmation = { id: 'mock-confirmation' };
  });

  it('navigates to Activity tab when confirmation disappears', async () => {
    const { rerender } = render(
      <ConfirmContextProvider>
        <div />
      </ConfirmContextProvider>,
    );

    expect(mockNavigate).not.toHaveBeenCalled();

    mockCurrentConfirmation = undefined;
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
