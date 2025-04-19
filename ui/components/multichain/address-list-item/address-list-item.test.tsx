import React from 'react';
import { fireEvent } from '@testing-library/react';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/jest';
import configureStore from '../../../store/store';
import { shortenAddress } from '../../../helpers/utils/util';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { AddressListItem } from '.';

const SAMPLE_ADDRESS = '0x0c54FcCd2e384b4BB6f2E405Bf5Cbc15a017AaFb';
const SAMPLE_LABEL = 'metamask.eth';

const mockOnClick = jest.fn();

type Options = {
  label?: string;
  useConfusable?: boolean;
  isDuplicate?: boolean;
};

const render = (options?: Options) => {
  return renderWithProvider(
    <AddressListItem
      address={SAMPLE_ADDRESS}
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      label={options?.label || SAMPLE_LABEL}
      useConfusable={options?.useConfusable}
      onClick={mockOnClick}
      isDuplicate={options?.isDuplicate}
      chainId={CHAIN_IDS.MAINNET}
    />,
    configureStore(mockState),
  );
};

describe('AddressListItem', () => {
  it('renders the address and label without duplicate contact warning icon', () => {
    const { getByText, container } = render();
    expect(container).toMatchSnapshot();

    expect(getByText(shortenAddress(SAMPLE_ADDRESS))).toBeInTheDocument();
    expect(
      document.querySelector(
        '.address-list-item__duplicate-contact-warning-icon',
      ),
    ).not.toBeInTheDocument();
  });

  it('uses a confusable when it should', () => {
    const { container } = render({
      label: 'metamask.eth',
      useConfusable: true,
    });
    expect(container).toMatchSnapshot();

    expect(document.querySelector('.confusable__point')).toBeInTheDocument();
  });

  it('does not force red text when unnecessary', () => {
    render({ label: 'metamask.eth' });
    expect(
      document.querySelector('.confusable__point'),
    ).not.toBeInTheDocument();
  });

  it('fires onClick when the item is clicked', () => {
    render();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    fireEvent.click(document.querySelector('button')!);

    expect(mockOnClick).toHaveBeenCalled();
  });

  it('displays duplicate contact warning icon', () => {
    const { container } = render({ isDuplicate: true });

    expect(container).toMatchSnapshot();
    expect(
      document.querySelector(
        '.address-list-item__duplicate-contact-warning-icon',
      ),
    ).toBeInTheDocument();
  });
});
