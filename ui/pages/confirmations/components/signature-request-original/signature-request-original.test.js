import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent, screen } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { EthAccountType } from '@metamask/keyring-api';
import { MESSAGE_TYPE } from '../../../../../shared/constants/app';
import { SECURITY_PROVIDER_MESSAGE_SEVERITY } from '../../../../../shared/constants/security-provider';
import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import configureStore from '../../../../store/store';
import { rejectPendingApproval } from '../../../../store/actions';
import { shortenAddress } from '../../../../helpers/utils/util';
import { ETH_EOA_METHODS } from '../../../../../shared/constants/eth-methods';
import SignatureRequestOriginal from '.';

jest.mock('../../../../store/actions', () => ({
  resolvePendingApproval: jest.fn().mockReturnValue({ type: 'test' }),
  rejectPendingApproval: jest.fn().mockReturnValue({ type: 'test' }),
  completedTx: jest.fn().mockReturnValue({ type: 'test' }),
  getLastInteractedConfirmationInfo: jest.fn(),
  setLastInteractedConfirmationInfo: jest.fn(),
}));

const address = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';

const props = {
  signMessage: jest.fn(),
  cancelMessage: jest.fn(),
  txData: {
    msgParams: {
      from: address,
      data: [
        {
          type: 'string',
          name: 'Message',
          value: 'Hi, Alice!',
        },
        {
          type: 'uint32',
          name: 'A number',
          value: '1337',
        },
      ],
      origin: 'https://happydapp.website/governance?futarchy=true',
    },
    type: MESSAGE_TYPE.ETH_SIGN_TYPED_DATA,
  },
  selectedAccount: {
    address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
    id: '7ae06c6d-114a-4319-bf75-9fa3efa2c8b9',
    metadata: {
      name: 'Account 1',
      keyring: {
        type: 'HD Key Tree',
      },
    },
    options: {},
    methods: ETH_EOA_METHODS,
    type: EthAccountType.Eoa,
  },
};

const render = ({ txData = props.txData, selectedAccount } = {}) => {
  const internalAccounts = {
    accounts: {
      ...mockState.metamask.internalAccounts.accounts,
    },
    selectedAccount: mockState.metamask.internalAccounts.selectedAccount,
  };

  if (selectedAccount) {
    internalAccounts.accounts[selectedAccount.id] = selectedAccount;
    internalAccounts.selectedAccount = selectedAccount.id;
  }

  const store = configureStore({
    metamask: {
      ...mockState.metamask,
      internalAccounts,
    },
  });

  return renderWithProvider(
    <SignatureRequestOriginal {...props} txData={txData} />,
    store,
  );
};

describe('SignatureRequestOriginal', () => {
  const store = configureMockStore()(mockState);

  it('should match snapshot', () => {
    const { container } = renderWithProvider(
      <SignatureRequestOriginal {...props} />,
      store,
    );

    expect(container).toMatchSnapshot();
  });

  it('should render navigation', () => {
    render();
    const navigationContainer = screen.queryByTestId('navigation-container');
    expect(navigationContainer).toBeInTheDocument();
  });

  it('should render eth sign screen', () => {
    render();
    expect(screen.getByText('Signature request')).toBeInTheDocument();
  });

  it('should cancel approval when user reject signing', async () => {
    render();
    const rejectButton = screen.getByTestId('page-container-footer-cancel');
    await act(async () => {
      fireEvent.click(rejectButton);
    });
    expect(rejectPendingApproval).toHaveBeenCalledTimes(1);
  });

  it('should escape RTL character in label or value', () => {
    const txData = {
      msgParams: {
        from: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
        data: [
          {
            type: 'string',
            name: 'Message \u202E test',
            value: 'Hi, \u202E Alice!',
          },
        ],
        origin: 'https://happydapp.website/governance?futarchy=true',
      },
      type: MESSAGE_TYPE.ETH_SIGN_TYPED_DATA,
    };
    const { getByText } = render({ txData });
    expect(getByText('Message \\u202E test:')).toBeInTheDocument();
    expect(getByText('Hi, \\u202E Alice!')).toBeInTheDocument();
  });

  it('should render SecurityProviderBannerMessage component properly', () => {
    props.txData.securityProviderResponse = {
      flagAsDangerous: '?',
      reason: 'Some reason...',
      reason_header: 'Some reason header...',
    };
    render();
    expect(screen.getByText('Request not verified')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Because of an error, this request was not verified by the security provider. Proceed with caution.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('OpenSea')).toBeInTheDocument();
  });

  it('should not render SecurityProviderBannerMessage component when flagAsDangerous is not malicious', () => {
    props.txData.securityProviderResponse = {
      flagAsDangerous: SECURITY_PROVIDER_MESSAGE_SEVERITY.NOT_MALICIOUS,
    };

    render();
    expect(screen.queryByText('Request not verified')).toBeNull();
    expect(
      screen.queryByText(
        'Because of an error, this request was not verified by the security provider. Proceed with caution.',
      ),
    ).toBeNull();
    expect(screen.queryByText('OpenSea')).toBeNull();
  });

  it('should display security alert if present', () => {
    props.txData.securityAlertResponse = {
      resultType: 'Malicious',
      reason: 'blur_farming',
      description:
        'A SetApprovalForAll request was made on {contract}. We found the operator {operator} to be malicious',
      args: {
        contract: '0xa7206d878c5c3871826dfdb42191c49b1d11f466',
        operator: '0x92a3b9773b1763efa556f55ccbeb20441962d9b2',
      },
    };

    render();
    expect(screen.getByText('This is a deceptive request')).toBeInTheDocument();
  });

  it('should display mismatch info when selected account address and from account address are not the same', () => {
    const selectedAccount = {
      address: '0xeb9e64b93097bc15f01f13eae97015c57ab64823',
      id: '7ae06c6d-114a-4319-bf75-9fa3efa2c8b9',
      metadata: {
        name: 'Account 1',
        keyring: {
          type: 'HD Key Tree',
        },
      },
      options: {},
      methods: ETH_EOA_METHODS,
      type: EthAccountType.Eoa,
    };
    const mismatchAccountText = `Your selected account (${shortenAddress(
      selectedAccount.address,
    )}) is different than the account trying to sign (${shortenAddress(
      address,
    )})`;

    render({ selectedAccount });

    expect(screen.getByText(mismatchAccountText)).toBeInTheDocument();
  });
});
