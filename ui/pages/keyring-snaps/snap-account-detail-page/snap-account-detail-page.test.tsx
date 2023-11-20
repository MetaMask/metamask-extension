import { fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import messages from '../../../../app/_locales/en/messages.json';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import SnapAccountDetailPage from '.';

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

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => ({
    push: jest.fn(),
  }),
  useParams: jest
    .fn()
    .mockReturnValue({ snapId: 'a51ea3a8-f1b0-4613-9440-b80e2236713b' }),
}));

const renderComponent = (state, props = {}) => {
  const mockStore = configureMockStore([thunk])(state);
  return renderWithProvider(
    <SnapAccountDetailPage {...props} />,
    mockStore,
    `/add-snap-account/${snap.id}`,
  );
};
describe('SnapAccountDetails', () => {
  it('should take a snapshot', () => {
    const { container } = renderComponent(mockState);
    expect(container).toMatchSnapshot();
  });

  it('should render the snap details', async () => {
    const { getAllByText, getByText } = renderComponent(mockState);

    expect(getAllByText(snap.snapTitle).length).toBe(2);
    expect(getByText(snap.snapSlug)).toBeInTheDocument();
    expect(getByText(snap.snapDescription)).toBeInTheDocument();
    snap.tags.forEach((tag) => {
      expect(getByText(tag)).toBeInTheDocument();
    });

    expect(getByText(snap.developer)).toBeInTheDocument();
    expect(getByText(snap.website)).toBeInTheDocument();

    snap.auditUrls.forEach((auditUrl) => {
      expect(getByText(auditUrl)).toBeInTheDocument();
    });

    expect(getByText(snap.version)).toBeInTheDocument();
    expect(getByText(snap.lastUpdated)).toBeInTheDocument();
  });

  it('it should render configure if snap is already installed', async () => {
    const mockStateForConfig = {
      metamask: {
        snapRegistryList: {
          'a51ea3a8-f1b0-4613-9440-b80e2236713b': {
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
    const { queryByText, getByText } = renderComponent(mockStateForConfig);
    expect(queryByText(messages.snapInstall.message)).not.toBeInTheDocument();

    expect(
      queryByText(messages.snapUpdateAvailable.message),
    ).not.toBeInTheDocument();

    const configureButton = getByText(messages.snapConfigure.message);
    expect(configureButton).toBeInTheDocument();
  });

  it('it should render install if snap is not installed', async () => {
    const { queryByText, getByText, getAllByText } = renderComponent(mockState);
    expect(
      queryByText(messages.snapUpdateAvailable.message),
    ).not.toBeInTheDocument();

    expect(queryByText(messages.snapConfigure.message)).not.toBeInTheDocument();

    const installButton = getByText(messages.snapInstall.message);
    expect(installButton).toBeInTheDocument();

    fireEvent.click(installButton);

    // expect(mockInstallSnapFromSnapAccounts).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(
        getAllByText(messages.configureSnapPopupInstallTitle.message).length,
      ).toBe(2);
    });
  });

  it('it should render update if snap update is available', async () => {
    const mockStateForConfig = {
      metamask: {
        snapRegistryList: {
          'a51ea3a8-f1b0-4613-9440-b80e2236713b': {
            id: 'a51ea3a8-f1b0-4613-9440-b80e2236713b',
            snapId: 'npm:@metamask/snap-simple-keyring',
            iconUrl: '',
            snapTitle: 'MetaMask Simple Keyring',
            snapSlug: 'Secure your account with MetaMask Mobile',
            snapDescription:
              'A simple private key is a randomly generated string of characters that is used to sign transactions. This private key is stored securely within this snap.',
            tags: ['EOA'],
            developer: 'MetaMask',
            website: 'https://www.consensys.net/',
            auditUrls: ['auditUrl1', 'auditUrl2'],
            version: '1.0.0',
            lastUpdated: 'April 20, 2023',
          },
        },
        snaps: {
          'npm:@metamask/snap-simple-keyring': {
            id: 'npm:@metamask/snap-simple-keyring',
            origin: 'npm:@metamask/snap-simple-keyring',
            version: '0.0.0',
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
    const { queryByText, getByText } = renderComponent(mockStateForConfig);
    expect(queryByText(messages.snapInstall.message)).not.toBeInTheDocument();

    expect(
      queryByText(messages.snapUpdateAvailable.message),
    ).toBeInTheDocument();

    const configureButton = getByText(messages.snapConfigure.message);
    expect(configureButton).toBeInTheDocument();

    fireEvent.click(configureButton);

    await waitFor(() => {
      expect(
        getByText(messages.configureSnapPopupTitle.message),
      ).toBeInTheDocument();
    });
  });
});
