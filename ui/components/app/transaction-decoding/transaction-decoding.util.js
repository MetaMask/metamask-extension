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
