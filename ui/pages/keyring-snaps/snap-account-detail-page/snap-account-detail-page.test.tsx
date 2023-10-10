import { fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import semver from 'semver';
import messages from '../../../../app/_locales/en/messages.json';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import SnapAccountDetailPage from '.';

const snap = {
  id: 'npm:@metamask/snap-simple-keyring',
  metadata: {
    name: 'MetaMask Simple Keyring',
    author: {
      name: 'MetaMask',
      website: 'https://metamask.github.io/snap-simple-keyring/latest/',
    },
    summary: 'Secure your account with a Pr',
    description:
      'A simple private key is a randomly generated string of characters that is used to sign transactions. This private key is stored securely within this snap.',
    audits: [{ auditor: 'auditor', report: 'report' }],
    category: 'key management',
    support: {},
    tags: ['EOA'],
    sourceCode: 'https://github.com/ChainSafe/aleo-snap',
  },
  versions: {
    '2.0.0': {
      checksum: 'fhKGcx3qfv/93ZWnwW2Q7L0W1STExHOGHDp9VMVZk3Q=',
    },
  },
};

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => ({
    push: jest.fn(),
  }),
  useParams: jest
    .fn()
    .mockReturnValue({ snapId: 'npm:@metamask/snap-simple-keyring' }),
}));

const renderComponent = (state, props = {}) => {
  const mockStore = configureMockStore([thunk])(state);
  return renderWithProvider(
    <SnapAccountDetailPage {...props} />,
    mockStore,
    `/add-snap-account/${encodeURIComponent(snap.id)}`,
  );
};
describe('SnapAccountDetails', () => {
  it('should take a snapshot', () => {
    const { container } = renderComponent(mockState);
    expect(container).toMatchSnapshot();
  });

  it('should render the snap details', async () => {
    const { getAllByText, getByText } = renderComponent(mockState);

    const expectedVersion = Object.keys(snap.versions).sort((a, b) => {
      return semver.compare(a, b);
    })[0];
    expect(getAllByText(snap.metadata.name).length).toBe(2);
    expect(getByText(snap.metadata.summary)).toBeInTheDocument();
    expect(getByText(snap.metadata.description)).toBeInTheDocument();
    snap.metadata.tags.forEach((tag) => {
      expect(getByText(tag)).toBeInTheDocument();
    });

    expect(getByText(snap.metadata.author.name)).toBeInTheDocument();
    expect(getByText(snap.metadata.author.website)).toBeInTheDocument();

    snap.metadata.audits.forEach((audit) => {
      expect(getByText(audit.report)).toBeInTheDocument();
    });

    expect(getByText(expectedVersion)).toBeInTheDocument();
  });

  it('it should render configure if snap is already installed', async () => {
    const mockStateForConfig = {
      metamask: {
        snapRegistryList: {
          verifiedSnaps: {
            'npm:@metamask/snap-simple-keyring': {
              id: 'npm:@metamask/snap-simple-keyring',
              metadata: {
                name: 'MetaMask Simple Keyring',
                author: {
                  name: 'MetaMask',
                  website:
                    'https://metamask.github.io/snap-simple-keyring/latest/',
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
                '0.0.1': {
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
    const { queryByText, getByText } = renderComponent(mockStateForConfig);
    expect(queryByText(messages.snapInstall.message)).not.toBeInTheDocument();

    expect(
      queryByText(messages.snapUpdateAvailable.message),
    ).not.toBeInTheDocument();

    const configureButton = getByText(messages.snapConfigure.message);
    expect(configureButton).toBeInTheDocument();
  });

  it('it should render install if snap is not installed', async () => {
    const mockStateWithoutInstalledSnap = {
      metamask: {
        snapRegistryList: {
          verifiedSnaps: {
            'npm:@metamask/snap-simple-keyring': {
              id: 'npm:@metamask/snap-simple-keyring',
              metadata: {
                name: 'MetaMask Simple Keyring',
                author: {
                  name: 'MetaMask',
                  website:
                    'https://metamask.github.io/snap-simple-keyring/latest/',
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
                '0.0.1': {
                  checksum: 'fhKGcx3qfv/93ZWnwW2Q7L0W1STExHOGHDp9VMVZk3Q=',
                },
              },
            },
          },
        },
        snaps: {},
      },
    };
    const { queryByText, getByText, getAllByText } = renderComponent(
      mockStateWithoutInstalledSnap,
    );
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
          verifiedSnaps: {
            'npm:@metamask/snap-simple-keyring': {
              id: 'npm:@metamask/snap-simple-keyring',
              metadata: {
                name: 'MetaMask Simple Keyring',
                author: {
                  name: 'MetaMask',
                  website:
                    'https://metamask.github.io/snap-simple-keyring/latest/',
                },
                summary: 'Secure your account with a Pr',
                description:
                  'A simple private key is a randomly generated string of characters that is used to sign transactions. This private key is stored securely within this snap.',
                audits: [{ auditor: 'auditor', report: 'report' }],
                category: 'key management',
                support: {},
                tags: ['EOA'],
                sourceCode: 'mock-link',
              },
              versions: {
                '1.0.1': {
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
