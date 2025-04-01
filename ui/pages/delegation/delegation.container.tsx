import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { createPublicClient, http, parseEther } from 'viem';
import { sepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import {
  createCaveatBuilder,
  createDelegation,
  createRootDelegation,
  Delegation,
  getDelegationHashOffchain,
  toMetaMaskSmartAccount,
  Implementation,
  MetaMaskSmartAccount,
  getDeleGatorEnvironment,
  DelegationFramework,
  SINGLE_DEFAULT_MODE,
} from '@metamask/delegation-controller';
import { Box, Button, Text } from '../../components/component-library';
import {
  BlockSize,
  Display,
  FlexDirection,
  TextVariant,
} from '../../helpers/constants/design-system';
import {
  storeDelegation,
  signDelegation,
  addTransaction,
} from '../../store/actions';
import { getInternalAccounts, getSelectedAccount } from '../../selectors';
import { SEPOLIA_RPC_URL } from '../../../shared/constants/network';

const SWAP_LIMIT = parseEther('0.1');
const TRANSFER_AMOUNT = parseEther('0.001');

const INTERNAL_GATOR_PK = '';

export const ROOT_AUTHORITY =
  '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(SEPOLIA_RPC_URL),
});

export const DelegationContainer = () => {
  const selectedAccount = useSelector(getSelectedAccount);
  const internalAccounts = useSelector(getInternalAccounts);
  const [delegations, setDelegations] = useState<Delegation[]>([]);

  const loadMetaMaskAccount = async () => {
    const owner = privateKeyToAccount(INTERNAL_GATOR_PK as `0x${string}`);
    const account = await toMetaMaskSmartAccount({
      client: publicClient,
      implementation: Implementation.Hybrid,
      deployParams: [owner.address, [], [], []],
      deploySalt: '0x',
      signatory: { account: owner },
    });

    console.log('account', account);

    return account;
  };

  const saveDelegation = () => {
    storeDelegation({
      delegate: selectedAccount.address,
      delegator: selectedAccount.address,
      authority: ROOT_AUTHORITY,
      caveats: [],
      salt: BigInt(0).toString(),
      signature: '0x',
    });
  };

  const generateRootDelegation = async (
    metaMaskSmartAccount: MetaMaskSmartAccount<Implementation.Hybrid>,
  ) => {
    const gatorEnv = getDeleGatorEnvironment(sepolia.id, '1.2.0');
    try {
      const caveateBuilder = createCaveatBuilder(gatorEnv);
      const caveats = caveateBuilder.addCaveat(
        'nativeTokenTransferAmount',
        SWAP_LIMIT,
      );

      const delegation = createRootDelegation(
        selectedAccount.address as `0x${string}`,
        metaMaskSmartAccount?.address as `0x${string}`,
        caveats,
        BigInt(0),
      );

      const signature = await metaMaskSmartAccount.signDelegation({
        delegation,
      });

      const rootDelegationWithSignature = {
        ...delegation,
        signature,
      };

      return rootDelegationWithSignature;
    } catch (error) {
      console.error('Error generating root delegation:', error);
    }

    return null;
  };

  const generateRedelegation = async (
    rootDelegation: Awaited<ReturnType<typeof generateRootDelegation>>,
  ) => {
    console.log('generating redelegation');
    if (!rootDelegation) {
      throw new Error('Failed to generate root delegation');
    }
    console.log(internalAccounts);
    const account1 = internalAccounts[0];
    const account2 = internalAccounts[1];
    console.log('account1', account1);
    console.log('account2', account2);

    try {
      const newRedelegation = createDelegation(
        account2.address as `0x${string}`,
        account1?.address as `0x${string}`,
        getDelegationHashOffchain(rootDelegation),
        [],
        BigInt(0),
      );

      return newRedelegation;
    } catch (error) {
      console.error('Error generating redelegation:', error);
    }
    return null;
  };

  const sign = async () => {
    console.log('loading metaMaskSmartAccount');
    const metaMaskSmartAccount = await loadMetaMaskAccount();
    console.log('generating root delegation');
    const rootDelegation = await generateRootDelegation(metaMaskSmartAccount);
    if (!rootDelegation) {
      throw new Error('Failed to generate root delegation');
    }
    console.log('generating redelegation');
    const redelegation = await generateRedelegation(rootDelegation);
    if (!redelegation) {
      throw new Error('Failed to generate redelegation');
    }
    console.log('signing delegation');
    const signature = await signDelegation({
      ...redelegation,
      salt: redelegation.salt.toString(),
    });
    console.log(signature);
    redelegation.signature = signature;

    setDelegations([redelegation, rootDelegation]);
  };

  const redeem = async () => {
    const account2 = internalAccounts[1];
    const gatorEnv = getDeleGatorEnvironment(sepolia.id, '1.2.0');
    const delegationManagerAddress = gatorEnv.DelegationManager;

    console.log('delegations', delegations);

    console.log('encoding call data');
    // Create a transaction to the DelegationManager contract for the chain
    const encodedCallData = DelegationFramework.encode.redeemDelegations(
      [delegations],
      [SINGLE_DEFAULT_MODE],
      [
        [
          {
            target: account2.address as `0x${string}`,
            callData: '0x',
            value: TRANSFER_AMOUNT,
          },
        ],
      ],
    );
    console.log('encodedCallData', encodedCallData);

    console.log('adding transaction');

    const txHash = await addTransaction(
      {
        from: account2.address,
        to: delegationManagerAddress,
        data: encodedCallData,
        value: '0x0',
      },
      { method: 'eth_sendTransaction' },
    );

    console.log('Redelegation redeemed:', txHash);
  };

  return (
    <div className="main-container">
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        gap={2}
        paddingTop={2}
        width={BlockSize.Full}
        padding={2}
      >
        <Text as="h3" variant={TextVariant.headingMd}>
          Delegation Demo
        </Text>
        <Button onClick={saveDelegation}>Save Delegation</Button>
        <Button onClick={sign}>Sign Delegation</Button>
        {delegations.length > 0 && (
          <Button onClick={redeem}>Redeem Delegation</Button>
        )}
      </Box>
    </div>
  );
};
