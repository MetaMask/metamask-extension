import {
  Implementation,
  MetaMaskSmartAccount,
  toMetaMaskSmartAccount,
} from '@metamask-private/delegator-core-viem';
import React, { useState } from 'react';
import { createPublicClient, http } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import { SEPOLIA_RPC_URL } from '../../../shared/constants/network';
import { Button } from '../../components/component-library';

export default function Delegation() {
  const [metaMaskSmartAccount, setMetaMaskSmartAccount] = useState<
    MetaMaskSmartAccount<Implementation.Hybrid> | undefined
  >();

  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(SEPOLIA_RPC_URL),
  });

  const createMetaMaskAccount = async () => {
    const owner = privateKeyToAccount(generatePrivateKey());

    return await toMetaMaskSmartAccount({
      client: publicClient,
      implementation: Implementation.Hybrid,
      deployParams: [owner.address, [], [], []],
      deploySalt: '0x',
      signatory: { account: owner },
    });
  };

  const onCreateMetaMaskAccount = async () => {
    const account = await createMetaMaskAccount();
    setMetaMaskSmartAccount(account);
  };

  return (
    <div className="main-container">
      <div>{metaMaskSmartAccount?.address}</div>
      <Button onClick={onCreateMetaMaskAccount}>Create MetaMask Account</Button>
    </div>
  );
}
