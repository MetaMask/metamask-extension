import React from 'react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import Identicon from '.';

describe('Identicon', () => {
  const mockState = {
    metamask: {
      providerConfig: {
        chainId: '0x99',
      },
      useBlockie: false,
    },
  };

  const mockStore = configureMockStore()(mockState);

  it('should match snapshot with default props', () => {
    const { container } = renderWithProvider(<Identicon />, mockStore);

    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with custom image and className props', () => {
    const props = {
      className: 'test-image',
      image: 'test-image',
    };

    const { container } = renderWithProvider(
      <Identicon {...props} />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with address prop div', () => {
    const props = {
      className: 'test-address',
      address: '0x0000000000000000000000000000000000000000',
    };

    const { container } = renderWithProvider(
      <Identicon {...props} />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });
});
