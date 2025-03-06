import {
  createCaveatBuilder,
  createRootDelegation,
  DelegationFramework,
  DelegationStruct,
  getDelegationHashOffchain,
  getDeleGatorEnvironment,
  Implementation,
  MetaMaskSmartAccount,
  createDelegation,
  SIGNABLE_DELEGATION_TYPED_DATA,
  SINGLE_DEFAULT_MODE,
  toMetaMaskSmartAccount,
} from '@metamask-private/delegator-core-viem';
import { ORIGIN_METAMASK } from '@metamask/controller-utils';
import { SignTypedDataVersion } from '@metamask/keyring-controller';
import { InternalAccount } from '@metamask/keyring-internal-api';
import React, { useState, useEffect } from 'react';
import { createPublicClient, http, parseEther, formatEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import { Box, Button, Text } from '../../components/component-library';
import Card from '../../components/ui/card';
import {
  BlockSize,
  Display,
  FlexDirection,
  TextColor,
} from '../../helpers/constants/design-system';
import { addTransaction, newUnsignedTypedMessage } from '../../store/actions';
import { generateActionId } from '../../store/background-connection';

const SWAP_LIMIT = parseEther('0.1');
const TRANSFER_AMOUNT = parseEther('0.001');
export const GATOR_ENV = getDeleGatorEnvironment(sepolia.id, '1.2.0');
const INTERNAL_GATOR_PK = '';
const RPC_URL = '';

export default function Delegation({
  accounts,
}: {
  accounts: InternalAccount[];
}) {
  const [loading, setLoading] = useState<boolean>(false);
  const [rootDelegation, setRootDelegation] = useState<
    DelegationStruct | undefined
  >();
  const [redelegation, setRedelegation] = useState<
    DelegationStruct | undefined
  >();

  const [metaMaskSmartAccount, setMetaMaskSmartAccount] = useState<
    MetaMaskSmartAccount<Implementation.Hybrid> | undefined
  >();
  const [loadingSmartAccount, setLoadingSmartAccount] =
    useState<boolean>(false);
  const [isDeployed, setIsDeployed] = useState<boolean>(false);
  const [gatorBalance, setGatorBalance] = useState<string>('0');

  // Get delegator (account 1) and delegate (account 2)
  const account1 = accounts[0];
  const account2 = accounts.length > 1 ? accounts[1] : null;
  const delegateNotFound = !account2;
  const hasAllAccounts = account1 && account2 && metaMaskSmartAccount;

  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(RPC_URL),
  });

  const fetchGatorBalance = async (address: string) => {
    try {
      const balance = await publicClient.getBalance({
        address: address as `0x${string}`,
      });
      setGatorBalance(formatEther(balance));
    } catch (error) {
      console.error('Error fetching gator balance:', error);
      setGatorBalance('Error');
    }
  };

  const loadMetaMaskAccount = async () => {
    const owner = privateKeyToAccount(INTERNAL_GATOR_PK as `0x${string}`);

    const account = await toMetaMaskSmartAccount({
      client: publicClient,
      implementation: Implementation.Hybrid,
      deployParams: [owner.address, [], [], []],
      deploySalt: '0x',
      signatory: { account: owner },
    });

    setMetaMaskSmartAccount(account);

    const deployed = await account.isDeployed();
    setIsDeployed(deployed);

    // Fetch balance after setting the account
    fetchGatorBalance(account.address);

    return account;
  };

  // Refresh balance when account is deployed
  useEffect(() => {
    if (metaMaskSmartAccount && isDeployed) {
      fetchGatorBalance(metaMaskSmartAccount.address);
    }
  }, [isDeployed, metaMaskSmartAccount]);

  const deployMetaMaskAccount = async () => {
    if (!metaMaskSmartAccount) {
      throw new Error('MetaMask smart account not loaded');
    }

    const { factory, factoryData } =
      await metaMaskSmartAccount.getFactoryArgs();

    if (factory && factoryData) {
      const txHash = await addTransaction(
        {
          from: account1.address,
          to: factory,
          data: factoryData,
          value: '0x0', // No ETH sent with the transaction
        },
        { method: 'eth_sendTransaction' },
      );

      console.log('txHash', txHash);

      // Check if deployment was successful
      const deployed = await metaMaskSmartAccount.isDeployed();
      setIsDeployed(deployed);
    }
  };

  const generateRootDelegation = async () => {
    if (!account1 || !metaMaskSmartAccount) {
      throw new Error('Cannot create delegation: Missing accounts');
    }

    const caveateBuilder = createCaveatBuilder(GATOR_ENV);
    const caveats = caveateBuilder.addCaveat(
      'nativeTokenTransferAmount',
      SWAP_LIMIT,
    );

    const delegation = createRootDelegation(
      account1.address as `0x${string}`,
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

    setRootDelegation(rootDelegationWithSignature);

    console.log('rootDelegationWithSignature', rootDelegationWithSignature);
  };

  const generateRedelegation = async () => {
    if (!rootDelegation || !account2 || !account1) {
      throw new Error('Root delegation or accounts not found');
    }

    const newRedelegation = createDelegation(
      account2.address as `0x${string}`,
      account1?.address as `0x${string}`,
      getDelegationHashOffchain(rootDelegation),
      [],
      BigInt(0),
    );

    setRedelegation(newRedelegation);

    console.log('newRedelegation', newRedelegation);
  };

  const signRedelegation = async () => {
    if (!redelegation) {
      throw new Error('Delegation not found');
    }

    try {
      const id = generateActionId();

      const typedDataObj = {
        types: SIGNABLE_DELEGATION_TYPED_DATA,
        primaryType: 'Delegation',
        domain: {
          name: 'DelegationManager',
          version: '1',
          chainId: sepolia.id,
          verifyingContract: GATOR_ENV.DelegationManager,
        },
        message: redelegation,
      };

      const signature = await newUnsignedTypedMessage({
        messageParams: {
          requestId: id,
          origin: ORIGIN_METAMASK,
          from: account1.address,
          version: SignTypedDataVersion.V4,
          data: JSON.stringify({
            ...typedDataObj,
            message: {
              ...redelegation,
              salt: redelegation.salt.toString(),
            },
          }),
        },
        request: {
          id,
          origin: ORIGIN_METAMASK,
          params: [],
          networkClientId: sepolia.name.toLowerCase(),
        },
        version: SignTypedDataVersion.V4,
      });
      console.log('signature', signature);

      if (signature) {
        const signedDelegationData = { ...redelegation, signature };
        setRedelegation(signedDelegationData);
        console.log('signedDelegationData', signedDelegationData);
      }
    } catch (error) {
      console.error('Error signing delegation:', error);
      throw error;
    }
  };

  const redeemRootDelegation = async () => {
    if (!rootDelegation) {
      throw new Error('Root delegation not found');
    }

    try {
      const delegations = [rootDelegation];
      const delegationManagerAddress = GATOR_ENV.DelegationManager;

      const encodedCallData = DelegationFramework.encode.redeemDelegations(
        [delegations],
        [SINGLE_DEFAULT_MODE],
        [
          [
            {
              target: account1.address as `0x${string}`,
              callData: '0x',
              value: TRANSFER_AMOUNT,
            },
          ],
        ],
      );

      const txHash = await addTransaction(
        {
          from: account1.address,
          to: delegationManagerAddress,
          data: encodedCallData,
          value: '0x0',
        },
        { method: 'eth_sendTransaction' },
      );

      console.log('Root delegation redeemed:', txHash);
      return txHash;
    } catch (error) {
      console.error('Error redeeming root delegation:', error);
      throw error;
    }
  };

  const redeemRedelegation = async () => {
    if (!redelegation || !rootDelegation) {
      throw new Error('Signed delegations not found');
    }

    if (!account2) {
      throw new Error('Delegate account not found');
    }

    try {
      const delegations = [redelegation, rootDelegation];
      const delegationManagerAddress = GATOR_ENV.DelegationManager;

      console.log('delegations', delegations);

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
      return txHash;
    } catch (error) {
      console.error('Error redeeming redelegation:', error);
      throw error;
    }
  };

  return (
    <div className="main-container">
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        gap={2}
        paddingTop={2}
        width={BlockSize.Full}
      >
        <Text as="h2">Delegation Demo</Text>

        <Card>
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            style={{ gap: '16px' }}
          >
            <Text as="h3">Account Information</Text>
            {account1 && account2 ? (
              <>
                {metaMaskSmartAccount && (
                  <>
                    <Text as="p">
                      MetaMask Smart Account: {metaMaskSmartAccount.address}
                    </Text>
                    <Text as="p">
                      Deployment Status:{' '}
                      {isDeployed ? 'Deployed ✓' : 'Not Deployed ✗'}
                    </Text>
                    <Text as="p">Gator Balance: {gatorBalance} ETH</Text>
                    {isDeployed && (
                      <Button
                        onClick={() =>
                          fetchGatorBalance(metaMaskSmartAccount.address)
                        }
                        style={{ marginTop: '8px' }}
                      >
                        Refresh Balance
                      </Button>
                    )}
                  </>
                )}
                {metaMaskSmartAccount && !isDeployed && (
                  <Button
                    onClick={deployMetaMaskAccount}
                    disabled={loadingSmartAccount || loading}
                  >
                    Deploy Internal Gator
                  </Button>
                )}
                {!metaMaskSmartAccount && (
                  <Button
                    onClick={loadMetaMaskAccount}
                    disabled={loadingSmartAccount || loading}
                  >
                    Load Internal Gator
                  </Button>
                )}
              </>
            ) : (
              <Text as="p" color={TextColor.errorDefault}>
                {delegateNotFound
                  ? 'Please add a second account to use as delegate'
                  : 'Account information not available'}
              </Text>
            )}
          </Box>
        </Card>

        {hasAllAccounts && (
          <Card
            display={Display.Flex}
            width={BlockSize.Full}
            gap={2}
            flexDirection={FlexDirection.Column}
          >
            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Column}
              gap={2}
            >
              {/* Step 3: Create root delegation */}
              <Button
                onClick={generateRootDelegation}
                disabled={!isDeployed || Boolean(rootDelegation) || loading}
              >
                Generate Root Delegation (Gator -&gt; {account1.metadata.name})
              </Button>

              {/* Step 4: Redeem root delegation */}
              <Button
                onClick={redeemRootDelegation}
                disabled={!rootDelegation || loading}
              >
                Redeem Root Delegation (Trigger Transfer Transaction (0.001 ETH)
                from Gator to {account1.metadata.name})
              </Button>
            </Box>
          </Card>
        )}
        {hasAllAccounts && rootDelegation && (
          <Card
            display={Display.Flex}
            width={BlockSize.Full}
            gap={2}
            flexDirection={FlexDirection.Column}
          >
            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Column}
              gap={2}
            >
              {/* Step 3: Create root delegation */}
              <Button
                onClick={generateRedelegation}
                disabled={loading || Boolean(redelegation)}
              >
                Generate Redelegation ({account1.metadata.name} -&gt;{' '}
                {account2.metadata.name})
              </Button>

              {/* Step 4: Sign redelegation */}
              <Button
                onClick={signRedelegation}
                disabled={
                  !redelegation || redelegation?.signature !== '0x' || loading
                }
              >
                Sign Redelegation (From {account1.metadata.name})
              </Button>

              {/* Step 5: Redeem root delegation */}
              <Button
                onClick={redeemRedelegation}
                disabled={
                  !redelegation || redelegation?.signature === '0x' || loading
                }
              >
                Redeem Redelegation (Trigger Transfer Transaction (0.001 ETH)
                from {account1.metadata.name} to {account2.metadata.name})
              </Button>
            </Box>
          </Card>
        )}
      </Box>
    </div>
  );
}
