import React from 'react';
import configureMockStore from 'redux-mock-store';
import copyToClipboard from 'copy-to-clipboard';
import { fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import mockState from '../../../../test/data/mock-state.json';
import { COPY_OPTIONS } from '../../../../shared/constants/copy';
import {
  getCustodyAccountDetails,
  getIsCustodianSupportedChain,
} from '../../../selectors/institutional/selectors';
import { getAccountType } from '../../../selectors';
import SelectedAccount from '.';

const mockSelectedIdentity = {
  address: '0x0DCD5D886577d5081B0c52e242Ef29E70Be3E7bc',
  name: 'Test Account',
};

jest.mock('copy-to-clipboard');

jest.mock('../../../selectors/institutional/selectors', () => {
  const mockGetCustodyAccountDetails = jest.fn(() => undefined);
  const mockGetisCustodianSupportedChain = jest.fn(() => true);

  return {
    getCustodyAccountDetails: mockGetCustodyAccountDetails,
    getIsCustodianSupportedChain: mockGetisCustodianSupportedChain,
  };
});

jest.mock('../../../selectors', () => {
  const mockGetAccountType = jest.fn(() => undefined);
  const mockGetSelectedIdentity = jest.fn(() => mockSelectedIdentity);

  return {
    getAccountType: mockGetAccountType,
    getSelectedIdentity: mockGetSelectedIdentity,
  };
});

describe('SelectedAccount Component', () => {
  const mockStore = configureMockStore()(mockState);

  it('should render correctly', () => {
    const { container, getByText, getByTestId } = renderWithProvider(
      <SelectedAccount />,
      mockStore,
    );

    const tooltipTitle = container.querySelector(
      '[data-original-title="Copy to clipboard"]',
    );

    expect(tooltipTitle).toBeInTheDocument();
    expect(getByText(mockSelectedIdentity.name)).toBeInTheDocument();
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

  it('should render correctly if isCustodianSupportedChain to false', () => {
    getIsCustodianSupportedChain.mockReturnValue(false);

    const { container, queryByTestId } = renderWithProvider(
      <SelectedAccount />,
      mockStore,
    );

    const tooltipTitle = container.querySelector(
      '[data-original-title="This account is not set up for use with goerli"]',
    );

    const button = queryByTestId('selected-account-click');

    expect(button).toBeDisabled();
    expect(tooltipTitle).toBeInTheDocument();
    expect(queryByTestId('selected-account-copy')).not.toBeInTheDocument();
  });

  it('should display custody labels if they exist', () => {
    const mockAccountDetails = {
      [mockSelectedIdentity.address]: {
        labels: [
          { key: 'Label 1', value: 'Label 1' },
          { key: 'Label 2', value: 'Label 2' },
        ],
      },
    };

    getAccountType.mockReturnValue('custody');
    getCustodyAccountDetails.mockReturnValue(mockAccountDetails);

    const { getByText } = renderWithProvider(<SelectedAccount />, mockStore);

    expect(getByText('Label 1')).toBeInTheDocument();
    expect(getByText('Label 2')).toBeInTheDocument();
  });
});
