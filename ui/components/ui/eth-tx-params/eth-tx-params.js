import React from 'react';
import PropTypes from 'prop-types';
import * as Codec from '@truffle/codec';
import inspect from 'browser-util-inspect';
import { Jazzicon } from '@ukstv/jazzicon-react';
import contractMap from '@metamask/contract-metadata';
import { reconstructSource } from "./reconstruct-source.js";

const EthTxParams = ({
  decoding,
  definitions,
  showName=false,
}) => {
  switch (decoding.kind) {
    case 'function':

      const {arguments: args, abi: { name } } = decoding;
      return (
        <div className="eth-tx-params">
          { showName ? <div className="solidity-func-name">{ deCamelCase(name).toUpperCase() }</div> : undefined }
          <ol>
            {
              args.map((argument, index) =>
                renderNamedItem(
                  argument?.name,
                  argument.value,
                  index,
                  definitions
                )
              )
            }
          </ol>
          <footer>Powered by <a href="https://www.trufflesuite.com/docs/truffle/codec/index.html">Truffle Codec</a></footer>
        </div>
      )

    case 'constructor':
    default:
      return 'Unable to render function data';
  }
};

function renderNamedItem (name, item, index, definitions) {

  switch (item.type.typeClass) {
  
    case 'struct': {
      // compute+log source
      const source = reconstructSource({ definitions, typeId: item.type.id });
      console.log(source);

      const amtAndDec = checkIfPlausibleAmount(item);

      return (<details key={index} open>
        <summary>{deCamelCase(name) + ': '}</summary>
        <ol>
          {
            item.value.map((data, index) => {
              const { name, value: item } = data

              if (amtAndDec && data === amtAndDec.amount) {
                const amt = item.value.asBN.toString();
                const firstSeg = amt.substr(0, amt.length - amtAndDec.decimals);
                const lastSeg = amt.substr(amt.length - amtAndDec.decimals, amtAndDec.decimals);
                const decimalAmount = `${firstSeg}.${lastSeg}`;
                return <li className="solidity-value">
                  <div className="solidity-named-item solidity-item">
                    <span className='param-name'>{ deCamelCase(name) + ': ' }</span>
                    <span className="sol-item solidity-uint">
                      {decimalAmount}
                    </span>
                  </div>
                </li>
              }

              return <li className="solidity-value" key={index}>
                {renderNamedItem(name, item, index, definitions)}
              </li>
            })
          }
        </ol>
      </details>);
    }

    case 'array': {
      return (<details key={index} open>
        <summary>{deCamelCase(name) + ': '}</summary>
        <div className="solidity-named-item solidity-item">
          <ol>
            {
              item.value.map((data, index) => {
                return <li className="solidity-value" key={index}>
                  {renderItem(data, definitions)}
                </li>
              })
            }
          </ol>
        </div>
      </details>);
    }

    default: {
      return (<div key={index} className="solidity-named-item solidity-item">
        <span className='param-name'>{ deCamelCase(name) + ': ' }</span>
        { renderItem(item, definitions) }
      </div>)
    }
  }
}

// Result can be a value or an error
// Result { type:SolidityVariableType , kind: ResultKindString }
function renderItem(item, definitions) {
  // Two discriminators: value or error
  switch (item.kind) {
    case "error":
      return "Malformed data";

    default:

      switch (item.type.typeClass) {

        case 'uint':
          return (<span className="sol-item solidity-uint">
            {item.value.asBN.toString()}
          </span>)

        case 'bytes':
          return (<span className="sol-item solidity-bytes">
            {item.value.asHex}
          </span>)

        case 'address':
          return renderAddressComponentFor(item);

        default:
          console.log('item: %o', item)
          return (<pre className="sol-item solidity-raw">
            { inspect(new Codec.Format.Utils.Inspect.ResultInspector(item)) }
          </pre>)
      }
  }
}

const path = 'https://raw.githubusercontent.com/MetaMask/contract-metadata/ecd8aabb34683695c3157bb25cb95f51e57e2620/images/';
function renderAddressComponentFor (item) {

  const metadata = contractMap[item.value.asAddress];

  const icon = metadata ? <img src={`${path}${metadata.logo}`}/> :
    <Jazzicon address={item.value.asAddress}/>;

  const name = metadata ? metadata.name : item.value.asAddress;

  return (<span className="sol-item solidity-address">
    { icon }
    <span>{name}</span>
  </span>)
}



function deCamelCase (label) {
  return label.replace(/([A-Z])/g, ",$1").toLowerCase().split(',').join(' ');
}

function checkIfPlausibleAmount (struct) {

  const tokenFields = struct.value
  .filter(struct => struct.name.toLowerCase().includes('token'))
  .filter(struct => struct.value.type.typeClass === 'address');

  const amountFields = struct.value
  .filter(struct => struct.name.toLowerCase().includes('amount'))
  .filter(struct => struct.value?.type?.typeClass.includes('uint'));

  if (tokenFields.length === 1 && amountFields.length === 1) {
    const metadata = contractMap[tokenFields[0].value.value.asAddress]
    if (metadata?.decimals) {
      return { decimals: metadata.decimals, amount: amountFields[0] };
    }
  }

  return false;
}

EthTxParams.propTypes = {
  decoding: PropTypes.object,
  definitions: PropTypes.object,
};

export default EthTxParams;
