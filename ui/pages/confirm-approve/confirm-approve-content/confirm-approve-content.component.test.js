import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/jest/rendering';
import { TokenStandard } from '../../../../shared/constants/transaction';
import { BlockaidResultType } from '../../../../shared/constants/security-provider';
import ConfirmApproveContent from '.';

const renderComponent = (props) => {
  const store = configureMockStore([])({
    metamask: { providerConfig: { chainId: '0x0' } },
  });
  return renderWithProvider(<ConfirmApproveContent {...props} />, store);
};

const props = {
  siteImage: 'https://metamask.github.io/test-dapp/metamask-fox.svg',
  origin: 'https://metamask.github.io/test-dapp/',
  tokenSymbol: 'TestDappNFTs (#1)',
  assetStandard: TokenStandard.ERC721,
  tokenImage: 'https://metamask.github.io/test-dapp/metamask-fox.svg',
  showCustomizeGasModal: jest.fn(),
  data: '0x095ea7b30000000000000000000000009bc5baf874d2da8d216ae9f137804184ee5afef40000000000000000000000000000000000000000000000000000000000011170',
  toAddress: '0x9bc5baf874d2da8d216ae9f137804184ee5afef4',
  currentCurrency: 'usd',
  nativeCurrency: 'ETH',
  ethTransactionTotal: '20',
  fiatTransactionTotal: '10',
  useNonceField: true,
  nextNonce: 1,
  customNonceValue: '2',
  txData: { simulationFails: null },
  userAcknowledgedGasMissing: false,
  setUserAcknowledgedGasMissing: jest.fn(),
  renderSimulationFailureWarning: false,
  showCustomizeNonceModal: jest.fn(),
  chainId: '1337',
  rpcPrefs: {},
  isContract: true,
  useCurrencyRateCheck: true,
  isSetApproveForAll: false,
  isApprovalOrRejection: true,
};

