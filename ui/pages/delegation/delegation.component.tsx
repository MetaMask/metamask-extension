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
import { ApprovalType, ORIGIN_METAMASK } from '@metamask/controller-utils';
import { InternalAccount } from '@metamask/keyring-internal-api';
import React, { useState } from 'react';
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
import { newUnsignedTypedMessage } from '../../store/actions';
import * as backgroundConnection from '../../store/background-connection';

// Define a proper type for typedData instead of using any
type TypedDataType = {
  types: typeof SIGNABLE_DELEGATION_TYPED_DATA;
  primaryType: string;
  domain: {
    name: string;
    version: string;
    chainId: number;
    verifyingContract: `0x${string}`;
  };
  message: Record<string, unknown>;
};

const SWAP_LIMIT = parseEther('0.1');
export const GATOR_ENV = getDeleGatorEnvironment(sepolia.id, '1.1.0');

export default function Delegation({
  currentAccount,
}: {
  currentAccount: InternalAccount;
}) {
  const [metaMaskSmartAccount, setMetaMaskSmartAccount] = useState<
    MetaMaskSmartAccount<Implementation.Hybrid> | undefined
  >();

  const [delegation, setDelegation] = useState<DelegationStruct | undefined>();
  const [signedDelegation, setSignedDelegation] = useState<
    string | undefined
  >();
  const [verificationStatus, setVerificationStatus] = useState<string | null>(
    null,
  );
  const [typedData, setTypedData] = useState<TypedDataType | null>(null);

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

    console.log('signDelegation');

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
        message: { ...delegation, salt: delegation.salt.toString() },
      };

      setTypedData(typedDataObj);

      console.log('typedDataObj', typedDataObj);

      const response = await newUnsignedTypedMessage(
        {
          from: currentAccount.address,
          data: JSON.stringify(typedDataObj),
        },
        {
          id: 1,
          origin: ORIGIN_METAMASK,
          params: [],
        },
      );
      console.log('response from action wrapper', response);
    } catch (error) {
      console.error('Error signing delegation:', error);
    }
  };

  const verifySignature = async () => {
    if (!signedDelegation || !typedData || !currentAccount.address) {
      setVerificationStatus('Missing data for verification');
      return;
    }

    try {
      const recoveredAddress = await recoverTypedDataAddress({
        domain: typedData.domain,
        types: typedData.types,
        primaryType: typedData.primaryType,
        message: typedData.message,
        signature: signedDelegation as `0x${string}`,
      });

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
        error instanceof Error ? error.message : String(error);
      setVerificationStatus(`❌ Error: ${errorMessage}`);
    }
  };

  const onCreateMetaMaskAccount = async () => {
    const account = await createMetaMaskAccount();
    setMetaMaskSmartAccount(account);
  };

  const onCreateDelegation = async () => {
    await createDelegation();
  };

  const onSignDelegation = async () => {
    await signDelegation();
  };

  const onVerifySignature = async () => {
    await verifySignature();
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
          disabled={Boolean(metaMaskSmartAccount)}
        >
          Create MetaMask Smart Account
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
                disabled={Boolean(delegation)}
              >
                Create Delegation
              </Button>

              <Button
                onClick={onSignDelegation}
                disabled={!delegation || Boolean(signedDelegation)}
              >
                Sign Delegation
              </Button>

              {signedDelegation && (
                <>
                  <Label>Signed Delegation:</Label>
                  <Text style={{ wordBreak: 'break-all' }}>
                    {signedDelegation}
                  </Text>

                  <Button
                    onClick={onVerifySignature}
                    disabled={!signedDelegation}
                  >
                    Verify Signature
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
