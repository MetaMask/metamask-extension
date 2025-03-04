import {
  createCaveatBuilder,
  createRootDelegation,
  DelegationStruct,
  getDeleGatorEnvironment,
  Implementation,
  MetaMaskSmartAccount,
  SIGNABLE_DELEGATION_TYPED_DATA,
  toMetaMaskSmartAccount,
} from '@metamask-private/delegator-core-viem';
import { ORIGIN_METAMASK } from '@metamask/controller-utils';
import { SignTypedDataVersion } from '@metamask/keyring-controller';
import { InternalAccount } from '@metamask/keyring-internal-api';
import React, { useState, useEffect } from 'react';
import {
  createPublicClient,
  http,
  parseEther,
  recoverTypedDataAddress,
} from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import { SEPOLIA_RPC_URL } from '../../../shared/constants/network';
import { Box, Button, Label, Text } from '../../components/component-library';
import Card from '../../components/ui/card';
import {
  BlockSize,
  Display,
  FlexDirection,
} from '../../helpers/constants/design-system';
import {
  newUnsignedTypedMessage,
  performSetStorage,
  performGetStorage,
} from '../../store/actions';

const SWAP_LIMIT = parseEther('0.1');
export const GATOR_ENV = getDeleGatorEnvironment(sepolia.id, '1.1.0');
const DELEGATION_STORAGE_PATH = 'accounts_v2.delegation';

