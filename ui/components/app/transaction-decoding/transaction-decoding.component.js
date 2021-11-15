import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Spinner from '../../ui/spinner';
import fetchWithCache from '../../../helpers/utils/fetch-with-cache';
import { useSelector } from 'react-redux';
import { forAddress } from '@truffle/decoder';
import { getSelectedAccount, getCurrentChainId } from '../../../selectors';
import { FETCH_PROJECT_INFO_URI } from './constants';
import { hexToDecimal } from '../../../helpers/utils/conversions.util';
import { ethers } from 'ethers';
import CopyIcon from '../../ui/icon/copy-icon.component';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import Tooltip from '../../ui/tooltip';

import { I18nContext } from '../../../contexts/i18n';

const airswapTx =
  '[{"name":"order","value":{"type":{"typeClass":"struct","kind":"local","id":"shimmedcompilationNumber(0):18","typeName":"Order","definingContractName":"Types","location":"calldata"},"kind":"value","value":[{"name":"nonce","value":{"type":{"typeClass":"uint","bits":256,"typeHint":"uint256"},"kind":"value","value":{"asBN":"0177b6486a74","rawAsBN":"0177b6486a74"}}},{"name":"expiry","value":{"type":{"typeClass":"uint","bits":256,"typeHint":"uint256"},"kind":"value","value":{"asBN":"602ed7f2","rawAsBN":"602ed7f2"}}},{"name":"signer","value":{"type":{"typeClass":"struct","kind":"local","id":"shimmedcompilationNumber(0):29","typeName":"Party","definingContractName":"Types","location":"calldata"},"kind":"value","value":[{"name":"kind","value":{"type":{"typeClass":"bytes","kind":"static","length":4,"typeHint":"bytes4"},"kind":"value","value":{"asHex":"0x36372b07","rawAsHex":"0x36372b0700000000000000000000000000000000000000000000000000000000"}}},{"name":"wallet","value":{"type":{"typeClass":"address","kind":"specific","payable":false},"kind":"value","value":{"asAddress":"0x00000000000080C886232E9b7EBBFb942B5987AA","rawAsHex":"0x00000000000000000000000000000000000080c886232e9b7ebbfb942b5987aa"}}},{"name":"token","value":{"type":{"typeClass":"address","kind":"specific","payable":false},"kind":"value","value":{"asAddress":"0x27054b13b1B798B345b591a4d22e6562d47eA75a","rawAsHex":"0x00000000000000000000000027054b13b1b798b345b591a4d22e6562d47ea75a"}}},{"name":"amount","value":{"type":{"typeClass":"uint","bits":256,"typeHint":"uint256"},"kind":"value","value":{"asBN":"08f0d180","rawAsBN":"08f0d180"}}},{"name":"id","value":{"type":{"typeClass":"uint","bits":256,"typeHint":"uint256"},"kind":"value","value":{"asBN":"00","rawAsBN":"00"}}}]}},{"name":"sender","value":{"type":{"typeClass":"struct","kind":"local","id":"shimmedcompilationNumber(0):29","typeName":"Party","definingContractName":"Types","location":"calldata"},"kind":"value","value":[{"name":"kind","value":{"type":{"typeClass":"bytes","kind":"static","length":4,"typeHint":"bytes4"},"kind":"value","value":{"asHex":"0x36372b07","rawAsHex":"0x36372b0700000000000000000000000000000000000000000000000000000000"}}},{"name":"wallet","value":{"type":{"typeClass":"address","kind":"specific","payable":false},"kind":"value","value":{"asAddress":"0x4b203f54429F7D3019C0c4998B88f8f3517f8352","rawAsHex":"0x0000000000000000000000004b203f54429f7d3019c0c4998b88f8f3517f8352"}}},{"name":"token","value":{"type":{"typeClass":"address","kind":"specific","payable":false},"kind":"value","value":{"asAddress":"0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2","rawAsHex":"0x000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"}}},{"name":"amount","value":{"type":{"typeClass":"uint","bits":256,"typeHint":"uint256"},"kind":"value","value":{"asBN":"298a051db5f5ea00","rawAsBN":"298a051db5f5ea00"}}},{"name":"id","value":{"type":{"typeClass":"uint","bits":256,"typeHint":"uint256"},"kind":"value","value":{"asBN":"00","rawAsBN":"00"}}}]}},{"name":"affiliate","value":{"type":{"typeClass":"struct","kind":"local","id":"shimmedcompilationNumber(0):29","typeName":"Party","definingContractName":"Types","location":"calldata"},"kind":"value","value":[{"name":"kind","value":{"type":{"typeClass":"bytes","kind":"static","length":4,"typeHint":"bytes4"},"kind":"value","value":{"asHex":"0x36372b07","rawAsHex":"0x36372b0700000000000000000000000000000000000000000000000000000000"}}},{"name":"wallet","value":{"type":{"typeClass":"address","kind":"specific","payable":false},"kind":"value","value":{"asAddress":"0x0000000000000000000000000000000000000000","rawAsHex":"0x0000000000000000000000000000000000000000000000000000000000000000"}}},{"name":"token","value":{"type":{"typeClass":"address","kind":"specific","payable":false},"kind":"value","value":{"asAddress":"0x0000000000000000000000000000000000000000","rawAsHex":"0x0000000000000000000000000000000000000000000000000000000000000000"}}},{"name":"amount","value":{"type":{"typeClass":"uint","bits":256,"typeHint":"uint256"},"kind":"value","value":{"asBN":"00","rawAsBN":"00"}}},{"name":"id","value":{"type":{"typeClass":"uint","bits":256,"typeHint":"uint256"},"kind":"value","value":{"asBN":"00","rawAsBN":"00"}}}]}},{"name":"signature","value":{"type":{"typeClass":"struct","kind":"local","id":"shimmedcompilationNumber(0):42","typeName":"Signature","definingContractName":"Types","location":"calldata"},"kind":"value","value":[{"name":"signatory","value":{"type":{"typeClass":"address","kind":"specific","payable":false},"kind":"value","value":{"asAddress":"0x00000000008Bb52B2F23008Ba58939fF59a8f3F2","rawAsHex":"0x00000000000000000000000000000000008bb52b2f23008ba58939ff59a8f3f2"}}},{"name":"validator","value":{"type":{"typeClass":"address","kind":"specific","payable":false},"kind":"value","value":{"asAddress":"0x4572f2554421Bd64Bef1c22c8a81840E8D496BeA","rawAsHex":"0x0000000000000000000000004572f2554421bd64bef1c22c8a81840e8d496bea"}}},{"name":"version","value":{"type":{"typeClass":"bytes","kind":"static","length":1,"typeHint":"bytes1"},"kind":"value","value":{"asHex":"0x01","rawAsHex":"0x0100000000000000000000000000000000000000000000000000000000000000"}}},{"name":"v","value":{"type":{"typeClass":"uint","bits":8,"typeHint":"uint8"},"kind":"value","value":{"asBN":"1b","rawAsBN":"1b"}}},{"name":"r","value":{"type":{"typeClass":"bytes","kind":"static","length":32,"typeHint":"bytes32"},"kind":"value","value":{"asHex":"0x5fcb0cc856bd0afc89493be7bb0e751a9b876b0faebe3086697b3c6c78e4efd3","rawAsHex":"0x5fcb0cc856bd0afc89493be7bb0e751a9b876b0faebe3086697b3c6c78e4efd3"}}},{"name":"s","value":{"type":{"typeClass":"bytes","kind":"static","length":32,"typeHint":"bytes32"},"kind":"value","value":{"asHex":"0x370a7eef528987c13555fd264d96b45af3277b555f9f4f4f6ebf9eb62d3fec2f","rawAsHex":"0x370a7eef528987c13555fd264d96b45af3277b555f9f4f4f6ebf9eb62d3fec2f"}}}]}}]}}]';

