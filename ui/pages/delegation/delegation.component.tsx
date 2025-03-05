import {
  createCaveatBuilder,
  createRootDelegation,
  DelegationFramework,
  DelegationStruct,
  getDeleGatorEnvironment,
  SIGNABLE_DELEGATION_TYPED_DATA,
  SINGLE_TRY_MODE,
} from '@metamask-private/delegator-core-viem';
import { ORIGIN_METAMASK } from '@metamask/controller-utils';
import { SignTypedDataVersion } from '@metamask/keyring-controller';
import { InternalAccount } from '@metamask/keyring-internal-api';
import React, { useEffect, useState } from 'react';
import { parseEther } from 'viem';
import { sepolia } from 'viem/chains';
import { Box, Button, Label, Text } from '../../components/component-library';
import Card from '../../components/ui/card';
import {
  BlockSize,
  Display,
  FlexDirection,
  TextColor,
} from '../../helpers/constants/design-system';
import {
  addTransaction,
  newUnsignedTypedMessage,
  performGetStorage,
  performSetStorage,
} from '../../store/actions';

const SWAP_LIMIT = parseEther('0.1');
export const GATOR_ENV = getDeleGatorEnvironment(sepolia.id, '1.1.0');
const DELEGATION_STORAGE_PATH = 'accounts_v2.delegation';

/**
 * Helper function to save data to delegation storage
 * Gets the existing data first and merges with new data
 *
 * @param key - The key to save the value under
 * @param value - The value to save
 * @returns A promise that resolves when storage is updated
 */
async function saveDelegationStorage(
  key: string,
  value: unknown,
): Promise<void> {
  try {
    // Get existing data
    let existingData: Record<string, unknown> = {};
    try {
      const storedData = await performGetStorage({
        path: DELEGATION_STORAGE_PATH,
      });

      if (storedData) {
        existingData =
          typeof storedData === 'string' ? JSON.parse(storedData) : storedData;
      }
    } catch (error) {
      console.error('Error getting existing delegation storage:', error);
    }

    // Merge with new data
    const updatedData = {
      ...existingData,
      [key]: value,
    };

    // Save updated data
    await performSetStorage({
      path: DELEGATION_STORAGE_PATH,
      value: JSON.stringify(updatedData),
    });
    console.log(`Successfully saved ${key} to delegation storage`);
  } catch (error) {
    console.error(`Error saving ${key} to delegation storage:`, error);
    throw error;
  }
}

/**
 * Helper function to get data from delegation storage
 *
 * @returns A promise that resolves with the storage data
 */
async function getDelegationStorage(): Promise<Record<string, unknown>> {
  try {
    const storedData = await performGetStorage({
      path: DELEGATION_STORAGE_PATH,
    });

    if (storedData) {
      return typeof storedData === 'string'
        ? JSON.parse(storedData)
        : storedData;
    }
    return {};
  } catch (error) {
    console.error('Error getting delegation storage:', error);
    return {};
  }
}

