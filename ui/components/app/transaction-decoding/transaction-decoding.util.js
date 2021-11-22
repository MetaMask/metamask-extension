// *********************************************
// data transformation utils
// *********************************************
import React from 'react';

import * as Codec from '@truffle/codec';
import inspect from 'browser-util-inspect';
import { toChecksumHexAddress } from '../../../../shared/modules/hexstring-utils';
import Address from './components/decoding/address';

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
// components rendering utils
// *********************************************

export const renderLeaf = ({ name, kind, typeClass, value }) => {
  switch (kind) {
    case 'value':
      return (
        <span className="sol-item solidity-error">
          <span>Malformed data</span>
        </span>
      );

    default:
      switch (typeClass) {
        case 'int':
          return (
            <span className="sol-item solidity-int">
              {[value.asBN || value.asString].toString()}
            </span>
          );

        case 'uint':
          return (
            <span className="sol-item solidity-uint">
              {[value.asBN || value.asString].toString()}
            </span>
          );

        case 'bytes':
          return <span className="sol-item solidity-bytes">{value.asHex}</span>;

        case 'array':
          return (
            <details>
              <summary className="typography--weight-bold typography--color-black">
                {name}:{' '}
              </summary>
              <ol>
                {value.map((itemValue) => {
                  return (
                    <li>
                      {renderLeaf({
                        typeClass: itemValue.type.typeClass,
                        value: itemValue.value,
                        kind: itemValue.kind,
                      })}
                    </li>
                  );
                })}
              </ol>
            </details>
          );

        case 'address':
          const address = value?.asAddress;
          return (
            <Address
              addressOnly={true}
              checksummedRecipientAddress={toChecksumHexAddress(address)}
            />
          );

        default:
          return (
            <pre className="sol-item solidity-raw">
              {inspect(new Codec.Format.Utils.Inspect.ResultInspector(value))}
            </pre>
          );
      }
  }
};

export const renderTree = (
  { name, kind, typeClass, type, value, children },
  index,
) => {
  return children ? (
    <li>
      <details open={index === 0 ? 'open' : ''}>
        <summary>{name}: </summary>
        <ol>{children.map(renderTree)}</ol>
      </details>
    </li>
  ) : (
    <li className="solidity-value">
      <div className="solidity-named-item solidity-item">
        {typeClass !== 'array' && !Array.isArray(value) ? (
          <span className="param-name typography--weight-bold typography--color-black">
            {name}:{' '}
          </span>
        ) : null}
        <span className="sol-item solidity-uint">
          {renderLeaf({ name, typeClass, type, value, kind })}
        </span>
      </div>
    </li>
  );
};