const tx2 =
  '[{"name":"sharesToBurn","value":{"type":{"typeClass":"uint","bits":256,"typeHint":"uint256"},"kind":"value","value":{"asBN":"22","rawAsBN":"22"}}}]';

const tx3 =
  '[{"name":"params","value":{"type":{"typeClass":"struct","kind":"local","id":"shimmedcompilationNumber(0):2860","typeName":"ExactInputSingleParams","definingContractName":"ISwapRouter","location":"calldata"},"kind":"value","value":[{"name":"tokenIn","value":{"type":{"typeClass":"address","kind":"specific","payable":false},"kind":"value","value":{"asAddress":"0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2","rawAsHex":"0x000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"}}},{"name":"tokenOut","value":{"type":{"typeClass":"address","kind":"specific","payable":false},"kind":"value","value":{"asAddress":"0xDe30da39c46104798bB5aA3fe8B9e0e1F348163F","rawAsHex":"0x000000000000000000000000de30da39c46104798bb5aa3fe8b9e0e1f348163f"}}},{"name":"fee","value":{"type":{"typeClass":"uint","bits":24,"typeHint":"uint24"},"kind":"value","value":{"asBN":"0bb8","rawAsBN":"0bb8"}}},{"name":"recipient","value":{"type":{"typeClass":"address","kind":"specific","payable":false},"kind":"value","value":{"asAddress":"0xEB0d7e41840066F834eeAd0A22242E2A3A0c8108","rawAsHex":"0x000000000000000000000000eb0d7e41840066f834eead0a22242e2a3a0c8108"}}},{"name":"deadline","value":{"type":{"typeClass":"uint","bits":256,"typeHint":"uint256"},"kind":"value","value":{"asBN":"60c1870e","rawAsBN":"60c1870e"}}},{"name":"amountIn","value":{"type":{"typeClass":"uint","bits":256,"typeHint":"uint256"},"kind":"value","value":{"asBN":"0d272064e7607847","rawAsBN":"0d272064e7607847"}}},{"name":"amountOutMinimum","value":{"type":{"typeClass":"uint","bits":256,"typeHint":"uint256"},"kind":"value","value":{"asBN":"0d6747e0774c1663b0","rawAsBN":"0d6747e0774c1663b0"}}},{"name":"sqrtPriceLimitX96","value":{"type":{"typeClass":"uint","bits":160,"typeHint":"uint160"},"kind":"value","value":{"asBN":"00","rawAsBN":"00"}}}]}}]';

