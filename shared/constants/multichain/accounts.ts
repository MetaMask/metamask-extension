import { BtcAccountType, SolAccountType } from '@metamask/keyring-api';
import { BITCOIN_WALLET_SNAP_ID } from '../../lib/accounts/bitcoin-wallet-snap';
import { SOLANA_WALLET_SNAP_ID } from '../../lib/accounts/solana-wallet-snap';

export const MULTICHAIN_ACCOUNT_TYPE_TO_SNAP_ID = {
  ///: BEGIN:ONLY_INCLUDE_IF(bitcoin)
  [BtcAccountType.P2pkh]: BITCOIN_WALLET_SNAP_ID,
  [BtcAccountType.P2sh]: BITCOIN_WALLET_SNAP_ID,
  [BtcAccountType.P2wpkh]: BITCOIN_WALLET_SNAP_ID,
  [BtcAccountType.P2tr]: BITCOIN_WALLET_SNAP_ID,
  ///: END:ONLY_INCLUDE_IF
  [SolAccountType.DataAccount]: SOLANA_WALLET_SNAP_ID,
};

export const MULTICHAIN_ACCOUNT_TYPE_TO_NAME = {
  ///: BEGIN:ONLY_INCLUDE_IF(bitcoin)
  [BtcAccountType.P2pkh]: 'Legacy',
  [BtcAccountType.P2sh]: 'SegWit',
  [BtcAccountType.P2wpkh]: 'Native SegWit',
  [BtcAccountType.P2tr]: 'Taproot',
  ///: END:ONLY_INCLUDE_IF
};
