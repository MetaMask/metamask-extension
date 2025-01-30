import React from 'react';
import { action } from '@storybook/addon-actions';
import { PermissionPageContainerContent } from '../../components/app/permission-page-container';
import PermissionsConnectFooter from '../../components/app/permissions-connect-footer';
import { PageContainerFooter } from '../../components/ui/page-container';
import { createMockInternalAccount } from '../../../test/jest/mocks';
import ChooseAccount from './choose-account';

const account1 = {
  ...createMockInternalAccount({
    address: '0xcb47e5e29f925e7482d1712297fb6b268f412344',
    name: 'Account 1',
  }),
  addressLabel: 'Account 1 (...2344)',
  balance: '0x176e5b6f173ebe66',
  label: 'Account 1',
};

const account2 = {
  ...createMockInternalAccount({
    address: '0xf68a4b64162906eff0ff6ae34e2bb1cd42fef62d',
    name: 'Account 2',
  }),
  addressLabel: 'Account 2 (...f62d)',
  balance: '0x176e5b6f173e',
  label: 'Account 2',
};

const account3 = {
  ...createMockInternalAccount({
    address: '0xbe0eb53f46cd790cd13851d5eff43d12404d33e8',
    name: 'Account 3',
  }),
  addressLabel: 'Account 3 (...33e8)',
  balance: '0x176e5b6f173ebe',
  label: 'Account 3',
};

export default {
  title: 'Pages/PermissionsConnect',
};

export const ChooseAccountComponent = () => {
  return (
    <ChooseAccount
      selectAccounts={action('Account(s) Selected')}
      selectedAccountAddresses={
        new Set([
          '0xcb47e5e29f925e7482d1712297fb6b268f412344',
          '0xf68a4b64162906eff0ff6ae34e2bb1cd42fef62d',
          '0xbe0eb53f46cd790cd13851d5eff43d12404d33e8',
        ])
      }
      targetSubjectMetadata={{
        iconUrl: './gnosis.svg',
        name: 'Gnosis - Manage Digital Assets',
        origin: 'https://gnosis-safe.io',
      }}
      accounts={[account1, account2, account3]}
    />
  );
};

export const PermissionPageContainerComponent = () => {
  return (
    <div className="page-container permission-approval-container">
      <PermissionPageContainerContent
        subjectMetadata={{
          extensionId: '1',
          iconUrl: './gnosis.svg',
          name: 'Gnosis - Manage Digital Assets',
          origin: 'https://gnosis-safe.io',
        }}
        selectedPermissions={{
          eth_accounts: true,
        }}
      />
      <div className="permission-approval-container__footers">
        <PermissionsConnectFooter />
        <PageContainerFooter
          cancelButtonType="default"
          onSubmit={action('Account(s) Connected')}
          submitText="connect"
          buttonSizeLarge={false}
        />
      </div>
    </div>
  );
};
