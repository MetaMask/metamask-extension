import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../test/data/mock-state.json';
import { shortenAddress } from '../../../helpers/utils/util';
import { toChecksumHexAddress } from '../../../../shared/lib/hexstring-utils';
import { AddressCopyButton } from '.';

const SAMPLE_ADDRESS = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';
const mockWriteText = jest.fn().mockResolvedValue(undefined);

describe('AccountListItem', () => {
  const mockStore = configureMockStore()(mockState);

  beforeEach(() => {
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      configurable: true,
      value: { writeText: mockWriteText },
    });
  });

  afterEach(() => {
    jest.clearAllMocks(); // Clear mocks to ensure no test interference
  });

  it('should match snapshot', () => {
    const { container } = renderWithProvider(
      <AddressCopyButton address={SAMPLE_ADDRESS} />,
      mockStore,
    );
    expect(container).toMatchSnapshot();
  });

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

  it('changes icon when clicked', async () => {
    renderWithProvider(
      <AddressCopyButton address={SAMPLE_ADDRESS} />,
      mockStore,
    );
    fireEvent.click(document.querySelector('button'));
    await waitFor(() => {
      expect(document.querySelector('.mm-icon').style.maskImage).toContain(
        'copy-success.svg',
      );
    });
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

  it('should copy checksum address to clipboard when button is clicked', async () => {
    const { queryByTestId } = renderWithProvider(
      <AddressCopyButton address={SAMPLE_ADDRESS} />,
      mockStore,
    );

    const button = queryByTestId('address-copy-button-text');

    fireEvent.click(button);

    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith(
        '0x0DCD5D886577d5081B0c52e242Ef29E70Be3E7bc',
      );
    });
  });
});
