import { fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import messages from '../../../../app/_locales/en/messages.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import NewSnapAccountPage from '.';

const mockHistoryPush = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => ({
    push: mockHistoryPush,
  }),
}));

const mockState = {
  metamask: {
    snapRegistryList: {
      verifiedSnaps: {
        'npm:@metamask/snap-simple-keyring': {
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
        },
      },
    },
    snaps: {
      'npm:@metamask/snap-simple-keyring': {
        id: 'npm:@metamask/snap-simple-keyring',
        origin: 'npm:@metamask/snap-simple-keyring',
        version: '1.0.0',
        iconUrl: null,
        initialPermissions: {
          'endowment:manageAccount': {},
        },
        manifest: {
          description: 'An example keymanagement snap',
          proposedName: 'Example Key Management Test Snap',
          repository: {
            type: 'git',
            url: 'https://github.com/MetaMask/snap-simple-keyring.git',
          },
          source: {
            location: {
              npm: {
                filePath: 'dist/bundle.js',
                packageName: '@metamask/test-snap-account',
                registry: 'https://registry.npmjs.org',
              },
            },
            shasum: 'L1k+dT9Q+y3KfIqzaH09MpDZVPS9ZowEh9w01ZMTWMU=',
          },
          version: '0.0.1',
        },
        versionHistory: [
          {
            date: 1680686075921,
            origin: 'https://metamask.github.io',
            version: '0.0.1',
          },
        ],
      },
    },
  },
};

const renderComponent = (props = {}) => {
  const mockStore = configureMockStore([])(mockState);
  return renderWithProvider(<NewSnapAccountPage {...props} />, mockStore);
};

describe('NewSnapAccountPage', () => {
  it('should render the popup', async () => {
    const { getByText } = renderComponent();
    const popupTitle = getByText(messages.settingAddSnapAccount.message);
    expect(popupTitle).toBeInTheDocument();

    const closeButton = getByText(messages.getStarted.message);
    await fireEvent.click(closeButton);
    await waitFor(() => {
      expect(popupTitle).not.toBeInTheDocument();
    });
  });

  it('should render the texts', async () => {
    const { getByText } = renderComponent();
    expect(
      getByText(messages.settingAddSnapAccount.message),
    ).toBeInTheDocument();
    expect(
      getByText(messages.addSnapAccountModalDescription.message),
    ).toBeInTheDocument();
  });

  it('should render all the keymanagement snaps', async () => {
    const { getAllByTestId } = renderComponent();
    const keyManagementSnaps = getAllByTestId('key-management-snap');
    expect(keyManagementSnaps.length).toBe(
      Object.values(mockState.metamask.snapRegistryList).length,
    );
  });

  it('should go to snap detail page on click of snap carot', async () => {
    const { getAllByTestId } = renderComponent();
    const iconCarot = getAllByTestId('to-snap-detail')[0];

    await fireEvent.click(iconCarot);

    await waitFor(() => {
      expect(mockHistoryPush).toHaveBeenCalled();
    });
  });

  it('should show configure button after clicking', async () => {
    const { getByTestId, getByText } = renderComponent();
    const configureButton = getByTestId('configure-snap-button');

    await fireEvent.click(configureButton);
    await waitFor(() => {
      const configureSnapTitleInPopup = getByText(
        messages.configureSnapPopupTitle.message,
      );
      expect(configureSnapTitleInPopup).toBeInTheDocument();
    });

    const closeButton = getByText(messages.getStarted.message);
    await fireEvent.click(closeButton);

    await waitFor(() => {
      const configureSnapTitleInPopup = getByText(
        messages.configureSnapPopupTitle.message,
      );
      expect(configureSnapTitleInPopup).toBeInTheDocument();
    });
  });
});
