import React from 'react';
import { fireEvent } from '@testing-library/react';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/jest';
import configureStore from '../../../store/store';
import { shortenAddress } from '../../../helpers/utils/util';
import { AddressListItem } from '.';

const SAMPLE_ADDRESS = '0x0c54FcCd2e384b4BB6f2E405Bf5Cbc15a017AaFb';
const SAMPLE_LABEL = 'metamask.eth';

const mockOnClick = jest.fn();

const render = () => {
  return renderWithProvider(
    <AddressListItem
      address={SAMPLE_ADDRESS}
      label={SAMPLE_LABEL}
      onClick={mockOnClick}
    />,
    configureStore(mockState),
  );
};

describe('AddressListItem', () => {
  it('renders the address and label', () => {
    const { getByText } = render();

    expect(getByText(shortenAddress(SAMPLE_ADDRESS))).toBeInTheDocument();
    expect(getByText(SAMPLE_LABEL)).toBeInTheDocument();
  });

  it('fires onClick when the item is clicked', () => {
    render();
    fireEvent.click(document.querySelector('button'));

    expect(mockOnClick).toHaveBeenCalled();
  });
});
