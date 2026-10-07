/* eslint-disable @typescript-eslint/no-require-imports */
import { Mockttp } from 'mockttp';
import { NETWORK_CLIENT_ID, WINDOW_TITLES } from '../../../constants';
import { withFixtures } from '../../../helpers';
import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import { createDappTransaction } from '../../../page-objects/flows/transaction.flow';
import ContractAddressRegistry from '../../../seeder/contract-address-registry';
import { Driver } from '../../../webdriver/driver';
import { MockedEndpoint } from '../../../mock-e2e';
import { login } from '../../../page-objects/flows/login.flow';
import TestDapp from '../../../page-objects/pages/test-dapp';
import ActivityTab from '../../../page-objects/pages/home/activity-tab';
import HomePage from '../../../page-objects/pages/home/homepage';
import TransactionConfirmation from '../../../page-objects/pages/confirmations/transaction-confirmation';
import SettingsPage from '../../../page-objects/pages/settings/settings-page';
import TransactionsSettingsPage from '../../../page-objects/pages/settings/transactions-settings';
import {
  assertAdvancedGasDetails,
  assertAdvancedGasDetailsWithFewerFields,
  TestSuiteArguments,
  toggleAdvancedDetails,
} from './shared';

const { hexToNumber } = require('@metamask/utils');
const {
  KNOWN_PUBLIC_KEY_ADDRESSES,
} = require('../../../../stub/keyring-bridge');

const { SMART_CONTRACTS } = require('../../../seeder/smart-contracts');

