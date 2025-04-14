// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import React from 'react';
import configureStore from '../../../../store/store';
// Use mock-send-state to have some identites being populated
import mockState from '../../../../../test/data/mock-send-state.json';
import { renderWithProvider } from '../../../../../test/jest';
// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import SnapAccountSuccessMessage from './SnapAccountSuccessMessage';

const store = configureStore(mockState);

// If you're using some kind of global variable (like `global.platform` in your component), you might want to mock it.
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
// eslint-disable-next-line no-restricted-globals
global.platform = {
  openTab: jest.fn(),
  closeCurrentWindow: jest.fn(),
};

// Use first account from our mock state
const mockAddress = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';
const mockMessage = 'Snap Account Success';
const mockLearnMoreLink = 'https://learn-more.com';

describe('<SnapAccountSuccessMessage />', () => {
  it('renders success text without learn more link', () => {
    const { queryByTestId, getByTestId } = renderWithProvider(
      <SnapAccountSuccessMessage address={mockAddress} message={mockMessage} />,
      store,
    );

    expect(getByTestId('snap-account-success-message-text')).toHaveTextContent(
      mockMessage,
    );
    expect(
      queryByTestId('snap-account-success-message-learn-more-link'),
    ).toBeNull();
  });

  it('renders success text with learn more link', () => {
    const { getByTestId } = renderWithProvider(
      <SnapAccountSuccessMessage
        address={mockAddress}
        message={mockMessage}
        learnMoreLink={mockLearnMoreLink}
      />,
      store,
    );

    expect(getByTestId('snap-account-success-message-text')).toHaveTextContent(
      mockMessage,
    );
    expect(
      getByTestId('snap-account-success-message-learn-more-link'),
    ).toHaveAttribute('href', mockLearnMoreLink);
  });
});
