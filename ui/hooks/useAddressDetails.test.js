import React from 'react';
import { Provider } from 'react-redux';
import { renderHook } from '@testing-library/react-hooks';

import configureStore from '../store/store';
import useAddressDetails from './useAddressDetails';

const renderUseAddressDetails = (toAddress, stateVariables = {}) => {
  const mockState = {
    metamask: {
      providerConfig: {
        type: 'test',
        chainId: '0x5',
      },
      tokenList: {},
      ...stateVariables,
    },
  };

  const wrapper = ({ children }) => (
    <Provider store={configureStore(mockState)}>{children}</Provider>
  );

  return renderHook(() => useAddressDetails(toAddress), { wrapper });
};

describe('useAddressDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return empty object if no address is passed', () => {
    const { result } = renderUseAddressDetails();
    expect(result.current).toStrictEqual({});
  });

  it('should return name from addressBook if address is present in addressBook', () => {
    const { result } = renderUseAddressDetails(
      '0x06195827297c7A80a443b6894d3BDB8824b43896',
      {
        addressBook: {
          '0x5': {
            '0x06195827297c7A80a443b6894d3BDB8824b43896': {
              address: '0x06195827297c7A80a443b6894d3BDB8824b43896',
              name: 'Address Book Account 1',
              chainId: '0x5',
            },
          },
        },
      },
    );
    const { toName, isTrusted } = result.current;
    expect(toName).toBe('Address Book Account 1');
    expect(isTrusted).toBe(true);
  });

  it('should return name from identities if address is present in identities', () => {
    const { result } = renderUseAddressDetails(
      '0x06195827297c7A80a443b6894d3BDB8824b43896',
      {
        identities: {
          '0x06195827297c7A80a443b6894d3BDB8824b43896': {
            address: '0x06195827297c7A80a443b6894d3BDB8824b43896',
            name: 'Account 1',
          },
        },
      },
    );
    const { toName, isTrusted } = result.current;
    expect(toName).toBe('Account 1');
    expect(isTrusted).toBe(true);
  });

  it('should return name from tokenlist if address is present in tokens', () => {
    const { result } = renderUseAddressDetails(
      '0x06195827297c7A80a443b6894d3BDB8824b43896',
      {
        useTokenDetection: true,
        tokenList: {
          '0x06195827297c7a80a443b6894d3bdb8824b43896': {
            address: '0x06195827297c7a80a443b6894d3bdb8824b43896',
            symbol: 'LINK',
            decimals: 18,
            name: 'TOKEN-ABC',
          },
        },
      },
    );
    const { toName, isTrusted } = result.current;
    expect(toName).toBe('TOKEN-ABC');
    expect(isTrusted).toBe(true);
  });

  it('should return shortened address if address is not presend in any of above sources', () => {
    const { result } = renderUseAddressDetails(
      '0x06195827297c7A80a443b6894d3BDB8824b43896',
    );
    const { toName, isTrusted } = result.current;
    expect(toName).toBe('0x06195...43896');
    expect(isTrusted).toBe(false);
  });
});
