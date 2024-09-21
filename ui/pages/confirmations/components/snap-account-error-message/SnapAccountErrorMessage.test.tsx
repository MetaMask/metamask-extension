import React from 'react';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/jest';
import SnapAccountErrorMessage from './SnapAccountErrorMessage';

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

// Use first account from our mock state
const mockMessage = 'Snap Account Error';
const mockError = 'Snap Account Custom Error';
const mockLearnMoreLink = 'https://learn-more.com';

describe('<SnapAccountErrorMessage />', () => {
  it('renders error text without learn more link', () => {
    const { queryByTestId, getByTestId } = renderWithProvider(
      <SnapAccountErrorMessage message={mockMessage} />,
      store,
    );

    expect(getByTestId('snap-account-error-message-text')).toHaveTextContent(
      mockMessage,
    );
    expect(
      queryByTestId('snap-account-error-message-learn-more-link'),
    ).toBeNull();
  });

  it('renders error text with learn more link', () => {
    const { getByTestId } = renderWithProvider(
      <SnapAccountErrorMessage
        message={mockMessage}
        learnMoreLink={mockLearnMoreLink}
      />,
      store,
    );

    expect(getByTestId('snap-account-error-message-text')).toHaveTextContent(
      mockMessage,
    );
    expect(
      getByTestId('snap-account-error-message-learn-more-link'),
    ).toHaveAttribute('href', mockLearnMoreLink);
  });

  it('renders error text with custom error', () => {
    const { queryByTestId, getByTestId } = renderWithProvider(
      <SnapAccountErrorMessage message={mockMessage} error={mockError} />,
      store,
    );

    expect(getByTestId('snap-account-error-message-text')).toHaveTextContent(
      mockMessage,
    );
    expect(
      queryByTestId('snap-account-error-message-learn-more-link'),
    ).toBeNull();
    expect(getByTestId('snap-account-error-message-error')).not.toBeNull();
  });

  it('renders error text with learn more link and custom error', () => {
    const { getByTestId } = renderWithProvider(
      <SnapAccountErrorMessage
        message={mockMessage}
        learnMoreLink={mockLearnMoreLink}
        error={mockError}
      />,
      store,
    );

    expect(getByTestId('snap-account-error-message-text')).toHaveTextContent(
      mockMessage,
    );
    expect(
      getByTestId('snap-account-error-message-learn-more-link'),
    ).toHaveAttribute('href', mockLearnMoreLink);
    expect(getByTestId('snap-account-error-message-error')).not.toBeNull();
  });
});
