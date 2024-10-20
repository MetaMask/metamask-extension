import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/jest';
import InstitutionalNotificationsModal from './institutional-notifications-modal';

const mockStore = configureMockStore([thunk]);

// Mock the useI18nContext hook
jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
}));

describe('InstitutionalNotificationsModal', () => {
  let store: ReturnType<typeof mockStore>;

  beforeEach(() => {
    store = mockStore({});
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('renders the modal when it has not been shown before', () => {
    renderWithProvider(<InstitutionalNotificationsModal />, store);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('whatsNew')).toBeInTheDocument();
    expect(
      screen.getByText('institutionalNotificationsModalTitle'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('institutionalNotificationsModalDescription'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('institutionalNotificationsModalSubtitle'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('institutionalNotificationsModalDescription2'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('institutionalNotificationsModalDescription3'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'institutionalNotificationsModalFindOutMore',
      }),
    ).toBeInTheDocument();
  });

  it('does not render the modal if it has been shown before', () => {
    localStorage.setItem('institutionalOnRampsModalShown', 'true');

    renderWithProvider(<InstitutionalNotificationsModal />, store);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens the link and closes the modal when "Find Out More" button is clicked', () => {
    const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);

    renderWithProvider(<InstitutionalNotificationsModal />, store);

    const findOutMoreButton = screen.getByRole('button', {
      name: 'institutionalNotificationsModalFindOutMore',
    });
    fireEvent.click(findOutMoreButton);

    expect(openSpy).toHaveBeenCalledWith(
      'https://institutional.metamask.io/',
      '_blank',
      'noopener,noreferrer',
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(localStorage.getItem('institutionalOnRampsModalShown')).toBe('true');

    openSpy.mockRestore();
  });
});
