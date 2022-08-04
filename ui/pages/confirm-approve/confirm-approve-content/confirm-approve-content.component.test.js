import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/jest/rendering';
import { ERC20 } from '../../../helpers/constants/common';
import ConfirmApproveContent from '.';

const renderComponent = (props) => {
  const store = configureMockStore([])({ metamask: {} });
  return renderWithProvider(<ConfirmApproveContent {...props} />, store);
};

const props = {
  decimals: 16,
  siteImage: 'https://metamask.github.io/test-dapp/metamask-fox.svg',
  customTokenAmount: '10',
  tokenAmount: '10',
  origin: 'https://metamask.github.io/test-dapp/',
  tokenSymbol: 'TST',
  assetStandard: ERC20,
  tokenImage: 'https://metamask.github.io/test-dapp/metamask-fox.svg',
  tokenBalance: '15',
  showCustomizeGasModal: jest.fn(),
  showEditApprovalPermissionModal: jest.fn(),
  data:
    '0x095ea7b30000000000000000000000009bc5baf874d2da8d216ae9f137804184ee5afef40000000000000000000000000000000000000000000000000000000000011170',
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
    const {
      queryByText,
      getByText,
      getAllByText,
      getByTestId,
    } = renderComponent(props);
    expect(queryByText('metamask.github.io')).toBeInTheDocument();
    expect(getByTestId('confirm-approve-title').textContent).toBe(
      ' Give permission to access your TST? ',
    );
    expect(
      queryByText(
        'By granting permission, you are allowing the following contract to access your funds',
      ),
    ).toBeInTheDocument();
    expect(queryByText('0x9bc5...fef4')).toBeInTheDocument();
    expect(queryByText('Hide full transaction details')).toBeInTheDocument();

    expect(queryByText('Edit Permission')).toBeInTheDocument();
    const editPermission = getByText('Edit Permission');
    fireEvent.click(editPermission);
    expect(props.showEditApprovalPermissionModal).toHaveBeenCalledTimes(1);

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

    const showHideTxDetails = getByText('Hide full transaction details');
    expect(getByText('Permission request')).toBeInTheDocument();
    expect(getByText('Approved amount:')).toBeInTheDocument();
    expect(getByText('Granted to:')).toBeInTheDocument();
    fireEvent.click(showHideTxDetails);
    expect(getByText('View full transaction details')).toBeInTheDocument();
    expect(queryByText('Permission request')).not.toBeInTheDocument();
    expect(queryByText('Approved amount:')).not.toBeInTheDocument();
    expect(queryByText('Granted to:')).not.toBeInTheDocument();
    expect(getByText('0x9bc5...fef4')).toBeInTheDocument();
  });
});
