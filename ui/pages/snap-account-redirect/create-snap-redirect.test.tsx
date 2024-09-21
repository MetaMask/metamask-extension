import React from 'react';
import configureStore from '../../store/store';
import mockState from '../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../test/jest';
import { TEST_SNAPS_SIMPLE_KEYRING_WEBSITE_URL } from '../../../test/e2e/constants';
import SnapAccountRedirect from './snap-account-redirect';

const store = configureStore({
  metamask: {
    ...mockState.metamask,
  },
});

// If you're using some kind of global variable (like `global.platform` in your component), you might want to mock it.
global.platform = {
  openTab: jest.fn(),
  closeCurrentWindow: jest.fn(),
};

const mockUrl = TEST_SNAPS_SIMPLE_KEYRING_WEBSITE_URL;
const mockSnapName = 'Snap Simple Keyring';
const mockSnapId = 'npm:@metamask/snap-simple-keyring';
const mockMessage = 'Redirecting to Snap Simple Keyring';

describe('<SnapAccountRedirect />', () => {
  it('renders the url and message when provided and isBlockedUrl is false', () => {
    const { getByTestId, container } = renderWithProvider(
      <SnapAccountRedirect
        snapId={mockSnapId}
        url={mockUrl}
        snapName={mockSnapName}
        isBlockedUrl={false}
        message={mockMessage}
      />,
      store,
    );

    expect(getByTestId('snap-account-redirect-content-title'));
    expect(getByTestId('snap-account-redirect-message')).toHaveTextContent(
      mockMessage,
    );
    expect(
      getByTestId('snap-account-redirect-url-display-box'),
    ).toHaveTextContent(mockUrl);
    expect(container).toMatchSnapshot();
  });

  it('renders alert banner and does not render message or url when isBlockedUrl is true', () => {
    const { queryByTestId } = renderWithProvider(
      <SnapAccountRedirect
        snapId={mockSnapId}
        url={mockUrl}
        snapName={mockSnapName}
        isBlockedUrl={true}
        message={mockMessage}
      />,
      store,
    );

    expect(
      queryByTestId('snap-account-redirect-content-description'),
    ).toBeNull();
    expect(queryByTestId('snap-account-redirect-message')).toBeNull();
    expect(queryByTestId('snap-account-redirect-url-display-box')).toBeNull();
    expect(
      queryByTestId('snap-account-redirect-content-blocked-url-banner'),
    ).toBeDefined();
  });

  it('does not render URL display box when URL is empty', () => {
    const { queryByTestId } = renderWithProvider(
      <SnapAccountRedirect
        snapId={mockSnapId}
        url=""
        snapName={mockSnapName}
        isBlockedUrl={false}
        message={mockMessage}
      />,
      store,
    );
    expect(queryByTestId('snap-account-redirect-message')).toHaveTextContent(
      mockMessage,
    );
    expect(queryByTestId('snap-account-redirect-url-display-box')).toBeNull();
  });

  it('does not render message when message is empty', () => {
    const { queryByTestId } = renderWithProvider(
      <SnapAccountRedirect
        snapId={mockSnapId}
        url={mockUrl}
        snapName={mockSnapName}
        isBlockedUrl={false}
        message=""
      />,
      store,
    );

    expect(
      queryByTestId('snap-account-redirect-url-display-box'),
    ).toHaveTextContent(mockUrl);
    expect(queryByTestId('snap-account-redirect-message')).toBeNull();
  });

  it('does not render message/url box when message and url are empty', () => {
    const { queryByTestId } = renderWithProvider(
      <SnapAccountRedirect
        snapId={mockSnapId}
        url=""
        snapName=""
        isBlockedUrl={false}
        message=""
      />,
      store,
    );
    expect(queryByTestId('snap-account-redirect-message-container')).toBeNull();
  });
  it('calls onSubmit prop when provided and the redirect button is clicked', () => {
    const mockOnSubmit = jest.fn();
    const { getByTestId } = renderWithProvider(
      <SnapAccountRedirect
        snapId={mockSnapId}
        url={mockUrl}
        snapName={mockSnapName}
        isBlockedUrl={false}
        message={mockMessage}
        onSubmit={mockOnSubmit}
      />,
      store,
    );

    const redirectUrlIcon = getByTestId('snap-account-redirect-url-icon');
    redirectUrlIcon.click();

    expect(mockOnSubmit).toHaveBeenCalled();
    expect(global.platform.openTab).toHaveBeenCalledWith({ url: mockUrl });
  });
});
