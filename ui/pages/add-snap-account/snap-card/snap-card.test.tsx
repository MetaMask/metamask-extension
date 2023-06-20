import { fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import messages from '../../../../app/_locales/en/messages.json';
import { KEY_MANAGEMENT_SNAPS } from '../../../../app/scripts/controllers/permissions/snaps/keyManagementSnaps';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import SnapCard from './snap-card';

const mockHistoryPush = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => ({
    push: mockHistoryPush,
  }),
}));

const snap = Object.values(KEY_MANAGEMENT_SNAPS)[0];

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
    expect(getByText(snap.snapTitle)).toBeInTheDocument();
    expect(getByText(snap.snapSlug)).toBeInTheDocument();
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
});
