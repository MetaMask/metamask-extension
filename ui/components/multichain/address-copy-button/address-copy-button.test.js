import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { toChecksumHexAddress } from '@metamask/controller-utils';
import { shortenAddress } from '../../../helpers/utils/util';
import { AddressCopyButton } from '.';

const SAMPLE_ADDRESS = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';

describe('AccountListItem', () => {
  it('renders the full address by default', () => {
    render(<AddressCopyButton address={SAMPLE_ADDRESS} />);
    expect(
      document.querySelector('[data-testid="address-copy-button-text"]')
        .textContent,
    ).toStrictEqual(toChecksumHexAddress(SAMPLE_ADDRESS));
  });

  it('renders a shortened address when it should', () => {
    render(<AddressCopyButton address={SAMPLE_ADDRESS} shorten />);
    expect(
      document.querySelector('[data-testid="address-copy-button-text"]')
        .textContent,
    ).toStrictEqual(shortenAddress(toChecksumHexAddress(SAMPLE_ADDRESS)));
  });

  it('changes icon when clicked', () => {
    render(<AddressCopyButton address={SAMPLE_ADDRESS} />);
    fireEvent.click(document.querySelector('button'));
    expect(document.querySelector('.mm-icon').style.maskImage).toContain(
      'copy-success.svg',
    );
  });
});
