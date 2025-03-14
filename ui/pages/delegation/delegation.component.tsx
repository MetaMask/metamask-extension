import {
  createCaveatBuilder,
  createDelegation,
  createRootDelegation,
  DelegationFramework,
  DelegationStruct,
  getDelegationHashOffchain,
  getDeleGatorEnvironment,
  Implementation,
  MetaMaskSmartAccount,
  SIGNABLE_DELEGATION_TYPED_DATA,
  SINGLE_DEFAULT_MODE,
  toMetaMaskSmartAccount,
} from '@metamask-private/delegator-core-viem';
import { ORIGIN_METAMASK } from '@metamask/controller-utils';
import { SignTypedDataVersion } from '@metamask/keyring-controller';
import { InternalAccount } from '@metamask/keyring-internal-api';
import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { createPublicClient, formatEther, http, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import { SEPOLIA_RPC_URL } from '../../../shared/constants/network';
import { Box, Button, Text } from '../../components/component-library';
import Card from '../../components/ui/card';
import {
  getLedgerTransportStatus,
  getLedgerWebHidConnectedStatus,
} from '../../ducks/app/app';
import {
  getLedgerTransportType,
  isAddressLedger,
} from '../../ducks/metamask/metamask';
import {
  BlockSize,
  Display,
  FlexDirection,
  TextColor,
  TextVariant,
} from '../../helpers/constants/design-system';
import {
  performSetStorage,
  addTransaction,
  newUnsignedTypedMessage,
  performGetStorage,
} from '../../store/actions';
import { LEDGER_USB_VENDOR_ID } from '../../../shared/constants/hardware-wallets';
import { Textarea } from '../../components/component-library/textarea';

const SWAP_LIMIT = parseEther('0.1');
const TRANSFER_AMOUNT = parseEther('0.001');
export const GATOR_ENV = getDeleGatorEnvironment(sepolia.id, '1.2.0');
const INTERNAL_GATOR_PK = '';

const RPC_URL = SEPOLIA_RPC_URL;

const EIP712Domain = [
  { name: 'name', type: 'string' },
  { name: 'version', type: 'string' },
  { name: 'chainId', type: 'uint256' },
  { name: 'verifyingContract', type: 'address' },
];

export default function Delegation({
  selectedAccount,
  accounts,
  isHardwareWallet,
  hardwareWalletType,
}: {
  selectedAccount: InternalAccount;
  accounts: InternalAccount[];
  isHardwareWallet: boolean;
  hardwareWalletType?: string;
}) {
  const [loading, setLoading] = useState<boolean>(false);
  const [rootDelegation, setRootDelegation] = useState<
    DelegationStruct | undefined
  >();
  const [redelegation, setRedelegation] = useState<
    DelegationStruct | undefined
  >();
  const [simpleDelegation, setSimpleDelegation] = useState<
    DelegationStruct | undefined
  >();

  const [metaMaskSmartAccount, setMetaMaskSmartAccount] = useState<
    MetaMaskSmartAccount<Implementation.Hybrid> | undefined
  >();
  const [loadingSmartAccount, setLoadingSmartAccount] =
    useState<boolean>(false);
  const [isDeployed, setIsDeployed] = useState<boolean>(false);
  const [gatorBalance, setGatorBalance] = useState<string>('0');
  const [delegationData, setDelegationData] = useState<string>('');
  const ledgerTransportType = useSelector(getLedgerTransportType);
  const transportStatus = useSelector(getLedgerTransportStatus);
  const webHidConnectedStatus = useSelector(getLedgerWebHidConnectedStatus);
  const isLedgerWallet = useSelector(
    (state) =>
      selectedAccount.address &&
      isAddressLedger(state, selectedAccount.address),
  );

  // Get delegator (account 1) and delegate (account 2)
  const account1 = accounts[0];
  const account2 = accounts.length > 1 ? accounts[1] : null;
  const delegateNotFound = !account2;
  const hasAllAccounts = account1 && account2 && metaMaskSmartAccount;

  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(RPC_URL),
  });

  const fetchGatorBalance = useCallback(async (address: string) => {
    try {
      console.log('fetching balance');
      const balance = await publicClient.getBalance({
        address: address as `0x${string}`,
      });
      setGatorBalance(formatEther(balance));
    } catch (error) {
      console.error('Error fetching gator balance:', error);
      setGatorBalance('Error');
    }
  }, []);

  const loadMetaMaskAccount = async () => {
    setLoadingSmartAccount(true);
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
  const checkLedgerConnection = async () => {
    const devices = await window.navigator?.hid?.getDevices();
    const webHidIsConnected = devices?.some(
      (device) => device.vendorId === Number(LEDGER_USB_VENDOR_ID),
    );
    console.log('ledger is connected?', webHidIsConnected);
    return webHidIsConnected;
  };

  // Refresh balance when account is deployed
  useEffect(() => {
    if (metaMaskSmartAccount && isDeployed) {
      fetchGatorBalance(metaMaskSmartAccount.address);
    }
  }, [fetchGatorBalance, isDeployed, metaMaskSmartAccount]);

  useEffect(() => {
    console.log('current account', selectedAccount.address);
    console.log('isHardwareWallet', isHardwareWallet);
    console.log('hardwareWalletType', hardwareWalletType);
    console.log('sepolia rpc url', SEPOLIA_RPC_URL);
    console.log('isLedgerWallet', isLedgerWallet);
    console.log('ledgerTransportType', ledgerTransportType);
    console.log('transportStatus', transportStatus);
    console.log('webHidConnectedStatus', webHidConnectedStatus);
    checkLedgerConnection();
  }, [
    isHardwareWallet,
    hardwareWalletType,
    ledgerTransportType,
    transportStatus,
    webHidConnectedStatus,
    isLedgerWallet,
    selectedAccount.address,
  ]);

  const deployMetaMaskAccount = async () => {
    setLoading(true);
    try {
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
    } catch (error) {
      console.error('Error deploying account:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSimpleDelegation = async () => {
    const delegation = createRootDelegation(
      selectedAccount.address as `0x${string}`,
      metaMaskSmartAccount?.address as `0x${string}`,
      [],
      BigInt(0),
    );
    return { ...delegation, salt: delegation.salt.toString() };
  };

  const generateRootDelegation = async () => {
    setLoading(true);
    try {
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
    } catch (error) {
      console.error('Error generating root delegation:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateRedelegation = async () => {
    setLoading(true);
    try {
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
    } catch (error) {
      console.error('Error generating redelegation:', error);
    } finally {
      setLoading(false);
    }
  };

  const signRedelegation = async () => {
    setLoading(true);
    try {
      if (!redelegation) {
        throw new Error('Delegation not found');
      }

      const parsedRedelegation = {
        ...redelegation,
        salt: redelegation.salt.toString(),
      };

      const typedDataObj = {
        types: { EIP712Domain, ...SIGNABLE_DELEGATION_TYPED_DATA },
        primaryType: 'Delegation',
        domain: {
          name: 'DelegationManager',
          version: '1',
          chainId: String(sepolia.id),
          verifyingContract: GATOR_ENV.DelegationManager,
        },
        message: parsedRedelegation,
      };

      const signature = await newUnsignedTypedMessage({
        messageParams: {
          origin: ORIGIN_METAMASK,
          from: account1.address,
          version: SignTypedDataVersion.V4,
          data: JSON.stringify(typedDataObj),
        },
        request: {
          origin: ORIGIN_METAMASK,
          params: [],
          networkClientId: sepolia.name.toLowerCase(),
        },
        version: SignTypedDataVersion.V4,
      });
      console.log('signature', signature);

      if (signature) {
        const signedDelegationData = {
          ...redelegation,
          signature,
        };
        setRedelegation(signedDelegationData);
        console.log('signedDelegationData', signedDelegationData);
      }
    } catch (error) {
      console.error('Error signing delegation:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const redeemRootDelegation = async () => {
    setLoading(true);
    try {
      if (!rootDelegation) {
        throw new Error('Root delegation not found');
      }

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
    } finally {
      setLoading(false);
    }
  };

  const redeemRedelegation = async () => {
    setLoading(true);
    try {
      if (!redelegation || !rootDelegation) {
        throw new Error('Signed delegations not found');
      }

      if (!account2) {
        throw new Error('Delegate account not found');
      }

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
    } finally {
      setLoading(false);
    }
  };

  const saveDelegationData = async () => {
    const delegation = await generateSimpleDelegation();
    setSimpleDelegation(delegation);
    const path = `accounts_v2.${selectedAccount.address}_delegation`;
    await performSetStorage({
      path,
      value: JSON.stringify(delegation),
    });
    console.log('currentData', delegation);
  };

  const loadDelegationData = useCallback(async () => {
    console.log('loading delegation data for account', selectedAccount.address);
    const path = `accounts_v2.${selectedAccount.address}_delegation`;
    const currentData = (await performGetStorage({ path })) as string;
    console.log('currentData', currentData);
    setSimpleDelegation(currentData ? JSON.parse(currentData) : undefined);
  }, [selectedAccount.address]);

  const clearDelegationData = async () => {
    const path = `accounts_v2.${selectedAccount.address}_delegation`;
    await performSetStorage({ path, value: '' });
    setSimpleDelegation(undefined);
  };

  useEffect(() => {
    loadDelegationData();
  }, [loadDelegationData, selectedAccount.address]);

  return (
    <div className="main-container">
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        gap={2}
        paddingTop={2}
        width={BlockSize.Full}
      >
        <Text as="h3" variant={TextVariant.headingMd}>
          Delegation Demo
        </Text>
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
                    {loading ? 'Deploying...' : 'Deploy Internal Gator'}
                  </Button>
                )}
                {!metaMaskSmartAccount && (
                  <Button
                    onClick={loadMetaMaskAccount}
                    disabled={loadingSmartAccount || loading}
                  >
                    {loadingSmartAccount ? 'Loading...' : 'Load Internal Gator'}
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
                {loading && !rootDelegation
                  ? 'Generating...'
                  : `Generate Root Delegation (Gator -> ${account1.metadata.name})`}
              </Button>

              {/* Step 4: Redeem root delegation */}
              <Button
                onClick={redeemRootDelegation}
                disabled={!rootDelegation || loading}
              >
                {loading && rootDelegation
                  ? 'Redeeming...'
                  : `Redeem Root Delegation (Trigger Transfer Transaction (0.001 ETH) from Gator to ${account1.metadata.name})`}
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
                {loading && !redelegation
                  ? 'Generating...'
                  : `Generate Redelegation (${account1.metadata.name} -> ${account2.metadata.name})`}
              </Button>

              {/* Step 4: Sign redelegation */}
              <Button
                onClick={signRedelegation}
                disabled={
                  !redelegation || redelegation?.signature !== '0x' || loading
                }
              >
                {loading && redelegation?.signature === '0x'
                  ? 'Signing...'
                  : `Sign Redelegation (From ${account1.metadata.name})`}
              </Button>

              {/* Step 5: Redeem root delegation */}
              <Button
                onClick={redeemRedelegation}
                disabled={
                  !redelegation || redelegation?.signature === '0x' || loading
                }
              >
                {loading && redelegation?.signature !== '0x'
                  ? 'Redeeming...'
                  : `Redeem Redelegation (Trigger Transfer Transaction (0.001 ETH) from ${account1.metadata.name} to ${account2.metadata.name})`}
              </Button>
            </Box>
          </Card>
        )}
        <Card>
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            gap={2}
          >
            <Text as="h3">Profile Sync storage</Text>
            <Button onClick={saveDelegationData}>Save Delegation Data</Button>
            <Button onClick={clearDelegationData}>Clear Delegation Data</Button>
            <Textarea
              value={simpleDelegation ? JSON.stringify(simpleDelegation) : ''}
              readOnly
            />
          </Box>
        </Card>
      </Box>
    </div>
  );
}
