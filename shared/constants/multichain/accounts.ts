import { BtcAccountType, SolAccountType } from '@metamask/keyring-api';
import { BITCOIN_WALLET_SNAP_ID } from '../../lib/accounts/bitcoin-wallet-snap';
import { SOLANA_WALLET_SNAP_ID } from '../../lib/accounts/solana-wallet-snap';

export const MULTICHAIN_ACCOUNT_TYPE_TO_SNAP_ID = {
  ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
  [BtcAccountType.P2wpkh]: BITCOIN_WALLET_SNAP_ID,
  ///: END:ONLY_INCLUDE_IF
  ///: BEGIN:ONLY_INCLUDE_IF(solana)
  [SolAccountType.DataAccount]: SOLANA_WALLET_SNAP_ID,
  ///: END:ONLY_INCLUDE_IF
};