const TYPED_DATA_OBJ = {
  types: SIGNABLE_DELEGATION_TYPED_DATA,
  primaryType: 'Delegation',
  domain: {
    name: 'DelegationManager',
    version: '1',
    chainId: sepolia.id,
    verifyingContract: GATOR_ENV.DelegationManager as `0x${string}`,
  },
};

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
  currentAccount,
}: {
  currentAccount: InternalAccount;
}) {
  const [metaMaskSmartAccount, setMetaMaskSmartAccount] = useState<
    MetaMaskSmartAccount<Implementation.Hybrid> | undefined
  >();
  const [loading, setLoading] = useState<boolean>(false);

  const [delegation, setDelegation] = useState<DelegationStruct | undefined>();
  const [signedDelegation, setSignedDelegation] = useState<
    DelegationStruct | undefined
  >();
  const [verificationStatus, setVerificationStatus] = useState<string | null>(
    null,
  );

  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(SEPOLIA_RPC_URL),
  });

  const loadMetaMaskAccount = async () => {
    setLoading(true);
    try {
      // First, check if we already have an owner private key stored
      let ownerPk;
      const storedData = await getDelegationStorage();

      ownerPk = storedData.ownerPk as string;

      if (ownerPk) {
        console.log('Found existing owner private key');
      } else {
        // If no existing owner PK, generate a new one
        ownerPk = generatePrivateKey();
        console.log('Generated new owner private key');

        await saveDelegationStorage('ownerPk', ownerPk);
      }

      const owner = privateKeyToAccount(ownerPk as `0x${string}`);

      const account = await toMetaMaskSmartAccount({
        client: publicClient,
        implementation: Implementation.Hybrid,
        deployParams: [owner.address, [], [], []],
        deploySalt: '0x',
        signatory: { account: owner },
      });

      setMetaMaskSmartAccount(account);
      return account;
    } catch (error) {
      console.error('Error loading MetaMask account:', error);
      throw error; // Re-throw to be handled by the caller
    } finally {
      setLoading(false);
    }
  };

  // Load MetaMask account and any saved delegation data on component mount
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        setLoading(true);

        // Load account first
        await loadMetaMaskAccount();

        // Then try to load any saved delegation data
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
  }, []);

  const createMetaMaskAccount = async () => {
    return await loadMetaMaskAccount();
  };

  const createDelegation = async () => {
    if (!metaMaskSmartAccount) {
      throw new Error('MetaMask Smart Account not found');
    }

    const caveateBuilder = createCaveatBuilder(GATOR_ENV);
    const caveats = caveateBuilder.addCaveat(
      'nativeTokenTransferAmount',
      SWAP_LIMIT,
    );

    const rootDelegation = createRootDelegation(
      metaMaskSmartAccount.address,
      currentAccount.address as `0x${string}`,
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
        ...TYPED_DATA_OBJ,
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
          from: currentAccount.address,
          data: JSON.stringify(typedDataObj),
        },
        request: {
          id: 1,
          origin: ORIGIN_METAMASK,
          params: [],
          networkClientId: sepolia.name.toLowerCase(),
        },
        version: SignTypedDataVersion.V4,
      });
      console.log('signature', signature);

      if (signature) {
        const signedDelegationData = { ...delegation, signature };
        setSignedDelegation(signedDelegationData);
        await saveDelegationStorage('signedDelegation', {
          ...signedDelegationData,
          salt: signedDelegationData.salt.toString(),
        });
        console.log('Saved delegation data to storage');
      }
    } catch (error) {
      console.error('Error signing delegation:', error);
      throw error;
    }
  };

  const verifySignature = async () => {
    if (!signedDelegation || !currentAccount.address) {
      setVerificationStatus('Missing data for verification');
      return;
    }

    try {
      // Ensure the salt is properly handled whether it's a BigInt or a string
      const salt =
        typeof signedDelegation.salt === 'bigint'
          ? signedDelegation.salt.toString()
          : signedDelegation.salt;

      const recoveredAddress = await recoverTypedDataAddress({
        domain: TYPED_DATA_OBJ.domain,
        types: TYPED_DATA_OBJ.types,
        primaryType: TYPED_DATA_OBJ.primaryType,
        message: {
          delegator: signedDelegation.delegator,
          delegate: signedDelegation.delegate,
          salt,
          caveats: signedDelegation.caveats,
          authority: signedDelegation.authority,
        },
        signature: signedDelegation.signature as `0x${string}`,
      });

      console.log('Recovered address:', recoveredAddress);
      console.log('Current account address:', currentAccount.address);

      if (
        recoveredAddress.toLowerCase() === currentAccount.address.toLowerCase()
      ) {
        setVerificationStatus('✅ Signature verified successfully!');
      } else {
        setVerificationStatus('❌ Signature verification failed!');
      }
    } catch (error: unknown) {
      console.error('Error verifying signature:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      setVerificationStatus(`❌ Error: ${errorMessage}`);
    }
  };

  const onCreateMetaMaskAccount = async () => {
    try {
      setLoading(true);
      const account = await createMetaMaskAccount();
      setMetaMaskSmartAccount(account);
    } catch (error) {
      console.error('Error creating MetaMask account:', error);
    } finally {
      setLoading(false);
    }
  };

  const onCreateDelegation = async () => {
    try {
      setLoading(true);
      await createDelegation();
      // We don't save delegation here anymore, only when signed
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

  const onVerifySignature = async () => {
    try {
      setLoading(true);
      await verifySignature();
    } catch (error: unknown) {
      console.error('Error verifying signature:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      setVerificationStatus(`❌ Error: ${errorMessage}`);
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
        <Button
          onClick={onCreateMetaMaskAccount}
          disabled={Boolean(metaMaskSmartAccount) || loading}
        >
          {loading ? 'Loading...' : 'Create MetaMask Smart Account'}
        </Button>

        {metaMaskSmartAccount && (
          <Card
            display={Display.Flex}
            width={BlockSize.Full}
            gap={2}
            flexDirection={FlexDirection.Column}
          >
            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Row}
              gap={2}
            >
              <Label>Smart Account Address:</Label>
              <Text>{metaMaskSmartAccount?.address}</Text>
            </Box>

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

                  <Button
                    onClick={onVerifySignature}
                    disabled={!signedDelegation || loading}
                  >
                    {loading ? 'Verifying...' : 'Verify Signature'}
                  </Button>

                  {verificationStatus && (
                    <Box
                      display={Display.Flex}
                      flexDirection={FlexDirection.Row}
                      gap={2}
                    >
                      <Label>Verification Status:</Label>
                      <Text>{verificationStatus}</Text>
                    </Box>
                  )}
                </>
              )}
            </Box>
          </Card>
        )}
      </Box>
    </div>
  );
}
