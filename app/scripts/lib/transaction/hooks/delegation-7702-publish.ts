import { TransactionMeta } from '@metamask/transaction-controller';
import { TransactionControllerInitMessenger } from '../../../controller-init/messengers/transaction-controller-messenger';
import { Hex, createProjectLogger } from '@metamask/utils';
import { Delegation } from '@metamask/signature-controller';
import { data } from 'browserslist';

const CHAIN_ID = '0x7a69';
const DELEGATION_MANAGER_ADDRESS = '0x663F3ad617193148711d28f5334eE4Ed07016602';
const RELAY_ACCOUNT = '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC' as Hex;
const RELAY_URL = 'http://localhost:3000/';
const SALT = 123;

const ROOT_AUTHORITY =
  '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';

const log = createProjectLogger('delegation-7702-publish');

export async function delegation7702PublishHook(
  request: { messenger: TransactionControllerInitMessenger },
  transactionMeta: TransactionMeta,
  _signedTx: string,
) {
  const { messenger } = request;
  const { networkClientId, txParams } = transactionMeta;
  const from = txParams.from as Hex;

  const delegation: Delegation = {
    authority: ROOT_AUTHORITY,
    caveats: [],
    delegate: RELAY_ACCOUNT,
    delegator: from,
    salt: SALT,
  };

  log('Sign delegation', delegation);

  const delegationSignature = await messenger.call(
    'SignatureController:signDelegation',
    {
      chainId: CHAIN_ID,
      delegation,
      delegationManagerAddress: DELEGATION_MANAGER_ADDRESS,
      from,
      networkClientId,
      requireApproval: false,
    },
  );

  log('Delegation signature', delegationSignature);

  const transactionParams = {
    to: txParams.to,
    data: txParams.data,
    value: txParams.value,
  };

  const relayRequest = {
    delegation: { ...delegation, signature: delegationSignature },
    transactionParams,
  };

  log('Relay request', relayRequest);

  const response = await fetch(RELAY_URL, {
    method: 'POST',
    body: JSON.stringify(relayRequest),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const responseJson = await response.json();
  const { transactionHash } = responseJson;

  log('Transaction hash', transactionHash);

  return transactionHash;
}
