import React from 'react';
import configureStore from '../../store/store';
import mockState from '../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../test/jest';
import SnapAccountRedirect from './snap-account-redirect';

const store = configureStore({
  metamask: {
    ...mockState.metamask,
  },
});

// If you're using some kind of global variable (like `global.platform` in your component), you might want to mock it.
global.platform = {
  openTab: jest.fn(),
};

const mockUrl = 'https://metamask.github.io/snap-simple-keyring/1.0.0/';
const mockSnapName = 'Snap Simple Keyring';
const mockSnapId = '@metamask/snap-simple-keyring';
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
        url={''}
        snapName={''}
        isBlockedUrl={false}
        message=""
      />,
      store,
    );
    expect(queryByTestId('snap-account-redirect-message-container')).toBeNull();
  });
});
