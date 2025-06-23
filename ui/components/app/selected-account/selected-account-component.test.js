import React from 'react';
import configureMockStore from 'redux-mock-store';
import copyToClipboard from 'copy-to-clipboard';
import { fireEvent, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import mockState from '../../../../test/data/mock-state.json';
import { COPY_OPTIONS } from '../../../../shared/constants/copy';
import SelectedAccount from '.';

const mockSelectedAccount = {
  address: '0x0DCD5D886577d5081B0c52e242Ef29E70Be3E7bc',
  id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
  metadata: {
    name: 'Test Account',
    keyring: {
      type: 'HD Key Tree',
    },
  },
  options: {},
  methods: [
    'personal_sign',
    'eth_signTransaction',
    'eth_signTypedData_v1',
    'eth_signTypedData_v3',
    'eth_signTypedData_v4',
  ],
  type: 'eip155:eoa',
};

jest.mock('copy-to-clipboard');

jest.mock('../../../selectors', () => {
  const mockGetAccountType = jest.fn(() => undefined);
  const mockGetSelectedAccount = jest.fn(() => mockSelectedAccount);

  return {
    getSelectedAddress: jest.fn(() => '0xselectedaddress'),
    getAccountType: mockGetAccountType,
    getSelectedInternalAccount: mockGetSelectedAccount,
    getCurrentChainId: jest.fn(() => '0x5'),
  };
});

jest.mock('../../../selectors/multi-srp/multi-srp', () => ({
  getShouldShowSeedPhraseReminder: () => false,
}));

describe('SelectedAccount Component', () => {
  const mockStore = configureMockStore()(mockState);

  it('should match snapshot', () => {
    const { container } = renderWithProvider(<SelectedAccount />, mockStore);
    expect(container).toMatchSnapshot();
  });

  it('should render correctly', async () => {
    const { container, getByText, getByTestId } = renderWithProvider(
      <SelectedAccount />,
      mockStore,
    );

    const tooltipTitle = await waitFor(() =>
      container.querySelector('[data-original-title="Copy to clipboard"]'),
    );

    expect(tooltipTitle).toBeInTheDocument();
    expect(getByText(mockSelectedAccount.metadata.name)).toBeInTheDocument();
    expect(getByTestId('selected-account-copy')).toBeInTheDocument();
  });

  it('should copy checksum address to clipboard when button is clicked', () => {
    const { queryByTestId } = renderWithProvider(
      <SelectedAccount />,
      mockStore,
    );

    const button = queryByTestId('selected-account-click');

    fireEvent.click(button);

    expect(copyToClipboard).toHaveBeenCalledWith(
      '0x0DCD5D886577d5081B0c52e242Ef29E70Be3E7bc',
      COPY_OPTIONS,
    );
  });
});
