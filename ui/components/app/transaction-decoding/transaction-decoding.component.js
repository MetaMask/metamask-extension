import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Spinner from '../../ui/spinner';
import fetchWithCache from '../../../helpers/utils/fetch-with-cache';
import { useSelector } from 'react-redux';
import { forAddress } from '@truffle/decoder';
import { getSelectedAccount, getCurrentChainId } from '../../../selectors';
import { FETCH_PROJECT_INFO_URI, TX_EXTRA_URI } from './constants';
import { hexToDecimal } from '../../../helpers/utils/conversions.util';
import { ethers } from 'ethers';
import CopyIcon from '../../ui/icon/copy-icon.component';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import Tooltip from '../../ui/tooltip';
import * as Codec from '@truffle/codec';
import inspect from 'browser-util-inspect';
import { RecipientWithAddress } from '../../ui/sender-to-recipient/sender-to-recipient.component';
import { toChecksumHexAddress } from '../../../../shared/modules/hexstring-utils';
import { I18nContext } from '../../../contexts/i18n';

import Address from './components/address';

export default function TransactionDecoding({ to = '', inputData: data = '' }) {
  const t = useContext(I18nContext);
  const [tx, setTx] = useState([]);
  const [copied, handleCopy] = useCopyToClipboard();
  const { address: from } = useSelector(getSelectedAccount);
  const chainId = hexToDecimal(useSelector(getCurrentChainId));

  const transformTxDecoding = (params) => {
    return params.map((node) => {
      console.log(
        '🚀 ~ file: transaction-decoding.component.js ~ line 28 ~ returnparams.map ~ node',
        node,
      );
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

  const renderLeafValue = ({ name, typeClass, value, kind }) => {
    switch (kind) {
      case 'error':
        return 'Malformed data';

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
            return (
              <span className="sol-item solidity-bytes">{value.asHex}</span>
            );

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
                        {renderLeafValue({
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
            const address = value.asAddress;
            return (
              <Address
                addressOnly={true}
                checksummedRecipientAddress={toChecksumHexAddress(address)}
              />
            );

          default:
            console.log('item: %o', value);
            return (
              <pre className="sol-item solidity-raw">
                {inspect(new Codec.Format.Utils.Inspect.ResultInspector(value))}
              </pre>
            );
        }
    }
  };

  const renderTreeItems = ({
    name,
    kind,
    typeClass,
    type,
    value,
    children,
  }) => {
    return children ? (
      <li>
        <details>
          <summary className="typography--weight-bold typography--color-black">
            {name}:{' '}
          </summary>
          <ol>{children.map(renderTreeItems)}</ol>
        </details>
      </li>
    ) : (
      <li className="solidity-value">
        <div className="solidity-named-item solidity-item">
          {!Array.isArray(value) ? (
            <span className="param-name typography--color-black">{name}: </span>
          ) : null}
          <span className="sol-item solidity-uint">
            {renderLeafValue({ name, typeClass, type, value, kind })}
          </span>
        </div>
      </li>
    );
  };

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      // const { info: projectInfo } = await fetchWithCache(
      //   FETCH_PROJECT_INFO_URI +
      //     '?' +
      //     new URLSearchParams({
      //       to,
      //       ['network-id']: chainId,
      //     }),
      //   { method: 'GET' },
      // );
      const { decoding } = await fetchWithCache(
        TX_EXTRA_URI +
          '?' +
          new URLSearchParams({
            to,
            from,
            data,
          }),
        { method: 'GET' },
      );
      // fake await
      await new Promise((resolve) => {
        setTimeout(() => resolve(true), 500);
      });
      setLoading(false);

      // console.log('🚀 ~  global.ethereumProvider', global.ethereumProvider);

      // const provider = new ethers.providers.InfuraWebSocketProvider(
      //   chainId,
      //   'e24b1e96c17e4aa995ad8c0ee861667c',
      // );

      // const decoder = await forAddress(to, {
      //   provider,
      //   projectInfo,
      // });

      // // build the strucutre of the tx
      // const tx = {
      //   from,
      //   to,
      //   input: data,
      //   blockNumber: null,
      // };

      // transform tx decoding arguments into tree data
      console.log('decoding?.arguments', decoding?.arguments);
      const params = transformTxDecoding(decoding?.arguments);
      console.log(
        '🚀 ~ file: transaction-decoding.component.js ~ line 179 ~ params',
        params,
      );
      setTx(params);
    })();
  }, [to, chainId, data]);

  return (
    <div className="transaction-decoding-wrapper">
      {loading ? (
        <div className="transaction-decoding-wrapper-loading">
          <Spinner color="#F7C06C" />
        </div>
      ) : (
        <div className="transaction-decoding-wrapper-content">
          <div className="tree-component">
            <ol>
              <li>
                <details open>
                  <summary className="typography--weight-bold typography--color-black">
                    Transaction data:{' '}
                  </summary>
                  <ol>{tx.map(renderTreeItems)}</ol>
                </details>
              </li>
            </ol>
          </div>
          <div className="copy-raw-tx">
            <Tooltip position="right" title={copied ? 'Copied!' : ''}>
              <button
                onClick={() => {
                  handleCopy(data);
                }}
                className="copy-raw-tx__button"
              >
                <div className="copy-raw-tx__icon">
                  <CopyIcon size={12} color="#BBC0C5" />
                </div>
                <div className="copy-raw-tx__label">
                  Copy raw transaction data
                </div>
              </button>
            </Tooltip>
            {/* <div className="copy-raw-tx__status">
              
            </div> */}
          </div>
        </div>
      )}
    </div>
  );
}

TransactionDecoding.propTypes = {
  to: PropTypes.string.isRequired,
  inputData: PropTypes.string.isRequired,
};
