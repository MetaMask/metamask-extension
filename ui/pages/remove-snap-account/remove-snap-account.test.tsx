import React from 'react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../test/lib/render-helpers';
import { toChecksumHexAddress } from '../../../shared/modules/hexstring-utils';
import mockState from '../../../test/data/mock-state.json';
import RemoveSnapAccount from './remove-snap-account';

const defaultProps = {
  snapId: 'npm:@mock-snap',
  snapName: 'mock-name',
  publicAddress: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
};

describe('RemoveSnapAccount', () => {
  it('should return checksum address', async () => {
    const mockStore = configureMockStore([])(mockState);
    const { getByText } = renderWithProvider(
      <RemoveSnapAccount {...defaultProps} />,
      mockStore,
    );

    const expectedCheckSumAddress = toChecksumHexAddress(
      defaultProps.publicAddress,
    );

    expect(getByText(expectedCheckSumAddress)).toBeInTheDocument();
  });
});
