"use strict";
// Below constants are intentionally copied from transaction-controller to avoid package dependency
Object.defineProperty(exports, "__esModule", { value: true });
exports.ETHERSCAN_SUPPORTED_NETWORKS = exports.CHAIN_IDS = void 0;
exports.CHAIN_IDS = {
    MAINNET: '0x1',
    GOERLI: '0x5',
    BSC: '0x38',
    BSC_TESTNET: '0x61',
    OPTIMISM: '0xa',
    OPTIMISM_TESTNET: '0x1a4',
    POLYGON: '0x89',
    POLYGON_TESTNET: '0x13881',
    AVALANCHE: '0xa86a',
    AVALANCHE_TESTNET: '0xa869',
    FANTOM: '0xfa',
    FANTOM_TESTNET: '0xfa2',
    SEPOLIA: '0xaa36a7',
    LINEA_GOERLI: '0xe704',
    LINEA_MAINNET: '0xe708',
    MOONBEAM: '0x504',
    MOONBEAM_TESTNET: '0x507',
    MOONRIVER: '0x505',
    GNOSIS: '0x64',
};
const DEFAULT_ETHERSCAN_DOMAIN = 'etherscan.io';
const DEFAULT_ETHERSCAN_SUBDOMAIN_PREFIX = 'api';
exports.ETHERSCAN_SUPPORTED_NETWORKS = {
    [exports.CHAIN_IDS.GOERLI]: {
        domain: DEFAULT_ETHERSCAN_DOMAIN,
        subdomain: `${DEFAULT_ETHERSCAN_SUBDOMAIN_PREFIX}-goerli`,
    },
    [exports.CHAIN_IDS.MAINNET]: {
        domain: DEFAULT_ETHERSCAN_DOMAIN,
        subdomain: DEFAULT_ETHERSCAN_SUBDOMAIN_PREFIX,
    },
    [exports.CHAIN_IDS.SEPOLIA]: {
        domain: DEFAULT_ETHERSCAN_DOMAIN,
        subdomain: `${DEFAULT_ETHERSCAN_SUBDOMAIN_PREFIX}-sepolia`,
    },
    [exports.CHAIN_IDS.LINEA_GOERLI]: {
        domain: 'lineascan.build',
        subdomain: 'goerli',
    },
    [exports.CHAIN_IDS.LINEA_MAINNET]: {
        domain: 'lineascan.build',
        subdomain: DEFAULT_ETHERSCAN_SUBDOMAIN_PREFIX,
    },
    [exports.CHAIN_IDS.BSC]: {
        domain: 'bscscan.com',
        subdomain: DEFAULT_ETHERSCAN_SUBDOMAIN_PREFIX,
    },
    [exports.CHAIN_IDS.BSC_TESTNET]: {
        domain: 'bscscan.com',
        subdomain: `${DEFAULT_ETHERSCAN_SUBDOMAIN_PREFIX}-testnet`,
    },
    [exports.CHAIN_IDS.OPTIMISM]: {
        domain: DEFAULT_ETHERSCAN_DOMAIN,
        subdomain: `${DEFAULT_ETHERSCAN_SUBDOMAIN_PREFIX}-optimistic`,
    },
    [exports.CHAIN_IDS.OPTIMISM_TESTNET]: {
        domain: DEFAULT_ETHERSCAN_DOMAIN,
        subdomain: `${DEFAULT_ETHERSCAN_SUBDOMAIN_PREFIX}-goerli-optimistic`,
    },
    [exports.CHAIN_IDS.POLYGON]: {
        domain: 'polygonscan.com',
        subdomain: DEFAULT_ETHERSCAN_SUBDOMAIN_PREFIX,
    },
    [exports.CHAIN_IDS.POLYGON_TESTNET]: {
        domain: 'polygonscan.com',
        subdomain: `${DEFAULT_ETHERSCAN_SUBDOMAIN_PREFIX}-mumbai`,
    },
    [exports.CHAIN_IDS.AVALANCHE]: {
        domain: 'snowtrace.io',
        subdomain: DEFAULT_ETHERSCAN_SUBDOMAIN_PREFIX,
    },
    [exports.CHAIN_IDS.AVALANCHE_TESTNET]: {
        domain: 'snowtrace.io',
        subdomain: `${DEFAULT_ETHERSCAN_SUBDOMAIN_PREFIX}-testnet`,
    },
    [exports.CHAIN_IDS.FANTOM]: {
        domain: 'ftmscan.com',
        subdomain: DEFAULT_ETHERSCAN_SUBDOMAIN_PREFIX,
    },
    [exports.CHAIN_IDS.FANTOM_TESTNET]: {
        domain: 'ftmscan.com',
        subdomain: `${DEFAULT_ETHERSCAN_SUBDOMAIN_PREFIX}-testnet`,
    },
    [exports.CHAIN_IDS.MOONBEAM]: {
        domain: 'moonscan.io',
        subdomain: `${DEFAULT_ETHERSCAN_SUBDOMAIN_PREFIX}-moonbeam`,
    },
    [exports.CHAIN_IDS.MOONBEAM_TESTNET]: {
        domain: 'moonscan.io',
        subdomain: `${DEFAULT_ETHERSCAN_SUBDOMAIN_PREFIX}-moonbase`,
    },
    [exports.CHAIN_IDS.MOONRIVER]: {
        domain: 'moonscan.io',
        subdomain: `${DEFAULT_ETHERSCAN_SUBDOMAIN_PREFIX}-moonriver`,
    },
    [exports.CHAIN_IDS.GNOSIS]: {
        domain: 'gnosisscan.io',
        subdomain: `${DEFAULT_ETHERSCAN_SUBDOMAIN_PREFIX}-gnosis`,
    },
};
//# sourceMappingURL=constants.js.map