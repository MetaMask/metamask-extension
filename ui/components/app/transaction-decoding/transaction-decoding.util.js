import { fetchToken, fetchTokenPrice } from '../../../../ui/pages/swaps/swaps.util'
import BigNumber from 'bignumber.js';


// *********************************************
// data transformation utils
// *********************************************
export const transformTxDecoding = (params) => {
  return params.map((node) => {
    const nodeName = node.name;
    const nodeValue = node.value;
    const nodeKind = nodeValue.kind;
    const nodeTypeClass = nodeValue.type.typeClass;

    const treeItem = {
      name: nodeName,
      kind: nodeKind,
      typeClass: nodeTypeClass,
      type: nodeValue.type,
    };

    if (nodeTypeClass === 'struct') {
      return {
        ...treeItem,
        children: transformTxDecoding(nodeValue.value),
      };
    }

    return {
      ...treeItem,
      value: nodeValue.value ? nodeValue.value : nodeValue,
    };
  });
};


export const parameterProcessing = async (params) => {
  let dict = {}
  let amountOut = new BigNumber(params[0].value.asBN) 
  let addressOut = params[1].value[params[1].value.length - 1].value.asAddress
  let tokenInfo = await fetchToken(addressOut, 1)
  let tokenPrice = await fetchTokenPrice(addressOut, 'usd')
  let displayAmount = amountOut.dividedBy(10**tokenInfo.decimals)
  dict[params[0].name] = `${displayAmount.toString()} ($${displayAmount.times(tokenPrice)})`
  return dict
}