import { fireEvent } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import { SECURITY_PROVIDER_MESSAGE_SEVERITY } from '../../../../../shared/constants/security-provider';
import { TransactionType } from '../../../../../shared/constants/transaction';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import {
  INSUFFICIENT_FUNDS_ERROR_KEY,
  TRANSACTION_ERROR_KEY,
} from '../../../../helpers/constants/error-keys';
import ConfirmPageContainerContent from './confirm-page-container-content.component';

describe('Confirm Page Container Content', () => {
  const mockStore = {
    metamask: {
      providerConfig: {
        type: 'test',
        chainId: '0x5',
      },
      addressBook: {
        '0x5': {
          '0x06195827297c7A80a443b6894d3BDB8824b43896': {
            address: '0x06195827297c7A80a443b6894d3BDB8824b43896',
            name: 'Address Book Account 1',
            chainId: '0x5',
          },
        },
      },
      internalAccounts: {
        accounts: {
          'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3': {
            address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
            id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
            metadata: {
              keyring: {
                type: 'HD Key Tree',
              },
            },
            name: 'Test Account',
            options: {},
            supportedMethods: [
              'personal_sign',
              'eth_sendTransaction',
              'eth_sign',
              'eth_signTransaction',
              'eth_signTypedData',
              'eth_signTypedData_v1',
              'eth_signTypedData_v2',
              'eth_signTypedData_v3',
              'eth_signTypedData_v4',
            ],
            type: 'eip155:eoa',
          },
          '07c2cfec-36c9-46c4-8115-3836d3ac9047': {
            address: '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b',
            id: '07c2cfec-36c9-46c4-8115-3836d3ac9047',
            metadata: {
              keyring: {
                type: 'HD Key Tree',
              },
            },
            name: 'Test Account 2',
            options: {},
            supportedMethods: [
              'personal_sign',
              'eth_sendTransaction',
              'eth_sign',
              'eth_signTransaction',
              'eth_signTypedData',
              'eth_signTypedData_v1',
              'eth_signTypedData_v2',
              'eth_signTypedData_v3',
              'eth_signTypedData_v4',
            ],
            type: 'eip155:eoa',
          },
          '15e69915-2a1a-4019-93b3-916e11fd432f': {
            address: '0xc42edfcc21ed14dda456aa0756c153f7985d8813',
            id: '15e69915-2a1a-4019-93b3-916e11fd432f',
            metadata: {
              keyring: {
                type: 'Ledger Hardware',
              },
            },
            name: 'Ledger Hardware 2',
            options: {},
            supportedMethods: [
              'personal_sign',
              'eth_sendTransaction',
              'eth_sign',
              'eth_signTransaction',
              'eth_signTypedData',
              'eth_signTypedData_v1',
              'eth_signTypedData_v2',
              'eth_signTypedData_v3',
              'eth_signTypedData_v4',
            ],
            type: 'eip155:eoa',
          },
          '784225f4-d30b-4e77-a900-c8bbce735b88': {
            address: '0xeb9e64b93097bc15f01f13eae97015c57ab64823',
            id: '784225f4-d30b-4e77-a900-c8bbce735b88',
            metadata: {
              keyring: {
                type: 'HD Key Tree',
              },
            },
            name: 'Test Account 3',
            options: {},
            supportedMethods: [
              'personal_sign',
              'eth_sendTransaction',
              'eth_sign',
              'eth_signTransaction',
              'eth_signTypedData',
              'eth_signTypedData_v1',
              'eth_signTypedData_v2',
              'eth_signTypedData_v3',
              'eth_signTypedData_v4',
            ],
            type: 'eip155:eoa',
          },
        },
        selectedAccount: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
      },
    },
  };

  const store = configureMockStore()(mockStore);

  let props = {};

  beforeEach(() => {
    const mockOnCancel = jest.fn();
    const mockOnCancelAll = jest.fn();
    const mockOnSubmit = jest.fn();
    const mockSetUserAcknowledgedGasMissing = jest.fn();
    props = {
      action: ' Withdraw Stake',
      errorMessage: null,
      errorKey: null,
      onCancelAll: mockOnCancelAll,
      onCancel: mockOnCancel,
      cancelText: 'Reject',
      onSubmit: mockOnSubmit,
      setUserAcknowledgedGasMissing: mockSetUserAcknowledgedGasMissing,
      submitText: 'Confirm',
      disabled: true,
      origin: 'http://localhost:4200',
      hideTitle: false,
      txData: {
        securityProviderResponse: {
          flagAsDangerous: '?',
          reason: 'Some reason...',
          reason_header: 'Some reason header...',
        },
      },
    };
  });

  it('render ConfirmPageContainer component with another error', async () => {
    props.disabled = true;
    props.errorKey = TRANSACTION_ERROR_KEY;
    props.currentTransaction = {
      type: 'transfer',
    };
    const { queryByText, getByText } = renderWithProvider(
      <ConfirmPageContainerContent {...props} />,
      store,
    );

    expect(
      queryByText(
        'We were not able to estimate gas. There might be an error in the contract and this transaction may fail.',
      ),
    ).not.toBeInTheDocument();
    expect(queryByText('I want to proceed anyway')).not.toBeInTheDocument();
    expect(getByText('Confirm').closest('button')).toBeDisabled();
    expect(
      getByText('Transaction error. Exception thrown in contract code.'),
    ).toBeInTheDocument();

    const cancelButton = getByText('Reject');
    fireEvent.click(cancelButton);
    expect(props.onCancel).toHaveBeenCalledTimes(1);
  });

  it('render ConfirmPageContainer component with no errors', async () => {
    props.disabled = false;
    const { queryByText, getByText } = renderWithProvider(
      <ConfirmPageContainerContent {...props} />,
      store,
    );

    expect(
      queryByText(
        'We were not able to estimate gas. There might be an error in the contract and this transaction may fail.',
      ),
    ).not.toBeInTheDocument();
    expect(
      queryByText('Transaction error. Exception thrown in contract code.'),
    ).not.toBeInTheDocument();
    expect(queryByText('I want to proceed anyway')).not.toBeInTheDocument();

    const confirmButton = getByText('Confirm');
    fireEvent.click(confirmButton);
    expect(props.onSubmit).toHaveBeenCalledTimes(1);

    const cancelButton = getByText('Reject');
    fireEvent.click(cancelButton);
    expect(props.onCancel).toHaveBeenCalledTimes(1);
  });

  it('render contract address name from addressBook in title for contract', async () => {
    props.disabled = false;
    props.toAddress = '0x06195827297c7A80a443b6894d3BDB8824b43896';
    props.transactionType = TransactionType.contractInteraction;
    const { queryByText } = renderWithProvider(
      <ConfirmPageContainerContent {...props} />,
      store,
    );

    expect(queryByText('Address Book Account 1')).toBeInTheDocument();
  });

  it('render simple title without address name for simple send', async () => {
    props.disabled = false;
    props.toAddress = '0x06195827297c7A80a443b6894d3BDB8824b43896';
    props.transactionType = TransactionType.simpleSend;
    const { queryByText } = renderWithProvider(
      <ConfirmPageContainerContent {...props} />,
      store,
    );

    expect(queryByText('Address Book Account 1')).not.toBeInTheDocument();
  });

  it('should render SecurityProviderBannerMessage component properly', () => {
    const { queryByText } = renderWithProvider(
      <ConfirmPageContainerContent {...props} />,
      store,
    );

    expect(queryByText('Request not verified')).toBeInTheDocument();
    expect(
      queryByText(
        'Because of an error, this request was not verified by the security provider. Proceed with caution.',
      ),
    ).toBeInTheDocument();
    expect(queryByText('OpenSea')).toBeInTheDocument();
  });

  it('should not render SecurityProviderBannerMessage component when flagAsDangerous is not malicious', () => {
    props.txData.securityProviderResponse = {
      flagAsDangerous: SECURITY_PROVIDER_MESSAGE_SEVERITY.NOT_MALICIOUS,
    };

    const { queryByText } = renderWithProvider(
      <ConfirmPageContainerContent {...props} />,
      store,
    );

    expect(queryByText('Request not verified')).toBeNull();
    expect(
      queryByText(
        'Because of an error, this request was not verified by the security provider. Proceed with caution.',
      ),
    ).toBeNull();
    expect(queryByText('OpenSea')).toBeNull();
  });

  it('should show insufficient funds error for EIP-1559 network', () => {
    const { getByRole } = renderWithProvider(
      <ConfirmPageContainerContent
        {...props}
        errorKey={INSUFFICIENT_FUNDS_ERROR_KEY}
        isBuyableChain
        supportsEIP1559
      />,
      store,
    );
    expect(getByRole('button', { name: 'Buy' })).toBeInTheDocument();
  });

  it('should show insufficient funds error for legacy network', () => {
    const { getByRole } = renderWithProvider(
      <ConfirmPageContainerContent
        {...props}
        errorKey={INSUFFICIENT_FUNDS_ERROR_KEY}
        isBuyableChain
        supportsEIP1559={false}
      />,
      store,
    );
    expect(getByRole('button', { name: 'Buy' })).toBeInTheDocument();
  });
});
