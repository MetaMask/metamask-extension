import { fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import messages from '../../../../app/_locales/en/messages.json';
import { KEY_MANAGEMENT_SNAPS } from '../../../../app/scripts/controllers/permissions/snaps/keyManagementSnaps';
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
    snaps: {
      'npm:@metamask/snap-simple-keyring': {
        id: 'npm:@metamask/snap-simple-keyring',
        origin: 'npm:@metamask/snap-simple-keyring',
        version: '5.1.2',
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
  it('should take a snapshot', () => {
    const { container } = renderComponent();
    expect(container).toMatchSnapshot();
  });

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
    const keymanagementSnaps = getAllByTestId('key-management-snap');
    expect(keymanagementSnaps.length).toBe(
      Object.values(KEY_MANAGEMENT_SNAPS).length,
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