export default function TransactionDecoding({ to = '', inputData: data = '' }) {
  const t = useContext(I18nContext);
  const [tx, setTx] = useState([]);
  const [copied, handleCopy] = useCopyToClipboard();
  const { address: from } = useSelector(getSelectedAccount);
  const chainId = hexToDecimal(useSelector(getCurrentChainId));

  const mapDecodingData = (params) => {
    return params.map((node) => {
      const nodeName = node.name;
      const nodeValue = node.value;
      const nodeTypeClass = nodeValue.type.typeClass;

      if (nodeTypeClass === 'struct') {
        return {
          name: nodeName,
          typeClass: nodeTypeClass,
          type: nodeValue.type,
          children: mapDecodingData(nodeValue.value),
        };
      }

      return {
        name: nodeName,
        typeClass: nodeTypeClass,
        type: nodeValue.type,
        value: nodeValue.value,
      };
    });
  };

  const renderTreeItems = ({ name, children }, index) => {
    return children ? (
      <li>
        <details open={index === 0 ? 'open' : ''}>
          <summary className="typography--weight-bold typography--color-black">
            {name}:{' '}
          </summary>
          <ol>{children.map(renderTreeItems)}</ol>
        </details>
      </li>
    ) : (
      <li className="solidity-value">
        <div className="solidity-named-item solidity-item">
          <span className="param-name typography--color-black">{name}: </span>
          <span className="sol-item solidity-uint">1613670935156</span>
        </div>
      </li>
    );
  };

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { info: projectInfo } = await fetchWithCache(
        FETCH_PROJECT_INFO_URI +
          '?' +
          new URLSearchParams({
            to,
            ['network-id']: chainId,
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

      const params = mapDecodingData(JSON.parse(airswapTx));
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
            <ol>{tx.map(renderTreeItems)}</ol>
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
