import { fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import messages from '../../../../app/_locales/en/messages.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import SnapCard from './snap-card';

const mockHistoryPush = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => ({
    push: mockHistoryPush,
  }),
}));

const snap = {
  id: 'a51ea3a8-f1b0-4613-9440-b80e2236713b',
  snapId: 'npm:@metamask/snap-simple-keyring',
  iconUrl: '',
  snapTitle: 'Metamask Simple Keyring',
  snapSlug: 'Secure your account with MetaMask Mobile',
  snapDescription:
    'A simple private key is a randomly generated string of characters that is used to sign transactions. This private key is stored securely within this snap.',
  tags: ['EOA'],
  developer: 'Metamask',
  website: 'https://www.consensys.net/',
  auditUrls: ['auditUrl1', 'auditUrl2'],
  version: '1.0.0',
  lastUpdated: 'April 20, 2023',
};

const renderComponent = (props) => {
  const mockStore = configureMockStore([thunk])({});
  return renderWithProvider(<SnapCard {...props} />, mockStore);
};
describe('SnapCard', () => {
  it('should render', () => {
    const { container } = renderComponent(snap);
    expect(container).toMatchSnapshot();
  });

  it('should show details button', async () => {
    const { getByText } = renderComponent({ ...snap, isInstalled: false });
    expect(getByText(snap.snapTitle)).toBeInTheDocument();
    expect(getByText(snap.snapSlug)).toBeInTheDocument();
    const installButton = getByText(messages.details.message);

    expect(installButton).toBeInTheDocument();
    fireEvent.click(installButton);
    await waitFor(() => {
      expect(mockHistoryPush).toHaveBeenCalledWith(
        `/add-snap-account/${snap.id}`,
      );
    });
  });

  it('should show configure button', async () => {
    const { getByText } = renderComponent({ ...snap, isInstalled: true });
    expect(getByText(snap.snapTitle)).toBeInTheDocument();
    expect(getByText(snap.snapSlug)).toBeInTheDocument();
    const configureButton = getByText(messages.snapConfigure.message);

    expect(configureButton).toBeInTheDocument();
    fireEvent.click(configureButton);

    // shows popover
    await waitFor(() => {
      expect(
        getByText(messages.configureSnapPopupTitle.message),
      ).toBeInTheDocument();
    });
  });

  it('should show `Update Available` tag', () => {
    const { getByText } = renderComponent({
      ...snap,
      isInstalled: true,
      updateAvailable: true,
    });
    expect(getByText(messages.snapUpdateAvailable.message)).toBeInTheDocument();
  });

  it('should direct to snap details when the card is clicked', async () => {
    const { getByTestId } = renderComponent({
      ...snap,
      isInstalled: false,
      updateAvailable: false,
    });

    const card = getByTestId('key-management-snap');

    fireEvent.click(card);

    await waitFor(() => {
      expect(mockHistoryPush).toHaveBeenCalled();
    });
  });
});
