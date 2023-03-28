import getFetchWithTimeout from '../../../shared/modules/fetch-with-timeout';
import { MESSAGE_TYPE } from '../../../shared/constants/app';

const fetchWithTimeout = getFetchWithTimeout();

export async function securityProviderCheck(
  requestData,
  methodName,
  chainId,
  currentLocale,
) {
  let dataToValidate;

  if (methodName === MESSAGE_TYPE.ETH_SIGN_TYPED_DATA) {
    dataToValidate = {
      host_name: requestData.messageParams.origin,
      rpc_method_name: methodName,
      chain_id: chainId,
      data: requestData.messageParams.data,
      currentLocale,
    };
  } else if (
    methodName === MESSAGE_TYPE.ETH_SIGN ||
    methodName === MESSAGE_TYPE.PERSONAL_SIGN
  ) {
    dataToValidate = {
      host_name: requestData.messageParams.origin,
      rpc_method_name: methodName,
      chain_id: chainId,
      data: {
        signer_address: requestData.messageParams.from,
        msg_to_sign: requestData.messageParams.data,
      },
      currentLocale,
    };
  } else {
    dataToValidate = {
      host_name: requestData.origin,
      rpc_method_name: methodName,
      chain_id: chainId,
      data: {
        from_address: requestData?.txParams?.from,
        to_address: requestData?.txParams?.to,
        gas: requestData?.txParams?.gas,
        gasPrice: requestData?.txParams?.gasPrice,
        value: requestData?.txParams?.value,
        data: requestData?.txParams?.data,
      },
      currentLocale,
    };
  }

  const response = await fetchWithTimeout(
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
