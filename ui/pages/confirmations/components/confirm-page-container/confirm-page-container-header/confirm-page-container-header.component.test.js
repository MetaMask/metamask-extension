import React from 'react';
import configureStore from 'redux-mock-store';
import { ORIGIN_METAMASK } from '../../../../../../shared/constants/app';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers';
import { getEnvironmentType } from '../../../../../../app/scripts/lib/util';
import { CHAIN_IDS } from '../../../../../../shared/constants/network';
import { mockNetworkState } from '../../../../../../test/stub/networks';
import ConfirmPageContainerHeader from '.';

jest.mock('../../../../../../app/scripts/lib/util', () => ({
  ...jest.requireActual('../../../../../../app/scripts/lib/util'),
  getEnvironmentType: jest.fn(),
}));

describe('Confirm Detail Row Component', () => {
  const mockState = {
    metamask: {
      ...mockNetworkState({ chainId: CHAIN_IDS.GOERLI }),
    },
  };

  const store = configureStore()(mockState);

  it('should match snapshot', () => {
    getEnvironmentType.mockReturnValue('popup');

    const props = {
      showEdit: false,
      onEdit: jest.fn(),
      showAccountInHeader: false,
      accountAddress: '0xmockAccountAddress',
      origin: ORIGIN_METAMASK,
    };

    const { container } = renderWithProvider(
      <ConfirmPageContainerHeader {...props} />,
      store,
    );

    expect(container).toMatchSnapshot();
  });

  it('should only render children when fullscreen and showEdit is false & snapshot match', () => {
    getEnvironmentType.mockReturnValue('fullscreen');

    const props = {
      showEdit: false,
      onEdit: jest.fn(),
      showAccountInHeader: false,
      accountAddress: '0xmockAccountAddress',
      origin: ORIGIN_METAMASK,
    };

    const { container } = renderWithProvider(
      <ConfirmPageContainerHeader {...props}>
        <div className="nested-test-class" />
      </ConfirmPageContainerHeader>,
      store,
    );

    expect(container).toMatchSnapshot();
  });
});