export default function Delegation({
  accounts,
}: {
  accounts: InternalAccount[];
}) {
  const [loading, setLoading] = useState<boolean>(false);
  const [delegation, setDelegation] = useState<DelegationStruct | undefined>();
  const [signedDelegation, setSignedDelegation] = useState<
    DelegationStruct | undefined
  >();

  // Get delegator (account 1) and delegate (account 2)
  const delegatorAccount = accounts[0];
  const delegateAccount = accounts.length > 1 ? accounts[1] : null;
  const delegateNotFound = !delegateAccount;

  // Load any saved delegation data on component mount
  /*  useEffect(() => {
    const loadSavedData = async () => {
      try {
        setLoading(true);

        // Try to load any saved delegation data
        const storedData = await getDelegationStorage();
        console.log('Raw stored data from storage:', storedData);

        // Restore signed delegation if it exists
        if (storedData.signedDelegation) {
          console.log(
            'Raw signedDelegation from storage:',
            storedData.signedDelegation,
          );
          // Convert the salt back to BigInt when loading from storage
          const loadedDelegation = {
            ...(storedData.signedDelegation as Omit<DelegationStruct, 'salt'>),
            salt: BigInt(
              (storedData.signedDelegation as { salt: string }).salt,
            ),
          };
          console.log(
            'Processed loadedDelegation after salt conversion:',
            loadedDelegation,
          );
          setSignedDelegation(loadedDelegation);
          console.log('Loaded saved signed delegation from storage');
        }
      } catch (error) {
        console.error('Failed to load data on mount:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSavedData();
  }, []); */

  const createDelegation = async () => {
    if (!delegatorAccount || !delegateAccount) {
      throw new Error('Cannot create delegation: Missing accounts');
    }

    const caveateBuilder = createCaveatBuilder(GATOR_ENV);
    const caveats = caveateBuilder.addCaveat(
      'nativeTokenTransferAmount',
      SWAP_LIMIT,
    );

    const rootDelegation = createRootDelegation(
      delegateAccount.address as `0x${string}`,
      delegatorAccount.address as `0x${string}`,
      caveats.build(),
      BigInt(0),
    );

    console.log('delegation', rootDelegation);
    setDelegation(rootDelegation);
  };

  const signDelegation = async () => {
    if (!delegation) {
      throw new Error('Delegation not found');
    }

    try {
      const typedDataObj = {
        types: SIGNABLE_DELEGATION_TYPED_DATA,
        primaryType: 'Delegation',
        domain: {
          name: 'DelegationManager',
          version: '1',
          chainId: sepolia.id,
          verifyingContract: GATOR_ENV.DelegationManager as `0x${string}`,
        },
        message: {
          delegator: delegation.delegator,
          delegate: delegation.delegate,
          salt: delegation.salt.toString(),
          caveats: delegation.caveats,
          authority: delegation.authority,
        },
      };

      const signature = await newUnsignedTypedMessage({
        messageParams: {
          from: delegatorAccount.address,
          data: typedDataObj,
          version: SignTypedDataVersion.V4,
        },
        request: {
          id: 1,
          origin: ORIGIN_METAMASK,
          params: [],
          networkClientId: sepolia.name.toLowerCase(),
        },
        version: SignTypedDataVersion.V4,
        signingOptions: {
          parseJsonData: true,
        },
      });
      console.log('signature', signature);

      if (signature) {
        const signedDelegationData = { ...delegation, signature };
        setSignedDelegation(signedDelegationData);
        /* await saveDelegationStorage('signedDelegation', {
          ...signedDelegationData,
          salt: signedDelegationData.salt.toString(),
        }); */
        console.log('Saved delegation data to storage');
      }
    } catch (error) {
      console.error('Error signing delegation:', error);
      throw error;
    }
  };

  const onCreateDelegation = async () => {
    try {
      setLoading(true);
      await createDelegation();
    } catch (error) {
      console.error('Error creating delegation:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSignDelegation = async () => {
    try {
      setLoading(true);
      await signDelegation();
    } catch (error) {
      console.error('Error signing delegation:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add this new function for sending a standard transaction to redeem delegations
  const redeemDelegationAsTransaction = async () => {
    if (!signedDelegation) {
      throw new Error('Signed delegation not found');
    }

    if (!delegateAccount) {
      throw new Error('Delegate account not found');
    }

    try {
      setLoading(true);

      console.log('signedDelegation', signedDelegation);

      const swapAmount = parseEther('0.001');

      // Get the contract address from the environment
      const delegationManagerAddress = GATOR_ENV.DelegationManager;

      // Create a transaction to the DelegationManager contract
      const encodedCallData = DelegationFramework.encode.redeemDelegations(
        [[{ ...signedDelegation, salt: signedDelegation.salt.toString() }]],
        [SINGLE_TRY_MODE],
        [
          [
            {
              target: delegateAccount.address as `0x${string}`,
              callData: '0x',
              value: swapAmount,
            },
          ],
        ],
      );

      // Send the transaction using MetaMask's sendTransaction action
      const txHash = await addTransaction(
        {
          from: delegateAccount.address,
          to: delegationManagerAddress,
          data: encodedCallData,
          value: '0x0', // No ETH sent with the transaction
        },
        { method: 'eth_sendTransaction' },
      );

      console.log('Transaction sent:', txHash);
      return txHash;
    } catch (error) {
      console.error('Error redeeming delegation as transaction:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const onRedeemDelegation = async () => {
    try {
      setLoading(true);
      await redeemDelegationAsTransaction();
    } catch (error) {
      console.error('Error redeeming delegation:', error);
    } finally {
      setLoading(false);
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
            {delegatorAccount && delegateAccount ? (
              <>
                <Text as="p">
                  Delegator (Account 1): {delegatorAccount.address}
                </Text>
                <Text as="p">
                  Delegate (Account 2): {delegateAccount.address}
                </Text>
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

        {delegatorAccount && delegateAccount && (
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
              <Button
                onClick={onCreateDelegation}
                disabled={Boolean(delegation) || loading}
              >
                {loading ? 'Processing...' : 'Create Delegation'}
              </Button>

              <Button
                onClick={onSignDelegation}
                disabled={!delegation || loading}
              >
                {loading ? 'Signing...' : 'Sign Delegation'}
              </Button>

              {signedDelegation && (
                <>
                  <Label>Signed Delegation:</Label>
                  <Text style={{ wordBreak: 'break-all' }}>
                    {signedDelegation.signature}
                  </Text>
                  <Button onClick={onRedeemDelegation} disabled={loading}>
                    {loading
                      ? 'Processing...'
                      : 'Redeem Delegation (Transaction)'}
                  </Button>
                </>
              )}
            </Box>
          </Card>
        )}
      </Box>
    </div>
  );
}
