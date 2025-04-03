import { InternalAccount } from '@metamask/keyring-internal-api';
import React from 'react';

import {
  Box,
  Text,
} from '../../../components/component-library';

// example account
const account: InternalAccount = {
  address: '0x12C7e...q135f',
  type: 'eip155:eoa',
  id: '1',
  options: {},
  metadata: {
    name: 'Hardware Lockbox',
    importTime: 1717334400,
    keyring: {
      type: 'eip155',
    },
  },
  scopes: [],
  methods: [],
};

export default function RemoteModeSetupDailyAllowance({
  accounts = [account],
}: {
  accounts?: InternalAccount[];
}) {

  return (
    <div className="main-container" data-testid="remote-mode-setup-daily-allowance">
    <Box padding={6}>
        <Text>Soon™️</Text>
      </Box>
    </div>
  );
}
