import { MESSAGE_TYPE } from '../../../shared/constants/app';

export async function securityProviderCheck(
  requestData,
  methodName,
  chainId,
  currentLocale,
) {
  let dataToValidate;

  if (methodName === MESSAGE_TYPE.ETH_SIGN_TYPED_DATA) {
    dataToValidate = {
      host_name: requestData.msgParams.origin,
      rpc_method_name: methodName,
      chain_id: chainId,
      data: requestData.msgParams.data,
      currentLocale,
    };
  } else if (
    methodName === MESSAGE_TYPE.ETH_SIGN ||
    methodName === MESSAGE_TYPE.PERSONAL_SIGN
  ) {
    dataToValidate = {
      host_name: requestData.msgParams.origin,
      rpc_method_name: methodName,
      chain_id: chainId,
      data: {
        signer_address: requestData.msgParams.from,
        msg_to_sign: requestData.msgParams.data,
      },
      currentLocale,
    };
  } else {
    dataToValidate = {
      host_name: requestData.origin,
      rpc_method_name: methodName,
      chain_id: chainId,
      data: {
        from_address: requestData.txParams.from,
        to_address: requestData.txParams.to,
        gas: requestData.txParams.gas,
        gasPrice: requestData.txParams.gasPrice,
        value: requestData.txParams.value,
        data: requestData.txParams.data,
      },
      currentLocale,
    };
  }

  const response = await fetch(
    'https://eos9d7dmfj.execute-api.us-east-1.amazonaws.com/metamask/validate',
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-API-KEY': 'NKYIN6cXkFaNnVIfzNx7s1z0p3b0B4SB6k29qA7n',
      },
      body: JSON.stringify(dataToValidate),
    },
  );

  return await response.json();
}
