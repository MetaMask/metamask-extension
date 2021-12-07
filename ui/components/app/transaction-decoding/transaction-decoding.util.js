import fetchWithCache from '../../../helpers/utils/fetch-with-cache';
import {
  FETCH_PROJECT_INFO_URI,
  FETCH_SUPPORTED_NETWORKS_URI,
} from './constants';

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

// *********************************************
// remote data fetching utils
// *********************************************
export const fetchSupportedNetworks = async (network = 1, errorMsg) => {
  const networks = await fetchWithCache(FETCH_SUPPORTED_NETWORKS_URI, {
    method: 'GET',
  });

  if (
    !networks.some((n) => n.active && Number(n.chainId) === Number(network))
  ) {
    throw new Error(errorMsg);
  }

  return networks;
};

export const fetchProjectInfo = async (to, network) => {
  const requestUrl = `${FETCH_PROJECT_INFO_URI}?${new URLSearchParams({
    to,
    'network-id': network,
  })}`;

  const response = await fetchWithCache(requestUrl, { method: 'GET' });

  if (!response.info) {
    throw new Error('Project info is not available !');
  }

  return response.info;
};

// *********************************************
// truffle decoding utils
// *********************************************
