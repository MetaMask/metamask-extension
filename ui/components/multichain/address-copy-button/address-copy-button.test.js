import React from 'react';
import configureMockStore from 'redux-mock-store';
import copyToClipboard from 'copy-to-clipboard';
import { fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import mockState from '../../../../test/data/mock-state.json';
import { COPY_OPTIONS } from '../../../../shared/constants/copy';
import { shortenAddress } from '../../../helpers/utils/util';
import {
  getIsCustodianSupportedChain,
  getCustodianIconForAddress,
} from '../../../selectors/institutional/selectors';
import { toChecksumHexAddress } from '../../../../shared/modules/hexstring-utils';
import { AddressCopyButton } from '.';

jest.mock('copy-to-clipboard');

jest.mock('../../../selectors/institutional/selectors', () => {
  const mockGetCustodyAccountDetails = jest.fn(() => undefined);
  const mockGetisCustodianSupportedChain = jest.fn(() => true);
  const mockedGetCustodianIconForAddress = jest.fn();

  return {
    getCustodyAccountDetails: mockGetCustodyAccountDetails,
    getIsCustodianSupportedChain: mockGetisCustodianSupportedChain,
    getCustodianIconForAddress: mockedGetCustodianIconForAddress,
  };
});

const SAMPLE_ADDRESS = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';

describe('AccountListItem', () => {
  const mockStore = configureMockStore()(mockState);

  it('renders the full address by default', () => {
    renderWithProvider(
      <AddressCopyButton address={SAMPLE_ADDRESS} />,
      mockStore,
    );
    expect(
      document.querySelector('[data-testid="address-copy-button-text"]')
        .textContent,
    ).toStrictEqual(toChecksumHexAddress(SAMPLE_ADDRESS));
  });

  it('renders a shortened address when it should', () => {
    renderWithProvider(
      <AddressCopyButton address={SAMPLE_ADDRESS} shorten />,
      mockStore,
    );
    expect(
      document.querySelector('[data-testid="address-copy-button-text"]')
        .textContent,
    ).toStrictEqual(shortenAddress(toChecksumHexAddress(SAMPLE_ADDRESS)));
  });

  it('changes icon when clicked', () => {
    renderWithProvider(
      <AddressCopyButton address={SAMPLE_ADDRESS} />,
      mockStore,
    );
    fireEvent.click(document.querySelector('button'));
    expect(document.querySelector('.mm-icon').style.maskImage).toContain(
      'copy-success.svg',
    );
  });

  it('should render correctly', () => {
    const { container } = renderWithProvider(
      <AddressCopyButton address={SAMPLE_ADDRESS} />,
      mockStore,
    );

    const tooltipTitle = container.querySelector(
      '[data-original-title="Copy to clipboard"]',
    );

    expect(tooltipTitle).toBeInTheDocument();
  });

  it('should copy checksum address to clipboard when button is clicked', () => {
    const { queryByTestId } = renderWithProvider(
      <AddressCopyButton address={SAMPLE_ADDRESS} />,
      mockStore,
    );

    const button = queryByTestId('address-copy-button-text');

    fireEvent.click(button);

    expect(copyToClipboard).toHaveBeenCalledWith(
      '0x0DCD5D886577d5081B0c52e242Ef29E70Be3E7bc',
      COPY_OPTIONS,
    );
  });

  it('should render correctly if isCustodianSupportedChain to false', () => {
    getIsCustodianSupportedChain.mockReturnValue(false);

    const { container, queryByTestId } = renderWithProvider(
      <AddressCopyButton address={SAMPLE_ADDRESS} />,
      mockStore,
    );

    const tooltipTitle = container.querySelector(
      '[data-original-title="This account is not set up for use with Chain 5"]',
    );

    const button = queryByTestId('address-copy-button-text');

    expect(button).toBeDisabled();
    expect(tooltipTitle).toBeInTheDocument();
  });

  it('should render the Custody logo', () => {
    getCustodianIconForAddress.mockReturnValue(
      'https://saturn-custody-ui.metamask-institutional.io/saturn.svg',
    );

    const { queryByTestId } = renderWithProvider(
      <AddressCopyButton address={SAMPLE_ADDRESS} />,
      mockStore,
    );

    const logo = queryByTestId('custody-logo');

    expect(logo).toBeInTheDocument();
  });

  it('should not render the Custody logo if no icon exists', () => {
    getCustodianIconForAddress.mockReturnValue(undefined);

    const { queryByTestId } = renderWithProvider(
      <AddressCopyButton address={SAMPLE_ADDRESS} />,
      mockStore,
    );

    const logo = queryByTestId('custody-logo');

    expect(logo).not.toBeInTheDocument();
  });
});
