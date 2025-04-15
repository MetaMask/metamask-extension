import React from 'react';
import { fireEvent, waitFor } from '@testing-library/dom';

import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { toChecksumHexAddress } from '../../../../shared/modules/hexstring-utils';
import configureStore from '../../../store/store';
import { AccountDetailsDisplay } from './account-details-display';

const mockCopy = jest.fn();
jest.mock('../../../hooks/useCopyToClipboard', () => ({
  useCopyToClipboard: () => [null, mockCopy],
}));

const ADDRESS_MOCK = Object.values(
  mockState.metamask.internalAccounts.accounts,
)[0].address;

function renderComponent() {
  return renderWithProvider(
    <AccountDetailsDisplay
      accounts={[]}
      accountName={''}
      address={ADDRESS_MOCK}
      onExportClick={() => {
        // Intentionally empty
      }}
    />,
    configureStore(mockState),
  );
}

describe('AccountDetailsDisplay', () => {
  it('renders tabs type and details', async () => {
    const { getByText } = renderComponent();
    expect(getByText('0x0dcd5d8865...e70be3e7bc')).toBeInTheDocument();
    expect(getByText('Type')).toBeInTheDocument();
    expect(getByText('Details')).toBeInTheDocument();
  });

  it('renders button to copy address', async () => {
    const { container } = renderComponent();
    const copyButton = container.querySelector(
      '[data-testid="address-copy-button-text"]',
    );
    expect(copyButton).toBeInTheDocument();
    fireEvent.click(copyButton as HTMLElement);

    await waitFor(() => {
      expect(mockCopy).toHaveBeenCalledWith(
        toChecksumHexAddress(ADDRESS_MOCK).toLowerCase(),
      );
    });
  });
});
