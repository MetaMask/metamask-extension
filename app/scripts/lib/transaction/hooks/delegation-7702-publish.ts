import { GasFeeToken, TransactionMeta } from '@metamask/transaction-controller';
import { TransactionControllerInitMessenger } from '../../../controller-init/messengers/transaction-controller-messenger';
import {
  Hex,
  add0x,
  createProjectLogger,
  hexToNumber,
  numberToHex,
  remove0x,
} from '@metamask/utils';
import { Delegation } from '@metamask/signature-controller';

const RELAY_URL = 'http://localhost:3000/';

// Anvil
// const DELEGATION_MANAGER_ADDRESS = '0x663F3ad617193148711d28f5334eE4Ed07016602';
// const SMART_CONTRACT_ADDRESS = '0x8438Ad1C834623CfF278AB6829a248E37C2D7E3f';
// const ENFORCER_ADDRESS = '0xBC9129Dc0487fc2E169941C75aABC539f208fb01';
// const RELAY_ACCOUNT = '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC' as Hex;

// Sepolia
const DELEGATION_MANAGER_ADDRESS = '0x739309deED0Ae184E66a427ACa432aE1D91d022e';
const SMART_CONTRACT_ADDRESS = '0xCd8D6C5554e209Fbb0deC797C6293cf7eAE13454';
const ENFORCER_ADDRESS = '0x87E1166Cdd0d7c6eb25C6750574Fe932cc38bF38';
const RELAY_ACCOUNT = '0xBAB951a55b61dfAe21Ff7C3501142B397367F026' as Hex;

const ROOT_AUTHORITY =
  '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';

const log = createProjectLogger('delegation-7702-publish');

export async function delegation7702PublishHook(
  request: { messenger: TransactionControllerInitMessenger },
  transactionMeta: TransactionMeta,
  _signedTx: string,
) {
  const { messenger } = request;

  const { gasFeeTokens, networkClientId, selectedGasFeeToken, txParams } =
    transactionMeta;

  const from = txParams.from as Hex;
  const nonce = txParams.nonce as Hex;
  const { chainId } = transactionMeta;

  if (!selectedGasFeeToken) {
    return { transactionHash: undefined };
  }

  const gasFeeToken = gasFeeTokens?.find(
    (token) => token.contractAddress === selectedGasFeeToken,
  ) as GasFeeToken;

  const { provider } = await messenger.call(
    'NetworkController:getNetworkClientById',
    networkClientId,
  );

  const code = (await provider.request({
    method: 'eth_getCode',
    params: [from],
  })) as Hex;

  const isUpgraded = code?.length > 3;
  let authorization = undefined;

  if (!isUpgraded) {
    authorization = await messenger.call(
      'KeyringController:signEip7702Authorization',
      {
        chainId: hexToNumber(chainId),
        contractAddress: SMART_CONTRACT_ADDRESS,
        from,
        nonce: hexToNumber(nonce),
      },
    );

    log('Authorization signature', authorization);
  }

  const tokenAmountPadded = add0x(
    remove0x(gasFeeToken?.amount).padStart(64, '0'),
  );

  const enforcerTerms = add0x(
    (
      [
        gasFeeToken.contractAddress,
        RELAY_ACCOUNT,
        tokenAmountPadded,
        txParams.to,
        txParams.data ?? '0x',
      ] as Hex[]
    )
      .map(remove0x)
      .join(''),
  );

  const delegation: Delegation = {
    authority: ROOT_AUTHORITY,
    caveats: [
      {
        enforcer: ENFORCER_ADDRESS,
        terms: enforcerTerms,
        args: '0x',
      },
    ],
    delegate: RELAY_ACCOUNT,
    delegator: from,
    salt: new Date().getTime(),
  };

  log('Sign delegation', delegation);

  const delegationSignature = await messenger.call(
    'SignatureController:signDelegation',
    {
      chainId,
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
    authorization,
    delegation: { ...delegation, signature: delegationSignature },
    nonce,
    token: gasFeeToken,
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

  return { transactionHash };
}
