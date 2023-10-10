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
  id: 'npm:@metamask/snap-simple-keyring',
  metadata: {
    name: 'MetaMask Simple Keyring',
    author: {
      name: 'MetaMask',
      website: 'https://metamask.github.io/snap-simple-keyring/latest/',
    },
    summary: 'Secure your account with a Private Key',
    description:
      'A simple private key is a randomly generated string of characters that is used to sign transactions. This private key is stored securely within this snap.',
    audits: [],
    category: 'key management',
    support: {},
    sourceCode: 'https://github.com/metamask/snap-simple-keyring',
  },
  versions: {
    '2.2.4': {
      checksum: 'fhKGcx3qfv/93ZWnwW2Q7L0W1STExHOGHDp9VMVZk3Q=',
    },
  },
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

  it('should show install button', async () => {
    const { getByText } = renderComponent({ ...snap, isInstalled: false });
    expect(getByText(snap.metadata.name)).toBeInTheDocument();
    expect(getByText(snap.metadata.summary)).toBeInTheDocument();
    const installButton = getByText(messages.install.message);

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
    expect(getByText(snap.metadata.name)).toBeInTheDocument();
    expect(getByText(snap.metadata.summary)).toBeInTheDocument();
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
