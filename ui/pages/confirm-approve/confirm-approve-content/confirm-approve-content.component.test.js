import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/jest/rendering';
import { TokenStandard } from '../../../../shared/constants/transaction';
import ConfirmApproveContent from '.';

const renderComponent = (props) => {
  const store = configureMockStore([])({
    metamask: { provider: { chainId: '0x0' } },
  });
  return renderWithProvider(<ConfirmApproveContent {...props} />, store);
};

const props = {
  siteImage: 'https://metamask.github.io/test-dapp/metamask-fox.svg',
  origin: 'https://metamask.github.io/test-dapp/',
  tokenSymbol: 'TestDappCollectibles (#1)',
  assetStandard: TokenStandard.ERC721,
  tokenImage: 'https://metamask.github.io/test-dapp/metamask-fox.svg',
  showCustomizeGasModal: jest.fn(),
  data: '0x095ea7b30000000000000000000000009bc5baf874d2da8d216ae9f137804184ee5afef40000000000000000000000000000000000000000000000000000000000011170',
  toAddress: '0x9bc5baf874d2da8d216ae9f137804184ee5afef4',
  currentCurrency: 'TST',
  nativeCurrency: 'ETH',
  ethTransactionTotal: '20',
  fiatTransactionTotal: '10',
  useNonceField: true,
  nextNonce: 1,
  customNonceValue: '2',
  showCustomizeNonceModal: jest.fn(),
  chainId: '1337',
  rpcPrefs: {},
  isContract: true,
};

describe('ConfirmApproveContent Component', () => {
  it('should render Confirm approve page correctly', () => {
    const { queryByText, getByText, getAllByText, getByTestId } =
      renderComponent(props);
    expect(
      queryByText('https://metamask.github.io/test-dapp/'),
    ).toBeInTheDocument();
    expect(getByTestId('confirm-approve-title').textContent).toStrictEqual(
      ' Allow access to and transfer of your TestDappCollectibles (#1)? ',
    );
    expect(
      queryByText(
        'This allows a third party to access and transfer the following NFTs without further notice until you revoke its access.',
      ),
    ).toBeInTheDocument();
    expect(queryByText('Verify contract details')).toBeInTheDocument();
    expect(queryByText('View full transaction details')).toBeInTheDocument();

    const editButtons = getAllByText('Edit');

    expect(queryByText('Transaction fee')).toBeInTheDocument();
    expect(
      queryByText('A fee is associated with this request.'),
    ).toBeInTheDocument();
    expect(queryByText(`${props.ethTransactionTotal} ETH`)).toBeInTheDocument();
    fireEvent.click(editButtons[0]);
    expect(props.showCustomizeGasModal).toHaveBeenCalledTimes(1);

    expect(queryByText('Nonce')).toBeInTheDocument();
    expect(queryByText('2')).toBeInTheDocument();
    fireEvent.click(editButtons[1]);
    expect(props.showCustomizeNonceModal).toHaveBeenCalledTimes(1);

    const showViewTxDetails = getByText('View full transaction details');
    expect(queryByText('Permission request')).not.toBeInTheDocument();
    expect(queryByText('Approved asset:')).not.toBeInTheDocument();
    expect(queryByText('Granted to:')).not.toBeInTheDocument();
    expect(queryByText('Data')).not.toBeInTheDocument();
    fireEvent.click(showViewTxDetails);
    expect(getByText('Hide full transaction details')).toBeInTheDocument();
    expect(getByText('Permission request')).toBeInTheDocument();
    expect(getByText('Approved asset:')).toBeInTheDocument();
    expect(getByText('Granted to:')).toBeInTheDocument();
    expect(getByText('Contract (0x9bc5baF8...fEF4)')).toBeInTheDocument();
    expect(getByText('Data')).toBeInTheDocument();
    expect(getByText('Function: Approve')).toBeInTheDocument();
    expect(
      getByText(
        '0x095ea7b30000000000000000000000009bc5baf874d2da8d216ae9f137804184ee5afef40000000000000000000000000000000000000000000000000000000000011170',
      ),
    ).toBeInTheDocument();
  });
});
