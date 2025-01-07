import React from 'react';
import { BtcAccountType } from '@metamask/keyring-api';
import { waitFor } from '@testing-library/react';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import messages from '../../../../app/_locales/en/messages.json';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/jest/rendering';
import { createMockInternalAccount } from '../../../../test/jest/mocks';
import { shortenAddress } from '../../../helpers/utils/util';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { normalizeSafeAddress } from '../../../../app/scripts/lib/multichain/address';
import { ConnectAccountsModal } from './connect-accounts-modal';
const mockAccount = createMockInternalAccount();
const mockBtcAccount = createMockInternalAccount({
    name: 'BTC Account',
    address: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
    type: BtcAccountType.P2wpkh,
});
const defaultProps = {
    onClose: () => ({}),
    onAccountsUpdate: () => ({}),
    activeTabOrigin: 'metamask.github.io',
};
const render = (props = defaultProps) => {
    const store = configureStore({
        OnboardingController: {
            completedOnboarding: true
        },
        AccountsController: {
            internalAccounts: {
                accounts: {
                    [mockAccount.id]: mockAccount,
                    [mockBtcAccount.id]: mockBtcAccount,
                },
                selectedAccount: mockAccount.id,
            }
        },
        KeyringController: {
            keyrings: [
                {
                    type: 'HD Key Tree',
                    accounts: [mockAccount.address],
                },
                {
                    type: 'Snap Keyring',
                    accounts: [mockBtcAccount.address],
                },
            ]
        },
        AccountTracker: {
            accounts: {
                [mockAccount.address]: {
                    address: mockAccount.address,
                    balance: '0x0',
                },
            }
        },
        MultichainBalancesController: {
            balances: {
                [mockBtcAccount.id]: {},
            }
        }
    });
    return renderWithProvider(<ConnectAccountsModal>{ ...props } /  > , store);
};
describe('Connect More Accounts Modal', () => {
    it('should render correctly', async () => {
        const { baseElement, getByText } = render();
        expect(getByText(messages.connectMoreAccounts.message)).toBeInTheDocument();
        expect(getByText(messages.selectAll.message)).toBeInTheDocument();
        expect(getByText(messages.confirm.message)).toBeInTheDocument();
        await waitFor(() => {
            expect(baseElement).toMatchSnapshot();
        });
    });
    it('should only render EVM accounts', () => {
        const { getAllByTestId } = render();
        const accountAddresses = getAllByTestId('account-list-address');
        expect(accountAddresses).toHaveLength(1);
        expect(accountAddresses[0].textContent).toBe(
        // Account list item normalizes the address prior to displaying it.
        shortenAddress(normalizeSafeAddress(mockAccount.address)));
    });
});