describe('ConfirmApproveContent Component', () => {
  it('should render Confirm approve page correctly', () => {
    const { queryByText, getByText, getAllByText, getByTestId } =
      renderComponent(props);
    expect(
      queryByText('https://metamask.github.io/test-dapp/'),
    ).toBeInTheDocument();
    expect(getByTestId('confirm-approve-title').textContent).toStrictEqual(
      ' Allow access to and transfer of your TestDappNFTs (#1)? ',
    );
    expect(
      queryByText(
        'This allows a third party to access and transfer the following NFTs without further notice until you revoke its access.',
      ),
    ).toBeInTheDocument();
    expect(queryByText('Verify third-party details')).toBeInTheDocument();
    expect(
      queryByText(
        'We were not able to estimate gas. There might be an error in the contract and this transaction may fail.',
      ),
    ).not.toBeInTheDocument();
    expect(queryByText('I want to proceed anyway')).not.toBeInTheDocument();
    expect(queryByText('View full transaction details')).toBeInTheDocument();

    const editButtons = getAllByText('Edit');

    expect(queryByText('Transaction fee')).toBeInTheDocument();
    expect(
      queryByText('A fee is associated with this request.'),
    ).toBeInTheDocument();
    expect(queryByText(`${props.ethTransactionTotal} ETH`)).toBeInTheDocument();
    expect(queryByText(`$10.00`)).toBeInTheDocument();
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

  it('should render Confirm approve page correctly and simulation error message without I want to procced anyway link', () => {
    const { queryByText, getByText, getAllByText, getByTestId } =
      renderComponent({
        ...props,
        userAcknowledgedGasMissing: true,
        renderSimulationFailureWarning: true,
      });
    expect(
      queryByText('https://metamask.github.io/test-dapp/'),
    ).toBeInTheDocument();
    expect(getByTestId('confirm-approve-title').textContent).toStrictEqual(
      ' Allow access to and transfer of your TestDappNFTs (#1)? ',
    );
    expect(
      queryByText(
        'This allows a third party to access and transfer the following NFTs without further notice until you revoke its access.',
      ),
    ).toBeInTheDocument();
    expect(queryByText('Verify third-party details')).toBeInTheDocument();
    expect(
      queryByText(
        'We were not able to estimate gas. There might be an error in the contract and this transaction may fail.',
      ),
    ).toBeInTheDocument();
    expect(queryByText('I want to proceed anyway')).not.toBeInTheDocument();
    expect(queryByText('View full transaction details')).toBeInTheDocument();

    const editButtons = getAllByText('Edit');

    expect(queryByText('Transaction fee')).toBeInTheDocument();
    expect(
      queryByText('A fee is associated with this request.'),
    ).toBeInTheDocument();
    expect(queryByText(`${props.ethTransactionTotal} ETH`)).toBeInTheDocument();
    fireEvent.click(editButtons[0]);
    expect(props.showCustomizeGasModal).toHaveBeenCalledTimes(2);

    expect(queryByText('Nonce')).toBeInTheDocument();
    expect(queryByText('2')).toBeInTheDocument();
    fireEvent.click(editButtons[1]);
    expect(props.showCustomizeNonceModal).toHaveBeenCalledTimes(2);

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

  it('should render Confirm approve page correctly and simulation error message with I want to procced anyway link', () => {
    const { queryByText, getByText, getAllByText, getByTestId } =
      renderComponent({
        ...props,
        userAcknowledgedGasMissing: false,
        renderSimulationFailureWarning: true,
      });
    expect(
      queryByText('https://metamask.github.io/test-dapp/'),
    ).toBeInTheDocument();
    expect(getByTestId('confirm-approve-title').textContent).toStrictEqual(
      ' Allow access to and transfer of your TestDappNFTs (#1)? ',
    );
    expect(
      queryByText(
        'This allows a third party to access and transfer the following NFTs without further notice until you revoke its access.',
      ),
    ).toBeInTheDocument();
    expect(queryByText('Verify third-party details')).toBeInTheDocument();
    expect(
      queryByText(
        'We were not able to estimate gas. There might be an error in the contract and this transaction may fail.',
      ),
    ).toBeInTheDocument();
    expect(queryByText('I want to proceed anyway')).toBeInTheDocument();
    expect(queryByText('View full transaction details')).toBeInTheDocument();

    const editButtons = getAllByText('Edit');

    expect(queryByText('Transaction fee')).toBeInTheDocument();
    expect(
      queryByText('A fee is associated with this request.'),
    ).toBeInTheDocument();
    expect(queryByText(`${props.ethTransactionTotal} ETH`)).toBeInTheDocument();
    fireEvent.click(editButtons[0]);
    expect(props.showCustomizeGasModal).toHaveBeenCalledTimes(3);

    expect(queryByText('Nonce')).toBeInTheDocument();
    expect(queryByText('2')).toBeInTheDocument();
    fireEvent.click(editButtons[1]);
    expect(props.showCustomizeNonceModal).toHaveBeenCalledTimes(3);

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

  it('should render Confirm approve page correctly when the fiat conversion is OFF', () => {
    const { queryByText, getByText, getAllByText, getByTestId } =
      renderComponent({ ...props, useCurrencyRateCheck: false });
    expect(
      queryByText('https://metamask.github.io/test-dapp/'),
    ).toBeInTheDocument();
    expect(getByTestId('confirm-approve-title').textContent).toStrictEqual(
      ' Allow access to and transfer of your TestDappNFTs (#1)? ',
    );
    expect(
      queryByText(
        'This allows a third party to access and transfer the following NFTs without further notice until you revoke its access.',
      ),
    ).toBeInTheDocument();
    expect(queryByText('Verify third-party details')).toBeInTheDocument();
    expect(
      queryByText(
        'We were not able to estimate gas. There might be an error in the contract and this transaction may fail.',
      ),
    ).not.toBeInTheDocument();
    expect(queryByText('I want to proceed anyway')).not.toBeInTheDocument();
    expect(queryByText('View full transaction details')).toBeInTheDocument();

    const editButtons = getAllByText('Edit');

    expect(queryByText('Transaction fee')).toBeInTheDocument();
    expect(
      queryByText('A fee is associated with this request.'),
    ).toBeInTheDocument();
    expect(queryByText(`${props.ethTransactionTotal} ETH`)).toBeInTheDocument();
    expect(queryByText(`$10.00`)).not.toBeInTheDocument();
    fireEvent.click(editButtons[0]);
    expect(props.showCustomizeGasModal).toHaveBeenCalledTimes(4);

    expect(queryByText('Nonce')).toBeInTheDocument();
    expect(queryByText('2')).toBeInTheDocument();
    fireEvent.click(editButtons[1]);
    expect(props.showCustomizeNonceModal).toHaveBeenCalledTimes(4);

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

  it('should render Confirm approve page correctly and display fallback copy for when we are able to retrieve a erc721 or erc1155 name in the setApprovalForAll screen and when giving a setApprovalForAll allowance', () => {
    const { container } = renderComponent({
      ...props,
      tokenSymbol: 'ZenAcademy',
      isSetApproveForAll: true,
    });

    expect(container).toMatchSnapshot();
  });

  it('should render Confirm approve page correctly and display fallback copy for when we are not able to retrieve a erc721 or erc1155 name in the setApprovalForAll screen and when giving a setApprovalForAll allowance', () => {
    const { container } = renderComponent({
      ...props,
      tokenSymbol: '',
      isSetApproveForAll: true,
    });

    expect(container).toMatchSnapshot();
  });

  it('should render Confirm approve page correctly and display fallback copy for when we are able to retrieve a erc721 or erc1155 name in the setApprovalForAll screen and when revoking a setApprovalForAll allowance', () => {
    const { container } = renderComponent({
      ...props,
      tokenSymbol: 'ZenAcademy',
      isSetApproveForAll: true,
      isApprovalOrRejection: false,
    });

    expect(container).toMatchSnapshot();
  });

  it('should render Confirm approve page correctly and display fallback copy for when we are not able to retrieve a erc721 or erc1155 name in the setApprovalForAll screen and when revoking a setApprovalForAll allowance', () => {
    const { container } = renderComponent({
      ...props,
      tokenSymbol: '',
      isSetApproveForAll: true,
      isApprovalOrRejection: false,
    });

    expect(container).toMatchSnapshot();
  });

  it('should render security provider response if transaction is malicious', () => {
    const securityProviderResponse = {
      flagAsDangerous: 1,
      reason:
        'This has been flagged as potentially suspicious. If you sign, you could lose access to all of your NFTs and any funds or other assets in your wallet.',
      reason_header: 'Warning',
    };
    const { getByText } = renderComponent({
      ...props,
      txData: {
        ...props.txData,
        securityProviderResponse,
      },
    });

    expect(getByText(securityProviderResponse.reason)).toBeInTheDocument();
  });

  it('should render security alert if provided', () => {
    const mockSecurityAlertResponse = {
      result_type: BlockaidResultType.Malicious,
      reason: 'blur_farming',
    };

    const { getByText } = renderComponent({
      ...props,
      txData: {
        ...props.txData,
        securityAlertResponse: mockSecurityAlertResponse,
      },
    });

    expect(getByText('This is a deceptive request')).toBeInTheDocument();
  });

  it('should render token contract address when isSetApproveForAll and isApprovalOrRejection are true', () => {
    const { getByText } = renderComponent({
      ...props,
      isSetApproveForAll: true,
      isApprovalOrRejection: true,
      tokenAddress: '0x',
    });

    const showViewTxDetails = getByText('View full transaction details');

    fireEvent.click(showViewTxDetails);

    expect(getByText(/Token contract address: 0x/u)).toBeInTheDocument();
  });
});
