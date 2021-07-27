import React from 'react';
import PermissionConnect from './permissions-connect.component';

export default {
  title: 'Permissions Connect',
};

export const PermissionsConnectComponent = () => {
  return (
    <PermissionConnect
      getRequestAccountTabIds={() => {
        return 1 + 1;
      }}
      getCurrentWindowTab={() => {
        return 1 + 1;
      }}
      history={[]}
      targetDomainMetadata={{
        host: 'gnosis-safe.io',
        icon: './gnosis.svg',
        lastUpdated: 1627423550860,
        name: 'Gnosis - Manage Digital Assets',
        origin: 'https://gnosis-safe.io',
      }}
      accounts={[
        {
          address: '0xcb47e5e29f925e7482d1712297fb6b268f412344',
          addressLabel: 'Account 1 (...2344)',
          balance: '0x176e5b6f173ebe66',
          label: 'Account 1',
        },
        {
          address: '0xf68a4b64162906eff0ff6ae34e2bb1cd42fef62d',
          addressLabel: 'Account 2 (...f62d)',
          balance: '0x176e5b6f173e',
          label: 'Account 2',
        },
        {
          address: '0xbe0eb53f46cd790cd13851d5eff43d12404d33e8',
          addressLabel: 'Account 3 (...33e8)',
          balance: '0x176e5b6f173ebe',
          label: 'Account 3',
        },
      ]}
    />
  );
};
