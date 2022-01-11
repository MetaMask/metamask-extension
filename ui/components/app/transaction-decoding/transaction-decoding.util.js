import { signaturesData } from './signatures';

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

function ruleRegexSet(rule) {
  const ruleMatches = [rule.field].concat(
    rule.detect === undefined ? [] : rule.detect,
  );
  const rgxSet = new Set(ruleMatches);
  return rgxSet;
}

function matchParam(param, reSet) {
  for (const regx of reSet) {
    if (param.name.match(regx)) {
      return regx;
    }
  }
  return null;
}

function checkRule(rule, params) {
  const regexSet = ruleRegexSet(rule);
  const regexToParamMap = {};
  for (const [i, param] of params.entries()) {
    const match = matchParam(param, regexSet);

    if (match !== null) {
      regexToParamMap[match] = i;
      regexSet.delete(match);
      if (regexSet.size === 0) {
        return {
          ...rule,
          paramMapping: regexToParamMap,
        };
      }
    }
  }
  return null;
}

function getMathingRules(params) {
  const rules = signaturesData
    .map((rule) => checkRule(rule, params))
    .filter((rule) => rule !== null);
  return rules;
}

function getFormattedParameter(param) {
  switch (param.type.typeClass) {
    case 'uint':
      return param.value.asBN;
    case 'int':
      return param.value.asBN;
    case 'array':
      return param.value.map((val) => getFormattedParameter(val));
    case 'address':
      return param.value.asAddress;
    default:
      return param;
  }
}

function applyRule(params, rule) {
  const regName = rule.field;
  const mainParameter = params[rule.paramMapping[regName]];
  const suppliments = [getFormattedParameter(mainParameter)];
  const fieldName = mainParameter.name;
  const detect = rule.detect === undefined ? [] : rule.detect;
  for (const regex of detect) {
    suppliments.push(getFormattedParameter(params[rule.paramMapping[regex]]));
  }

  return { fieldName, suppliments };
}

export const parameterProcessing = async (params) => {
  const dict = {};
  const rules = getMathingRules(params);
  for (const rule of rules) {
    const { fieldName, suppliments } = applyRule(params, rule);
    dict[fieldName] = rule.transform(...suppliments);
  }
  return dict;
};
