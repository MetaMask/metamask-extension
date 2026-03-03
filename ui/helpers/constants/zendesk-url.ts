const ZENDESK_URLS = {
  ACCOUNT_UPGRADE:
    'https://support.metamask.io/configure/accounts/what-is-a-smart-account/#what-are-metamask-smart-accounts',
  ADD_CUSTOM_TOKENS:
    'https://support.metamask.io/managing-my-tokens/custom-tokens/how-to-display-tokens-in-metamask/',
  ADD_SOLANA_ACCOUNTS:
    'https://support.metamask.io/configure/accounts/how-to-add-accounts-in-your-wallet/#solana-accounts',
  ADD_MISSING_ACCOUNTS:
    'https://support.metamask.io/managing-my-wallet/accounts-and-addresses/how-to-add-missing-accounts-after-restoring-with-secret-recovery-phrase/',
  BASIC_SAFETY:
    'https://support.metamask.io/privacy-and-security/basic-safety-and-security-tips-for-metamask/',
  CUSTOMIZE_NONCE:
    'https://support.metamask.io/transactions-and-gas/transactions/how-to-customize-a-transaction-nonce/',
  GAS_FEES: 'https://support.metamask.io/transactions-and-gas/gas-fees/',
  SWAPS_GAS_FEES:
    'https://support.metamask.io/token-swaps/user-guide-swaps/#gas-fees',
  HARDWARE_CONNECTION:
    'https://support.metamask.io/privacy-and-security/hardware-wallet-hub/',
  HARDWARE_CONNECTION_TREZOR_LEDGER:
    'https://support.metamask.io/more-web3/wallets/how-to-connect-a-trezor-or-ledger-hardware-wallet/',
  IMPORT_ACCOUNTS: 'https://support.metamask.io/start/use-an-existing-wallet/',
  IMPORT_ACCOUNT_MOBILE:
    'https://support.metamask.io/start/use-an-existing-wallet?client=mobile',
  IMPORTED_ACCOUNTS:
    'https://support.metamask.io/managing-my-wallet/accounts-and-addresses/what-are-imported-accounts-/',
  IMPORTED_ACCOUNT_JSON:
    'https://support.metamask.io/start/how-to-import-an-account/#how-can-i-import-my-private-key-using-a-json-file',
  IMPORTED_ACCOUNTS_PRIVATE_KEY:
    'https://support.metamask.io/start/use-an-existing-wallet/#import-using-a-private-key',
  INFURA_BLOCKAGE:
    'https://support.metamask.io/troubleshooting/why-infura-cannot-serve-certain-areas/',
  LEDGER_FIREFOX_U2F_GUIDE:
    'https://support.ledger.com/hc/en-us/articles/10371387758493-MetaMask-Firefox-Ledger-Integration-Issue?support=true',
  LEGACY_WEB3:
    'https://support.metamask.io/third-party-platforms-and-dapps/metamask-legacy-web3/',
  PASSWORD_ARTICLE:
    'https://support.metamask.io/configure/wallet/passwords-and-metamask/',
  PASSWORD_AND_SRP_ARTICLE:
    'https://support.metamask.io/getting-started/user-guide-secret-recovery-phrase-password-and-private-keys/',
  PRIVATE_KEY_GUIDE:
    'https://support.metamask.io/start/user-guide-secret-recovery-phrase-password-and-private-keys/#private-keys',
  PASSWORD_RESET:
    'https://support.metamask.io/configure/wallet/how-can-i-reset-my-password/',
  RESET_ADD_MISSING_ACCOUNT:
    'https://support.metamask.io/configure/accounts/how-to-add-missing-accounts-after-restoring-with-secret-recovery-phrase/',
  RESET_DISPLAY_TOKENS:
    'https://support.metamask.io/manage-crypto/tokens/how-to-display-tokens-in-metamask/',
  RESET_IMPORT_AN_ACCOUNT:
    'https://support.metamask.io/start/how-to-import-an-account/',
  SECRET_RECOVERY_PHRASE:
    'https://support.metamask.io/privacy-and-security/what-is-a-secret-recovery-phrase-and-how-to-keep-your-crypto-wallet-secure/',
  NON_CUSTODIAL_WALLET:
    'https://support.metamask.io/getting-started/metamask-is-a-self-custodial-wallet/',
  SPEEDUP_CANCEL:
    'https://support.metamask.io/transactions-and-gas/transactions/how-to-speed-up-or-cancel-a-pending-transaction/',
  SUPPORT_URL: 'https://support.metamask.io',
  TOKEN_ALLOWANCE_WITH_SPENDING_CAP:
    'https://support.metamask.io/privacy-and-security/how-to-customize-token-approvals-with-a-spending-cap/',
  TOKEN_SAFETY_PRACTICES:
    'https://support.metamask.io/managing-my-tokens/token-safety-practices/',
  UNKNOWN_NETWORK:
    'https://support.metamask.io/networks-and-sidechains/managing-networks/the-risks-of-connecting-to-an-unknown-network/',
  USER_GUIDE_CUSTOM_NETWORKS:
    'https://support.metamask.io/networks-and-sidechains/managing-networks/user-guide-custom-networks-and-sidechains/',
  USER_GUIDE_DAPPS:
    'https://support.metamask.io/third-party-platforms-and-dapps/user-guide-dapps/',
  USER_GUIDE_GAS:
    'https://support.metamask.io/transactions-and-gas/gas-fees/user-guide-gas/',
  VERIFY_CUSTOM_NETWORK:
    'https://support.metamask.io/networks-and-sidechains/managing-networks/verifying-custom-network-information/',
  NETWORK_DEPRECATED:
    'https://support.metamask.io/networks-and-sidechains/eth-on-testnets/',
  SOLANA_ACCOUNTS:
    'https://support.metamask.io/configure/accounts/how-to-add-accounts-in-your-wallet/#solana-accounts',
  METAMETRICS_SETTINGS:
    'https://support.metamask.io/privacy-and-security/how-to-manage-your-metametrics-settings',
  SECURITY_ALERTS:
    'https://support.metamask.io/privacy-and-security/how-to-turn-on-security-alerts/',
  TRANSACTION_SIMULATIONS:
    'https://support.metamask.io/transactions-and-gas/transactions/simulations/',
  VAULT_RECOVERY:
    'https://support.metamask.io/configure/wallet/how-to-recover-your-secret-recovery-phrase/#step-two-locate-your-vault',
  PROFILE_PRIVACY:
    'https://support.metamask.io/privacy-and-security/profile-privacy',
  CONTRACT_ADDRESS_WARNING:
    'https://support.metamask.io/managing-my-tokens/moving-your-tokens/why-am-i-being-warned-about-sending-tokens-to-a-contract/',
  TRANSACTION_SHIELD:
    'https://support.metamask.io/manage-crypto/transactions/transaction-shield',
  FIND_TRANSACTION_HASH:
    'https://support.metamask.io/manage-crypto/transactions/how-to-find-a-transaction-id',
  SMART_TRANSACTIONS:
    'https://support.metamask.io/transactions-and-gas/transactions/smart-transactions/',
  SMART_ACCOUNT_DETAILS:
    'https://support.metamask.io/configure/accounts/what-is-a-smart-account/#what-are-metamask-smart-accounts',
  MULTICHAIN_ACCOUNTS:
    'https://support.metamask.io/configure/accounts/multichain-accounts/',
  CONNECTING_TO_DAPP:
    'https://support.metamask.io/more-web3/dapps/connecting-to-a-dapp/',
  ADD_ACCOUNTS:
    'https://support.metamask.io/managing-my-wallet/accounts-and-addresses/how-to-add-accounts-in-your-wallet/',
  REMOVE_ACCOUNT:
    'https://support.metamask.io/managing-my-wallet/accounts-and-addresses/how-to-remove-an-account-from-your-metamask-wallet/',
  PRIVACY_BEST_PRACTICES:
    'https://support.metamask.io/privacy-and-security/privacy-best-practices',
  BASIC_SAFETY_TIPS:
    'https://support.metamask.io/stay-safe/safety-in-web3/basic-safety-and-security-tips-for-metamask/',
  METAMASK_REWARDS:
    'https://support.metamask.io/manage-crypto/metamask-rewards',
  DECEPTIVE_SITE:
    'https://support.metamask.io/troubleshooting/deceptive-site-ahead-when-trying-to-connect-to-a-site/',
  SWAPS_USER_GUIDE: 'https://support.metamask.io/token-swaps/user-guide-swaps/',
  UPDATE_VERSION:
    'https://support.metamask.io/configure/wallet/how-to-update-the-version-of-metamask/' as const,
} as const;

export type ZendeskUrl = (typeof ZENDESK_URLS)[keyof typeof ZENDESK_URLS];

export default ZENDESK_URLS;