const { CHAIN_IDS } = {
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get ABSTRACT_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network')
      .ABSTRACT_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get ABSTRACT_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .ABSTRACT_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get ACALA_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network')
      .ACALA_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get ACALA_IMAGE_URL() {
    return require('../../../../../shared/constants/network').ACALA_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get ACALA_TESTNET_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network')
      .ACALA_TESTNET_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get ACALA_TOKEN_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .ACALA_TOKEN_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get AETH_TOKEN_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .AETH_TOKEN_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get APECHAIN_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network')
      .APECHAIN_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get APECHAIN_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .APECHAIN_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get APECHAIN_NATIVE_TOKEN_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .APECHAIN_NATIVE_TOKEN_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get APECHAIN_TESTNET_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network')
      .APECHAIN_TESTNET_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get ARBITRUM_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network')
      .ARBITRUM_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get ARBITRUM_NOVA_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .ARBITRUM_NOVA_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get ARC_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network').ARC_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get ARC_NATIVE_TOKEN_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .ARC_NATIVE_TOKEN_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get ARC_NETWORK_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .ARC_NETWORK_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get ARC_USDC_TOKEN_ADDRESS() {
    return require('../../../../../shared/constants/network')
      .ARC_USDC_TOKEN_ADDRESS;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get ASTAR_IMAGE_URL() {
    return require('../../../../../shared/constants/network').ASTAR_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get AURORA_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network')
      .AURORA_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get AVALANCHE_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network')
      .AVALANCHE_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get AVAX_TOKEN_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .AVAX_TOKEN_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get B3_IMAGE_URL() {
    return require('../../../../../shared/constants/network').B3_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get BAHAMUT_IMAGE_URL() {
    return require('../../../../../shared/constants/network').BAHAMUT_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get BASE_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network').BASE_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get BASE_TOKEN_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .BASE_TOKEN_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get BERACHAIN_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network')
      .BERACHAIN_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get BERACHAIN_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .BERACHAIN_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get BERACHAIN_NATIVE_TOKEN_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .BERACHAIN_NATIVE_TOKEN_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get BITCOIN_IMAGE_URL() {
    return require('../../../../../shared/constants/network').BITCOIN_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get BITCOIN_SIGNET_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .BITCOIN_SIGNET_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get BITCOIN_TESTNET_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .BITCOIN_TESTNET_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get BLACKFORT_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .BLACKFORT_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get BNB_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network').BNB_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get BNB_TOKEN_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .BNB_TOKEN_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get BOB_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network').BOB_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get BOB_IMAGE_URL() {
    return require('../../../../../shared/constants/network').BOB_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get BSC_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network').BSC_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get BUILT_IN_INFURA_NETWORKS() {
    return require('../../../../../shared/constants/network')
      .BUILT_IN_INFURA_NETWORKS;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get BUILT_IN_NETWORKS() {
    return require('../../../../../shared/constants/network').BUILT_IN_NETWORKS;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get CAIP_FORMATTED_TEST_CHAINS() {
    return require('../../../../../shared/constants/network')
      .CAIP_FORMATTED_TEST_CHAINS;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get CANTO_IMAGE_URL() {
    return require('../../../../../shared/constants/network').CANTO_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get CELO_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network').CELO_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get CELO_TOKEN_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .CELO_TOKEN_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get CHAINLIST_CHAIN_IDS_MAP() {
    return require('../../../../../shared/constants/network')
      .CHAINLIST_CHAIN_IDS_MAP;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get CHAINLIST_CURRENCY_SYMBOLS_MAP_NETWORK_COLLISION() {
    return require('../../../../../shared/constants/network')
      .CHAINLIST_CURRENCY_SYMBOLS_MAP_NETWORK_COLLISION;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get CHAIN_IDS() {
    return require('../../../../../shared/constants/chain-ids').CHAIN_IDS;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get CHAIN_ID_PORTFOLIO_LANDING_PAGE_URL_MAP() {
    return require('../../../../../shared/constants/network')
      .CHAIN_ID_PORTFOLIO_LANDING_PAGE_URL_MAP;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get CHAIN_ID_TOKEN_IMAGE_MAP() {
    return require('../../../../../shared/constants/network')
      .CHAIN_ID_TOKEN_IMAGE_MAP;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get CHAIN_ID_TO_CURRENCY_SYMBOL_MAP() {
    return require('../../../../../shared/constants/network')
      .CHAIN_ID_TO_CURRENCY_SYMBOL_MAP;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get CHAIN_ID_TO_CURRENCY_SYMBOL_MAP_NETWORK_COLLISION() {
    return require('../../../../../shared/constants/network')
      .CHAIN_ID_TO_CURRENCY_SYMBOL_MAP_NETWORK_COLLISION;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get CHAIN_ID_TO_ETHERS_NETWORK_NAME_MAP() {
    return require('../../../../../shared/constants/network')
      .CHAIN_ID_TO_ETHERS_NETWORK_NAME_MAP;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get CHAIN_ID_TO_GAS_LIMIT_BUFFER_MAP() {
    return require('../../../../../shared/constants/network')
      .CHAIN_ID_TO_GAS_LIMIT_BUFFER_MAP;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP() {
    return require('../../../../../shared/constants/network')
      .CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get CHAIN_ID_TO_RPC_URL_MAP() {
    return require('../../../../../shared/constants/network')
      .CHAIN_ID_TO_RPC_URL_MAP;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get CHAIN_ID_TO_TYPE_MAP() {
    return require('../../../../../shared/constants/network')
      .CHAIN_ID_TO_TYPE_MAP;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get CHAIN_SPEC_URL() {
    return require('../../../../../shared/constants/network').CHAIN_SPEC_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get CHILIZ_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network')
      .CHILIZ_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get CHILIZ_IMAGE_URL() {
    return require('../../../../../shared/constants/network').CHILIZ_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get CONFLUX_ESPACE_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .CONFLUX_ESPACE_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get CORE_BLOCKCHAIN_MAINNET_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .CORE_BLOCKCHAIN_MAINNET_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get CRONOS_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network')
      .CRONOS_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get CRONOS_IMAGE_URL() {
    return require('../../../../../shared/constants/network').CRONOS_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get CURRENCY_SYMBOLS() {
    return require('../../../../../shared/constants/network').CURRENCY_SYMBOLS;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get DEPRECATED_NETWORKS() {
    return require('../../../../../shared/constants/network')
      .DEPRECATED_NETWORKS;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get DEXALOT_SUBNET_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .DEXALOT_SUBNET_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get DFK_CHAIN_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .DFK_CHAIN_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get DOGECHAIN_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .DOGECHAIN_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get EDUCHAIN_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network')
      .EDUCHAIN_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get EDUCHAIN_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .EDUCHAIN_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get ENDURANCE_SMART_CHAIN_MAINNET_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .ENDURANCE_SMART_CHAIN_MAINNET_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get ETHEREUM_CLASSIC_MAINNET_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .ETHEREUM_CLASSIC_MAINNET_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get ETHERLINK_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network')
      .ETHERLINK_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get ETHERLINK_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .ETHERLINK_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get ETHERLINK_NATIVE_TOKEN_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .ETHERLINK_NATIVE_TOKEN_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get ETHERSCAN_SUPPORTED_NETWORKS() {
    return require('../../../../../shared/constants/network')
      .ETHERSCAN_SUPPORTED_NETWORKS;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get ETH_TOKEN_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .ETH_TOKEN_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get EVMOS_IMAGE_URL() {
    return require('../../../../../shared/constants/network').EVMOS_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get FANTOM_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network')
      .FANTOM_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get FEATURED_NETWORK_CHAIN_IDS() {
    return require('../../../../../shared/constants/network')
      .FEATURED_NETWORK_CHAIN_IDS;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get FEATURED_NETWORK_CHAIN_IDS_MULTICHAIN() {
    return require('../../../../../shared/constants/network')
      .FEATURED_NETWORK_CHAIN_IDS_MULTICHAIN;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get FEATURED_RPCS() {
    return require('../../../../../shared/constants/network').FEATURED_RPCS;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get FILECOIN_MAINNET_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .FILECOIN_MAINNET_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get FLARE_MAINNET_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .FLARE_MAINNET_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get FLOW_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network').FLOW_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get FLOW_IMAGE_URL() {
    return require('../../../../../shared/constants/network').FLOW_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get FRAX_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network').FRAX_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get FRAX_IMAGE_URL() {
    return require('../../../../../shared/constants/network').FRAX_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get FRAX_NATIVE_TOKEN_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .FRAX_NATIVE_TOKEN_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get FTM_TOKEN_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .FTM_TOKEN_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get FUNKICHAIN_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .FUNKICHAIN_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get FUSE_GOLD_MAINNET_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .FUSE_GOLD_MAINNET_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get GNOSIS_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network')
      .GNOSIS_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get GNOSIS_NETWORK_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .GNOSIS_NETWORK_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get GNOSIS_TOKEN_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .GNOSIS_TOKEN_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get GOERLI_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network')
      .GOERLI_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get GOERLI_RPC_URL() {
    return require('../../../../../shared/constants/network').GOERLI_RPC_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get GRAVITY_ALPHA_MAINNET_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .GRAVITY_ALPHA_MAINNET_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get GRAVITY_ALPHA_TESTNET_SEPOLIA_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .GRAVITY_ALPHA_TESTNET_SEPOLIA_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get GRAVITY_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network')
      .GRAVITY_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get GRAVITY_IMAGE_URL() {
    return require('../../../../../shared/constants/network').GRAVITY_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get GSYS_IMAGE_URL() {
    return require('../../../../../shared/constants/network').GSYS_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get HAQQ_NETWORK_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .HAQQ_NETWORK_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get HARMONY_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network')
      .HARMONY_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get HARMONY_ONE_TOKEN_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .HARMONY_ONE_TOKEN_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get HEMI_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network').HEMI_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get HEMI_IMAGE_URL() {
    return require('../../../../../shared/constants/network').HEMI_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get HYPEREVM_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network')
      .HYPEREVM_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get HYPEREVM_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .HYPEREVM_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get INFURA_BLOCKED_KEY() {
    return require('../../../../../shared/constants/network')
      .INFURA_BLOCKED_KEY;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get INFURA_PROVIDER_TYPES() {
    return require('../../../../../shared/constants/network')
      .INFURA_PROVIDER_TYPES;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get INJECTIVE_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network')
      .INJECTIVE_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get INJECTIVE_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .INJECTIVE_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get INK_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network').INK_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get INK_IMAGE_URL() {
    return require('../../../../../shared/constants/network').INK_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get INK_SEPOLIA_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network')
      .INK_SEPOLIA_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get INK_SEPOLIA_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .INK_SEPOLIA_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get IOTEX_IMAGE_URL() {
    return require('../../../../../shared/constants/network').IOTEX_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get IPFS_DEFAULT_GATEWAY_URL() {
    return require('../../../../../shared/constants/network')
      .IPFS_DEFAULT_GATEWAY_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get IPFS_FORBIDDEN_GATEWAY() {
    return require('../../../../../shared/constants/network')
      .IPFS_FORBIDDEN_GATEWAY;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get IPFS_FORBIDDEN_GATEWAYS() {
    return require('../../../../../shared/constants/network')
      .IPFS_FORBIDDEN_GATEWAYS;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get KAIA_MAINNET_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .KAIA_MAINNET_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get KARURA_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network')
      .KARURA_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get KARURA_IMAGE_URL() {
    return require('../../../../../shared/constants/network').KARURA_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get KARURA_TOKEN_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .KARURA_TOKEN_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get KATANA_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network')
      .KATANA_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get KATANA_IMAGE_URL() {
    return require('../../../../../shared/constants/network').KATANA_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get KCC_MAINNET_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .KCC_MAINNET_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get KONET_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network')
      .KONET_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get KONET_IMAGE_URL() {
    return require('../../../../../shared/constants/network').KONET_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get KROMA_MAINNET_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .KROMA_MAINNET_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get LENS_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network').LENS_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get LENS_IMAGE_URL() {
    return require('../../../../../shared/constants/network').LENS_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get LENS_NATIVE_TOKEN_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .LENS_NATIVE_TOKEN_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get LIGHT_LINK_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .LIGHT_LINK_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get LINEA_GOERLI_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network')
      .LINEA_GOERLI_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get LINEA_GOERLI_RPC_URL() {
    return require('../../../../../shared/constants/network')
      .LINEA_GOERLI_RPC_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get LINEA_GOERLI_TOKEN_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .LINEA_GOERLI_TOKEN_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get LINEA_MAINNET_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network')
      .LINEA_MAINNET_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get LINEA_MAINNET_RPC_URL() {
    return require('../../../../../shared/constants/network')
      .LINEA_MAINNET_RPC_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get LINEA_MAINNET_TOKEN_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .LINEA_MAINNET_TOKEN_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get LINEA_SEPOLIA_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network')
      .LINEA_SEPOLIA_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get LINEA_SEPOLIA_RPC_URL() {
    return require('../../../../../shared/constants/network')
      .LINEA_SEPOLIA_RPC_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get LINEA_SEPOLIA_TOKEN_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .LINEA_SEPOLIA_TOKEN_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get LISK_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network').LISK_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get LISK_IMAGE_URL() {
    return require('../../../../../shared/constants/network').LISK_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get LISK_SEPOLIA_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network')
      .LISK_SEPOLIA_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get LISK_SEPOLIA_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .LISK_SEPOLIA_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get LOCALHOST_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network')
      .LOCALHOST_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get LOCALHOST_RPC_URL() {
    return require('../../../../../shared/constants/network').LOCALHOST_RPC_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get LUKSO_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network')
      .LUKSO_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get LUKSO_IMAGE_URL() {
    return require('../../../../../shared/constants/network').LUKSO_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get LUKSO_NATIVE_TOKEN_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .LUKSO_NATIVE_TOKEN_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get MAINNET_CHAINS() {
    return require('../../../../../shared/constants/network').MAINNET_CHAINS;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get MAINNET_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network')
      .MAINNET_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get MAINNET_RPC_URL() {
    return require('../../../../../shared/constants/network').MAINNET_RPC_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get MANTA_PACIFIC_MAINNET_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .MANTA_PACIFIC_MAINNET_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get MANTLE_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network')
      .MANTLE_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get MANTLE_MAINNET_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .MANTLE_MAINNET_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get MANTLE_NATIVE_TOKEN_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .MANTLE_NATIVE_TOKEN_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get MATCHAIN_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network')
      .MATCHAIN_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get MATCHAIN_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .MATCHAIN_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get MAX_SAFE_CHAIN_ID() {
    return require('../../../../../shared/constants/network').MAX_SAFE_CHAIN_ID;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get MEGAETH_MAINNET_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network')
      .MEGAETH_MAINNET_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get MEGAETH_MAINNET_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .MEGAETH_MAINNET_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get MEGAETH_TESTNET_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network')
      .MEGAETH_TESTNET_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get MEGAETH_TESTNET_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .MEGAETH_TESTNET_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get MEGAETH_TESTNET_RPC_URL() {
    return require('../../../../../shared/constants/network')
      .MEGAETH_TESTNET_RPC_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get MEGAETH_TESTNET_V2_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network')
      .MEGAETH_TESTNET_V2_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get MEGAETH_TESTNET_V2_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .MEGAETH_TESTNET_V2_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get MEGAETH_TESTNET_V2_RPC_URL() {
    return require('../../../../../shared/constants/network')
      .MEGAETH_TESTNET_V2_RPC_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get METACHAIN_ONE_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network')
      .METACHAIN_ONE_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get MINIMUM_TOKEN_OCCURRENCES() {
    return require('../../../../../shared/constants/network')
      .MINIMUM_TOKEN_OCCURRENCES;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get MODE_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network').MODE_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get MODE_IMAGE_URL() {
    return require('../../../../../shared/constants/network').MODE_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get MODE_SEPOLIA_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network')
      .MODE_SEPOLIA_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get MODE_SEPOLIA_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .MODE_SEPOLIA_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get MONAD_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network')
      .MONAD_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get MONAD_IMAGE_URL() {
    return require('../../../../../shared/constants/network').MONAD_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get MONAD_TESTNET_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network')
      .MONAD_TESTNET_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get MONAD_TESTNET_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .MONAD_TESTNET_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get MONAD_TESTNET_RPC_URL() {
    return require('../../../../../shared/constants/network')
      .MONAD_TESTNET_RPC_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get MOONBEAM_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network')
      .MOONBEAM_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get MOONBEAM_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .MOONBEAM_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get MOONBEAM_TOKEN_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .MOONBEAM_TOKEN_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get MOONRIVER_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network')
      .MOONRIVER_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get MOONRIVER_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .MOONRIVER_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get MOONRIVER_TOKEN_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .MOONRIVER_TOKEN_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get MSU_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network').MSU_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get MSU_IMAGE_URL() {
    return require('../../../../../shared/constants/network').MSU_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get MSU_NATIVE_TOKEN_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .MSU_NATIVE_TOKEN_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get NEAR_AURORA_MAINNET_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .NEAR_AURORA_MAINNET_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get NEAR_IMAGE_URL() {
    return require('../../../../../shared/constants/network').NEAR_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get NEBULA_MAINNET_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .NEBULA_MAINNET_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get NETWORK_NAMES() {
    return require('../../../../../shared/constants/network').NETWORK_NAMES;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get NETWORK_TO_NAME_MAP() {
    return require('../../../../../shared/constants/network')
      .NETWORK_TO_NAME_MAP;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get NETWORK_TYPES() {
    return require('../../../../../shared/constants/network').NETWORK_TYPES;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get NOMINA_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network')
      .NOMINA_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get NOMINA_IMAGE_URL() {
    return require('../../../../../shared/constants/network').NOMINA_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get NOMINA_NATIVE_TOKEN_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .NOMINA_NATIVE_TOKEN_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get NON_EVM_CURRENCY_SYMBOLS() {
    return require('../../../../../shared/constants/network')
      .NON_EVM_CURRENCY_SYMBOLS;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get NUMBERS_MAINNET_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .NUMBERS_MAINNET_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get NUMBERS_TOKEN_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .NUMBERS_TOKEN_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get NetworkStatus() {
    return require('../../../../../shared/constants/network').NetworkStatus;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get OASYS_MAINNET_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .OASYS_MAINNET_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get OKXCHAIN_MAINNET_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .OKXCHAIN_MAINNET_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get OPTIMISM_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network')
      .OPTIMISM_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get OPTIMISM_TOKEN_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .OPTIMISM_TOKEN_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get OP_BNB_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network')
      .OP_BNB_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get PALM_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network').PALM_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get PALM_TOKEN_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .PALM_TOKEN_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get PGN_MAINNET_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .PGN_MAINNET_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get PLASMA_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network')
      .PLASMA_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get PLASMA_IMAGE_URL() {
    return require('../../../../../shared/constants/network').PLASMA_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get PLASMA_NATIVE_TOKEN_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .PLASMA_NATIVE_TOKEN_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get PLUME_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network')
      .PLUME_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get PLUME_IMAGE_URL() {
    return require('../../../../../shared/constants/network').PLUME_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get PLUME_NATIVE_TOKEN_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .PLUME_NATIVE_TOKEN_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get POLYGON_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network')
      .POLYGON_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get POLYGON_ZKEVM_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network')
      .POLYGON_ZKEVM_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get POL_TOKEN_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .POL_TOKEN_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get PULSECHAIN_MAINNET_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .PULSECHAIN_MAINNET_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get ROBINHOOD_CHAIN_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network')
      .ROBINHOOD_CHAIN_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get ROBINHOOD_CHAIN_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .ROBINHOOD_CHAIN_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get ROOTSTOCK_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network')
      .ROOTSTOCK_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get ROOTSTOCK_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .ROOTSTOCK_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get ROOTSTOCK_NATIVE_TOKEN_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .ROOTSTOCK_NATIVE_TOKEN_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get ROOTSTOCK_TESTNET_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network')
      .ROOTSTOCK_TESTNET_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get SCROLL_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network')
      .SCROLL_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get SCROLL_IMAGE_URL() {
    return require('../../../../../shared/constants/network').SCROLL_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get SCROLL_SEPOLIA_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network')
      .SCROLL_SEPOLIA_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get SEI_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network').SEI_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get SEI_IMAGE_URL() {
    return require('../../../../../shared/constants/network').SEI_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get SEI_NATIVE_TOKEN_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .SEI_NATIVE_TOKEN_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get SEPOLIA_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network')
      .SEPOLIA_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get SEPOLIA_RPC_URL() {
    return require('../../../../../shared/constants/network').SEPOLIA_RPC_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get SHAPE_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network')
      .SHAPE_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get SHAPE_IMAGE_URL() {
    return require('../../../../../shared/constants/network').SHAPE_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get SHAPE_SEPOLIA_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network')
      .SHAPE_SEPOLIA_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get SHAPE_SEPOLIA_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .SHAPE_SEPOLIA_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get SHARDEUM_LIBERTY_2X_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .SHARDEUM_LIBERTY_2X_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get SHARDEUM_SPHINX_1X_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .SHARDEUM_SPHINX_1X_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get SHIB_MAINNET_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .SHIB_MAINNET_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get SOLANA_DEVNET_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .SOLANA_DEVNET_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get SOLANA_IMAGE_URL() {
    return require('../../../../../shared/constants/network').SOLANA_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get SOLANA_TESTNET_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .SOLANA_TESTNET_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get SOMNIA_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network')
      .SOMNIA_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get SOMNIA_IMAGE_URL() {
    return require('../../../../../shared/constants/network').SOMNIA_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get SOMNIA_NATIVE_TOKEN_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .SOMNIA_NATIVE_TOKEN_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get SONEIUM_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network')
      .SONEIUM_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get SONEIUM_IMAGE_URL() {
    return require('../../../../../shared/constants/network').SONEIUM_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get SONEIUM_TESTNET_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network')
      .SONEIUM_TESTNET_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get SONGBIRD_MAINNET_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .SONGBIRD_MAINNET_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get SONIC_MAINNET_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .SONIC_MAINNET_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get SOPHON_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network')
      .SOPHON_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get SOPHON_IMAGE_URL() {
    return require('../../../../../shared/constants/network').SOPHON_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get SOPHON_TESTNET_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network')
      .SOPHON_TESTNET_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get SOPHON_TESTNET_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .SOPHON_TESTNET_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get STABLE_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network')
      .STABLE_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get STABLE_IMAGE_URL() {
    return require('../../../../../shared/constants/network').STABLE_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get STABLE_NATIVE_TOKEN_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .STABLE_NATIVE_TOKEN_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get STELLAR_IMAGE_URL() {
    return require('../../../../../shared/constants/network').STELLAR_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get STEP_NETWORK_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .STEP_NETWORK_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get TELOS_EVM_MAINNET_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .TELOS_EVM_MAINNET_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get TEMPO_MAINNET_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network')
      .TEMPO_MAINNET_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get TEMPO_MAINNET_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .TEMPO_MAINNET_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get TEMPO_NATIVE_TOKEN_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .TEMPO_NATIVE_TOKEN_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get TEMPO_TESTNET_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network')
      .TEMPO_TESTNET_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get TEMPO_TESTNET_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .TEMPO_TESTNET_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get TENET_MAINNET_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .TENET_MAINNET_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get TEST_CHAINS() {
    return require('../../../../../shared/constants/network').TEST_CHAINS;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get TEST_ETH_TOKEN_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .TEST_ETH_TOKEN_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get TEST_NETWORKS() {
    return require('../../../../../shared/constants/network').TEST_NETWORKS;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get TEST_NETWORK_IDS() {
    return require('../../../../../shared/constants/network').TEST_NETWORK_IDS;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get TEST_NETWORK_TICKER_MAP() {
    return require('../../../../../shared/constants/network')
      .TEST_NETWORK_TICKER_MAP;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get TOKEN_OCCURRENCES_MAP() {
    return require('../../../../../shared/constants/network')
      .TOKEN_OCCURRENCES_MAP;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get TRON_IMAGE_URL() {
    return require('../../../../../shared/constants/network').TRON_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get TRON_NILE_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .TRON_NILE_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get TRON_SHASTA_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .TRON_SHASTA_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get UNICHAIN_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .UNICHAIN_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get UNSUPPORTED_RPC_METHODS() {
    return require('../../../../../shared/constants/network')
      .UNSUPPORTED_RPC_METHODS;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get VELAS_EVM_MAINNET_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .VELAS_EVM_MAINNET_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get XDC_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network').XDC_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get XDC_IMAGE_URL() {
    return require('../../../../../shared/constants/network').XDC_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get XDC_NATIVE_TOKEN_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .XDC_NATIVE_TOKEN_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get XRPLEVM_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network')
      .XRPLEVM_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get XRPLEVM_IMAGE_URL() {
    return require('../../../../../shared/constants/network').XRPLEVM_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get XRPLEVM_NATIVE_TOKEN_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .XRPLEVM_NATIVE_TOKEN_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get XRPLEVM_TESTNET_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network')
      .XRPLEVM_TESTNET_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get XRPLEVM_TESTNET_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .XRPLEVM_TESTNET_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get XRPLEVM_TESTNET_NATIVE_TOKEN_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .XRPLEVM_TESTNET_NATIVE_TOKEN_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get X_LAYER_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network')
      .X_LAYER_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get X_LAYER_IMAGE_URL() {
    return require('../../../../../shared/constants/network').X_LAYER_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get X_LAYER_NATIVE_TOKEN_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .X_LAYER_NATIVE_TOKEN_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get ZERO_G_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network')
      .ZERO_G_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get ZERO_G_IMAGE_URL() {
    return require('../../../../../shared/constants/network').ZERO_G_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get ZERO_G_NATIVE_TOKEN_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .ZERO_G_NATIVE_TOKEN_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get ZKATANA_MAINNET_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .ZKATANA_MAINNET_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get ZKEVM_MAINNET_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .ZKEVM_MAINNET_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get ZK_SYNC_ERA_DISPLAY_NAME() {
    return require('../../../../../shared/constants/network')
      .ZK_SYNC_ERA_DISPLAY_NAME;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get ZK_SYNC_ERA_TOKEN_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .ZK_SYNC_ERA_TOKEN_IMAGE_URL;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get ZORA_MAINNET_IMAGE_URL() {
    return require('../../../../../shared/constants/network')
      .ZORA_MAINNET_IMAGE_URL;
  },
  get allowedInfuraHosts() {
    return require('../../../../../shared/constants/network')
      .allowedInfuraHosts;
  },
  get getRpcUrl() {
    return require('../../../../../shared/constants/network').getRpcUrl;
  },
  get infuraChainIdsTestNets() {
    return require('../../../../../shared/constants/network')
      .infuraChainIdsTestNets;
  },
  get infuraProjectId() {
    return require('../../../../../shared/constants/network').infuraProjectId;
  },
};

describe('Confirmation Redesign Contract Interaction Component', function () {
  const smartContract = SMART_CONTRACTS.PIGGYBANK;

  describe('Create a deposit transaction', function () {
    it(`Sends a contract interaction type 0 transaction (Legacy)`, async function () {
      await withFixtures(
        {
          dappOptions: { numberOfTestDapps: 1 },
          fixtures: new FixtureBuilderV2()
            .withPermissionControllerConnectedToTestDapp()
            .build(),
          localNodeOptions: {
            hardfork: 'muirGlacier',
          },
          smartContract,
          title: this.test?.fullTitle(),
        },
        async ({
          driver,
          contractRegistry,
          localNodes,
        }: TestSuiteArguments) => {
          const contractAddress =
            await contractRegistry?.getContractAddress(smartContract);
          await login(driver, { localNode: localNodes?.[0] });
          const testDapp = new TestDapp(driver);
          await testDapp.openTestDappPage({ contractAddress });
          await testDapp.checkPageIsLoaded();

          await testDapp.createDepositTransaction();
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          const transactionConfirmation = new TransactionConfirmation(driver);
          await transactionConfirmation.checkPageIsLoaded();
          await transactionConfirmation.clickFooterButton({
            button: 'confirm',
          });
        },
      );
    });

    it(`Sends a contract interaction type 2 transaction (EIP1559)`, async function () {
      await withFixtures(
        {
          dappOptions: { numberOfTestDapps: 1 },
          fixtures: new FixtureBuilderV2()
            .withPermissionControllerConnectedToTestDapp()
            .build(),
          smartContract,
          title: this.test?.fullTitle(),
        },
        async ({
          driver,
          contractRegistry,
          localNodes,
        }: TestSuiteArguments) => {
          const contractAddress =
            await contractRegistry?.getContractAddress(smartContract);

          await login(driver, { localNode: localNodes?.[0] });
          const testDapp = new TestDapp(driver);
          await testDapp.openTestDappPage({ contractAddress });
          await testDapp.checkPageIsLoaded();
          await testDapp.createDepositTransaction();
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          const transactionConfirmation = new TransactionConfirmation(driver);
          await transactionConfirmation.checkPageIsLoaded();
          await transactionConfirmation.clickFooterButton({
            button: 'confirm',
          });
        },
      );
    });

    it(`Sends a contract interaction type 0 transaction (Legacy) with a Trezor account`, async function () {
      await withFixtures(
        {
          dappOptions: { numberOfTestDapps: 1 },
          fixtures: new FixtureBuilderV2()
            .withTrezorAccount()
            .withPermissionControllerConnectedToTestDapp({
              account: KNOWN_PUBLIC_KEY_ADDRESSES[0].address,
            })
            .build(),
          localNodeOptions: {
            hardfork: 'muirGlacier',
          },
          smartContract,
          title: this.test?.fullTitle(),
        },
        async ({
          driver,
          contractRegistry,
          localNodes,
        }: TestSuiteArguments) => {
          // Seed the Trezor account with balance
          (await localNodes?.[0]?.setAccountBalance(
            KNOWN_PUBLIC_KEY_ADDRESSES[0].address,
            '0x100000000000000000000',
          )) ?? console.error('localNodes is undefined or empty');

          const contractAddress =
            await contractRegistry?.getContractAddress(smartContract);

          await login(driver, {
            expectedBalance: '1.21M',
            waitForNonEvmAccounts: false,
          });
          const testDapp = new TestDapp(driver);
          await testDapp.openTestDappPage({ contractAddress });
          await testDapp.checkPageIsLoaded();
          await testDapp.createDepositTransaction();
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          const transactionConfirmation = new TransactionConfirmation(driver);
          await transactionConfirmation.checkPageIsLoaded();
          await transactionConfirmation.clickFooterButton({
            button: 'confirm',
          });

          // Assert transaction is completed
          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );
          const homePage = new HomePage(driver);
          await homePage.goToActivityList();
          const activityTab = new ActivityTab(driver);
          await activityTab.checkConfirmedTxNumberDisplayedInActivity(1);
          await activityTab.checkTxAction({
            action: 'Contract interaction',
          });
        },
      );
    });

    it(`Opens a contract interaction type 2 transaction that includes layer 1 fees breakdown on a layer 2`, async function () {
      await withFixtures(
        {
          dappOptions: { numberOfTestDapps: 1 },
          fixtures: new FixtureBuilderV2()
            .withEnabledNetworks({ eip155: { [CHAIN_IDS.OPTIMISM]: true } })
            .withPermissionControllerConnectedToTestDapp()
            .withPreferencesController({
              useTransactionSimulations: false,
            })
            .withSelectedNetwork(NETWORK_CLIENT_ID.OPTIMISM_MAINNET)
            .build(),
          localNodeOptions: {
            chainId: hexToNumber(CHAIN_IDS.OPTIMISM),
          },
          smartContract,
          title: this.test?.fullTitle(),
          testSpecificMock: mockOptimismOracle,
        },
        async ({
          driver,
          contractRegistry,
          localNodes,
        }: TestSuiteArguments) => {
          await login(driver, { localNode: localNodes?.[0] });
          await createLayer2Transaction(driver);

          const contractAddress = await (
            contractRegistry as ContractAddressRegistry
          ).getContractAddress(smartContract);

          const testDapp = new TestDapp(driver);
          await testDapp.openTestDappPage({ contractAddress });

          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

          await toggleAdvancedDetails(driver);

          await assertAdvancedGasDetailsWithFewerFields(driver);
        },
      );
    });
  });

  describe('Custom nonce editing', function () {
    it('Sends a contract interaction type 2 transaction without custom nonce editing (EIP1559)', async function () {
      await withFixtures(
        {
          dappOptions: { numberOfTestDapps: 1 },
          fixtures: new FixtureBuilderV2()
            .withPermissionControllerConnectedToTestDapp()
            .build(),
          smartContract,
          title: this.test?.fullTitle(),
        },
        async ({
          driver,
          contractRegistry,
          localNodes,
        }: TestSuiteArguments) => {
          const contractAddress =
            await contractRegistry?.getContractAddress(smartContract);
          await login(driver, { localNode: localNodes?.[0] });
          const testDapp = new TestDapp(driver);
          await testDapp.openTestDappPage({ contractAddress });
          await testDapp.checkPageIsLoaded();
          await testDapp.createDepositTransaction();
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          const transactionConfirmation = new TransactionConfirmation(driver);
          await transactionConfirmation.checkPageIsLoaded();
          await transactionConfirmation.clickFooterButton({
            button: 'confirm',
          });
        },
      );
    });

    it('Sends a contract interaction type 2 transaction with custom nonce editing (EIP1559)', async function () {
      await withFixtures(
        {
          dappOptions: { numberOfTestDapps: 1 },
          fixtures: new FixtureBuilderV2()
            .withPermissionControllerConnectedToTestDapp()
            .build(),
          smartContract,
          title: this.test?.fullTitle(),
        },
        async ({
          driver,
          contractRegistry,
          localNodes,
        }: TestSuiteArguments) => {
          const contractAddress =
            await contractRegistry?.getContractAddress(smartContract);
          await login(driver, { localNode: localNodes?.[0] });
          const testDapp = new TestDapp(driver);
          await testDapp.openTestDappPage({ contractAddress });
          await testDapp.checkPageIsLoaded();
          await testDapp.createDepositTransaction();
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          const transactionConfirmation = new TransactionConfirmation(driver);
          await transactionConfirmation.checkPageIsLoaded();
          await transactionConfirmation.clickAdvancedDetailsButton();
          await transactionConfirmation.setCustomNonce('10');
          await transactionConfirmation.clickFooterButton({
            button: 'confirm',
          });
        },
      );
    });
  });

  describe('Advanced Gas Details', function () {
    it('Sends a contract interaction type 2 transaction (EIP1559) and checks the advanced gas details', async function () {
      await withFixtures(
        {
          dappOptions: { numberOfTestDapps: 1 },
          fixtures: new FixtureBuilderV2()
            .withPermissionControllerConnectedToTestDapp()
            .build(),
          smartContract,
          title: this.test?.fullTitle(),
        },
        async ({
          driver,
          contractRegistry,
          localNodes,
        }: TestSuiteArguments) => {
          const contractAddress =
            await contractRegistry?.getContractAddress(smartContract);
          await login(driver, { localNode: localNodes?.[0] });
          const testDapp = new TestDapp(driver);
          await testDapp.openTestDappPage({ contractAddress });
          await testDapp.checkPageIsLoaded();
          await testDapp.createDepositTransaction();
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          const transactionConfirmation = new TransactionConfirmation(driver);
          await transactionConfirmation.checkPageIsLoaded();
          await transactionConfirmation.clickAdvancedDetailsButton();
          await assertAdvancedGasDetails(driver);
        },
      );
    });

    it('If hex data is enabled, advanced details are shown', async function () {
      await withFixtures(
        {
          dappOptions: { numberOfTestDapps: 1 },
          fixtures: new FixtureBuilderV2()
            .withPermissionControllerConnectedToTestDapp()
            .build(),
          smartContract,
          title: this.test?.fullTitle(),
        },
        async ({
          driver,
          contractRegistry,
          localNodes,
        }: TestSuiteArguments) => {
          const contractAddress =
            await contractRegistry?.getContractAddress(smartContract);

          await login(driver, { localNode: localNodes?.[0] });
          const homePage = new HomePage(driver);
          await homePage.headerNavbar.openSettingsPage();
          const settingsPage = new SettingsPage(driver);
          await settingsPage.checkPageIsLoaded();
          await settingsPage.goToTransactionsSettings();
          const transactionsSettingsPage = new TransactionsSettingsPage(driver);
          await transactionsSettingsPage.checkPageIsLoaded();
          await transactionsSettingsPage.toggleOnHexData();

          const testDapp = new TestDapp(driver);
          await testDapp.openTestDappPage({ contractAddress });
          await testDapp.checkPageIsLoaded();

          await testDapp.createDepositTransaction();
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          const transactionConfirmation = new TransactionConfirmation(driver);
          await transactionConfirmation.checkPageIsLoaded();
          await transactionConfirmation.clickAdvancedDetailsButton();

          await assertAdvancedGasDetails(driver);
        },
      );
    });
  });
});

async function createLayer2Transaction(driver: Driver) {
  await createDappTransaction(driver, {
    data: '0x1234',
    to: '0x581c3C1A2A4EBDE2A0Df29B5cf4c116E42945947',
  });
}

async function mockOptimismOracle(
  mockServer: Mockttp,
): Promise<MockedEndpoint[]> {
  return [
    await mockServer
      .forPost(/infura/u)
      .withJsonBodyIncluding({
        method: 'eth_call',
        params: [{ to: '0x420000000000000000000000000000000000000f' }],
      })
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: {
            jsonrpc: '2.0',
            id: '1111111111111111',
            result:
              '0x0000000000000000000000000000000000000000000000000000000c895f9d79',
          },
        };
      }),
  ];
}
