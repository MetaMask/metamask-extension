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

const render = (label = '', useConfusable = false) => {
  return renderWithProvider(
    <AddressListItem
      address={SAMPLE_ADDRESS}
      label={label || SAMPLE_LABEL}
      useConfusable={useConfusable}
      onClick={mockOnClick}
    />,
    configureStore(mockState),
  );
};

describe('AddressListItem', () => {
  it('renders the address and label', () => {
    const { getByText, container } = render();
    expect(container).toMatchSnapshot();

    expect(getByText(shortenAddress(SAMPLE_ADDRESS))).toBeInTheDocument();
  });

  it('uses a confusable when it should', () => {
    const { container } = render('metamask.eth', true);
    expect(container).toMatchSnapshot();

    expect(document.querySelector('.confusable__point')).toBeInTheDocument();
  });

  it('does not force red text when unnecessary', () => {
    render('metamask.eth');
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
});
