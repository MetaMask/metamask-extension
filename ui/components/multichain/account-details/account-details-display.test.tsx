import React from 'react';
import { fireEvent, waitFor } from '@testing-library/dom';

import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { toChecksumHexAddress } from '../../../../shared/modules/hexstring-utils';
import configureStore from '../../../store/store';
import * as EIP7702NetworkUtils from '../../../pages/confirmations/hooks/useEIP7702Networks';

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
      accountType={'eip155:eoa'}
      address={ADDRESS_MOCK}
      onExportClick={() => {
        // Intentionally empty
      }}
    />,
    configureStore(mockState),
  );
}

describe('AccountDetailsDisplay', () => {
  it('render tabs type and details if 7702 network are present', async () => {
    jest.spyOn(EIP7702NetworkUtils, 'useEIP7702Networks').mockReturnValue({
      pending: false,
      networkSupporting7702Present: true,
      network7702List: [],
    });
    const { getByText } = renderComponent();
    expect(getByText('0x0dcd5d8865...e70be3e7bc')).toBeInTheDocument();
    expect(getByText('Type')).toBeInTheDocument();
    expect(getByText('Details')).toBeInTheDocument();
  });

  it('does not render tabs type and details if 7702 network are not present', async () => {
    jest.spyOn(EIP7702NetworkUtils, 'useEIP7702Networks').mockReturnValue({
      pending: false,
      networkSupporting7702Present: false,
      network7702List: [],
    });
    const { getByText, queryByText } = renderComponent();
    expect(getByText('0x0dcd5d8865...e70be3e7bc')).toBeInTheDocument();
    expect(queryByText('Type')).not.toBeInTheDocument();
    expect(queryByText('Details')).not.toBeInTheDocument();
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
