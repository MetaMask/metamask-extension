// import fetch from 'node-fetch';
// import { MESSAGE_TYPE } from '../../../shared/constants/app';

export async function securityProviderCheck(requestData, methodName, chainId) {
  console.log('requestData: ', requestData);
  console.log('methodName: ', methodName);
  console.log('chainId: ', chainId);
  // transaction
  // const dataToValidate = [
  //     {
  //     "host_name": requestData.origin,
  //     "rpc_method_name": methodName,
  //     "chain_id": requestData.chainId,
  //     "data": {
  //       "from_address": requestData.txParams.from,
  //       "to_address": requestData.txParams.to,
  //       "gas": requestData.defaultGasEstimates.gas,
  //       "gasPrice": requestData.defaultGasEstimates.gasPrice,
  //       "value": requestData.txParams.value,
  //       "data": requestData.txParams.data,
  //     }
  //   }
  // ]

  // eth_sign, personal_sign
  // const dataToValidate = [
  //     {
  //     "host_name": requestData.msgParams.origin,
  //     "rpc_method_name": methodName,
  //     "chain_id": chainId,
  //     "data": {
  //       "signer_address": requestData.msgParams.from,
  //       "msg_to_sign": requestData.msgParams.data,
  //     }
  //   }
  // ]

  // eth_signTypedData
  // const dataToValidate = [
  //     {
  //     "host_name": requestData.msgParams.origin,
  //     "rpc_method_name": methodName,
  //     "chain_id": chainId,
  //     "data": {
  //        requestData.msgParams.data
  //     }
  //   }
  // ]

  // let dataToValidate = [];

  // if (methodName === MESSAGE_TYPE.ETH_SIGN_TYPED_DATA) {
  //   dataToValidate = [
  //     {
  //       "host_name": requestData.msgParams.origin,
  //       "rpc_method_name": methodName,
  //       "chain_id": chainId,
  //       "data": requestData.msgParams.data,
  //     }
  //   ]
  // } else if (methodName === MESSAGE_TYPE.ETH_SIGN || methodName === MESSAGE_TYPE.PERSONAL_SIGN) {
  //   dataToValidate = [
  //         {
  //         "host_name": requestData.msgParams.origin,
  //         "rpc_method_name": methodName,
  //         "chain_id": chainId,
  //         "data": {
  //           "signer_address": requestData.msgParams.from,
  //           "msg_to_sign": requestData.msgParams.data,
  //         }
  //       }
  //     ]
  // }

  // dataToValidate = [
  //     {
  //       "host_name": requestData.origin,
  //       "rpc_method_name": methodName,
  //       "chain_id": requestData.chainId,
  //       "data": {
  //         "from_address": requestData.txParams.from,
  //         "to_address": requestData.txParams.to,
  //         "gas": requestData.defaultGasEstimates.gas,
  //         "gasPrice": requestData.defaultGasEstimates.gasPrice,    // ?
  //         "value": requestData.txParams.value,
  //         "data": requestData.txParams.data,
  //       }
  //     }
  // ]

  // const queryString = new URLSearchParams(dataToValidate[0]).toString();
  // console.log('queryString: ', queryString);

  const response = await fetch('http://localhost:3000/security/2', {
    // const response = await fetch('https://eos9d7dmfj.execute-api.us-east-1.amazonaws.com/metamask/validate', {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-API-Key': 'NKYIN6cXkFaNnVIfzNx7s1z0p3b0B4SB6k29qA7n',
    },
  });

  return await response.json();
}
