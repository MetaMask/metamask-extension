import React from 'react';
import { render, within } from '@testing-library/react';
import { NameType } from '@metamask/name-controller';
import { useDisplayName } from '../../../hooks/useDisplayName';
import { ContractName } from './contract-name';

jest.mock('../../../hooks/useDisplayName');

const mockUseDisplayName = jest.mocked(useDisplayName);
const contractAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';

describe('ContractName', () => {
  it('renders the contract name with the truncated address', () => {
    mockUseDisplayName.mockReturnValue({ name: 'Uniswap' } as never);

    const { getByTestId } = render(
      <ContractName address={contractAddress} chainId="eip155:1" />,
    );

    const contract = getByTestId('transaction-details-contract');
    expect(within(contract).getByText('Uniswap')).toBeInTheDocument();
    expect(within(contract).getByText('(0xd8dA6...96045)')).toBeInTheDocument();
    expect(mockUseDisplayName).toHaveBeenCalledWith({
      type: NameType.ETHEREUM_ADDRESS,
      value: contractAddress,
      variation: '0x1',
    });
  });

  it('renders the truncated address when the contract name is unavailable', () => {
    mockUseDisplayName.mockReturnValue({ name: null } as never);

    const { getByTestId } = render(
      <ContractName address={contractAddress} chainId="eip155:1" />,
    );

    expect(getByTestId('transaction-details-contract')).toHaveTextContent(
      '0xd8dA6...96045',
    );
  });
});
