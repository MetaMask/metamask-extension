import { Json } from '@metamask/utils';
import { MessageParams } from '@metamask/message-manager';
import getFetchWithTimeout from '../../../shared/modules/fetch-with-timeout';
import { MESSAGE_TYPE } from '../../../shared/constants/app';

const fetchWithTimeout = getFetchWithTimeout();

export type TransactionRequestData = {
  txParams: Record<string, unknown>;
  messageParams?: never;
  msgParams?: never;
};

export type MessageRequestData =
  | {
      msgParams: MessageParams;
      txParams?: never;
      messageParams?: never;
    }
  | {
      messageParams: MessageParams;
      msgParams?: never;
      txParams?: never;
    }
  | TransactionRequestData;

export type RequestData = {
  origin: string;
} & MessageRequestData;

export async function securityProviderCheck(
  requestData: RequestData,
  methodName: string,
  chainId: string,
  currentLocale: string,
): Promise<Record<string, Json>> {
  let dataToValidate;
  // Core message managers use messageParams but frontend uses msgParams with lots of references
  const params = requestData.msgParams || requestData.messageParams;

  if (methodName === MESSAGE_TYPE.ETH_SIGN_TYPED_DATA) {
    dataToValidate = {
      host_name: params?.origin,
      rpc_method_name: methodName,
      chain_id: chainId,
      data: params?.data,
      currentLocale,
    };
  } else if (
    methodName === MESSAGE_TYPE.ETH_SIGN ||
    methodName === MESSAGE_TYPE.PERSONAL_SIGN
  ) {
    dataToValidate = {
      host_name: params?.origin,
      rpc_method_name: methodName,
      chain_id: chainId,
      data: {
        signer_address: params?.from,
        msg_to_sign: params?.data,
      },
      currentLocale,
    };
  } else {
    dataToValidate = {
      host_name: requestData.origin,
      rpc_method_name: methodName,
      chain_id: chainId,
      data: {
        from_address: requestData.txParams?.from,
        to_address: requestData.txParams?.to,
        gas: requestData.txParams?.gas,
        gasPrice: requestData.txParams?.gasPrice,
        value: requestData.txParams?.value,
        data: requestData.txParams?.data,
      },
      currentLocale,
    };
  }

  const response: Response = await fetchWithTimeout(
    'https://proxy.metafi.codefi.network/opensea/security/v1/validate',
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataToValidate),
    },
  );
  return await response.json();
}
