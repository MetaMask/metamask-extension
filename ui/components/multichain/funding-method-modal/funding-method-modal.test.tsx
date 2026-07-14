import React from 'react';
import { fireEvent } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import mockState from '../../../../test/data/mock-state.json';
import { FundingMethodModal } from './funding-method-modal';

const mockGoToBuy = jest.fn().mockResolvedValue(true);
jest.mock(
  '../../../hooks/ramps/useRampsNavigation/useRampsNavigation',
  () => ({
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    __esModule: true,
    default: () => ({ goToBuy: mockGoToBuy }),
  }),
);

const mockStore = configureMockStore([thunk]);

describe('FundingMethodModal', () => {
  let store = configureMockStore([thunk])(mockState);

  beforeEach(() => {
    store = mockStore(mockState);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render the modal when isOpen is true', () => {
    const { getByTestId, getByText } = renderWithProvider(
      <FundingMethodModal
        isOpen={true}
        onClose={jest.fn()}
        title="Test Modal"
        onClickReceive={jest.fn()}
        data-testid="funding-method-modal"
      />,
      store,
    );

    expect(getByTestId('funding-method-modal')).toBeInTheDocument();
    expect(getByText('Test Modal')).toBeInTheDocument();
  });

  it('should not render the modal when isOpen is false', () => {
    const { queryByTestId } = renderWithProvider(
      <FundingMethodModal
        isOpen={false}
        onClose={jest.fn()}
        title="Test Modal"
        onClickReceive={jest.fn()}
        data-testid="funding-method-modal"
      />,
      store,
    );

    expect(queryByTestId('funding-method-modal')).toBeNull();
  });

  it('routes the Token Marketplace item through goToBuy with the current chain', () => {
    const { getByText } = renderWithProvider(
      <FundingMethodModal
        isOpen={true}
        onClose={jest.fn()}
        title="Test Modal"
        onClickReceive={jest.fn()}
        data-testid="funding-method-modal"
      />,
      store,
    );

    fireEvent.click(getByText(messages.tokenMarketplace.message));
    // Preserves the chain context it passed to the Portfolio deeplink today;
    // goToBuy handles the flag-off Portfolio fallback internally.
    expect(mockGoToBuy).toHaveBeenCalledWith({ chainId: '0x5' });
  });

  it('should call onClickReceive when the Receive Crypto item is clicked', () => {
    const onClickReceive = jest.fn();
    const { getByText } = renderWithProvider(
      <FundingMethodModal
        isOpen={true}
        onClose={jest.fn()}
        title="Test Modal"
        onClickReceive={onClickReceive}
        data-testid="funding-method-modal"
      />,
      store,
    );

    fireEvent.click(getByText(messages.receiveCrypto.message));
    expect(onClickReceive).toHaveBeenCalled();
  });

  it('should open a new tab with the correct URL when Transfer Crypto item is clicked', () => {
    global.platform.openTab = jest.fn();

    const { getByText } = renderWithProvider(
      <FundingMethodModal
        isOpen={true}
        onClose={jest.fn()}
        title="Test Modal"
        onClickReceive={jest.fn()}
        data-testid="funding-method-modal"
      />,
      store,
    );

    fireEvent.click(getByText(messages.transferCrypto.message));
    expect(global.platform.openTab).toHaveBeenCalledWith({
      url: expect.stringContaining('transfer'),
    });
  });
});
