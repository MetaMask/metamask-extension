import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import inspect from 'browser-util-inspect';
import { forAddress } from '@truffle/decoder';
import { useSelector } from 'react-redux';
import * as Codec from '@truffle/codec';
import Spinner from '../../ui/spinner';
import ErrorMessage from '../../ui/error-message';
import { getSelectedAccount, getCurrentChainId } from '../../../selectors';
import { hexToDecimal } from '../../../helpers/utils/conversions.util';
import { I18nContext } from '../../../contexts/i18n';
import { toChecksumHexAddress } from '../../../../shared/modules/hexstring-utils';
import {
  transformTxDecoding,
  fetchSupportedNetworks,
  fetchProjectInfo,
} from './transaction-decoding.util';

import Address from './components/decoding/address';
import CopyRawData from './components/ui/copy-raw-data';

export default function TransactionDecoding({ to = '', inputData: data = '' }) {
  const t = useContext(I18nContext);
  const [tx, setTx] = useState([]);
  const { address: from } = useSelector(getSelectedAccount);
  const network = hexToDecimal(useSelector(getCurrentChainId));

  const [loading, setLoading] = useState(false);
  const [hasError, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);

      try {
        // check if decoding service is available for current network
        await fetchSupportedNetworks(
          network,
          t('transactionDecodingUnsupportedNetworkError', [network]),
        );

        // fetch project-info for correspondent contract address
        const projectInfo = await fetchProjectInfo(to, network);

        // creating an instance of the truffle decoder
        const decoder = await forAddress(to, {
          provider: global.ethereumProvider,
          projectInfo,
        });

        // decode tx input data
        const decoding = await decoder.decodeTransaction({
          from,
          to,
          input: data,
          blockNumber: null,
        });

        // transform tx decoding arguments into tree data
        const params = transformTxDecoding(decoding?.arguments);
        setTx(params);
        setLoading(false);
      } catch (error) {
        setLoading(false);
        setError(true);
        setErrorMessage(error?.message);
      }
    })();
  }, [t, from, to, network, data]);

  // ***********************************************************
  // component rendering methods
  // ***********************************************************
  const renderLeaf = ({ name, kind, typeClass, value }) => {
    switch (kind) {
      case 'error':
        return (
          <span className="tx-insight-content__solidity-error">
            <span>Malformed data</span>
          </span>
        );

      default:
        switch (typeClass) {
          case 'int':
            return (
              <span className="tx-insight-content__solidity-int">
                {[value.asBN || value.asString].toString()}
              </span>
            );

          case 'uint':
            return (
              <span className="tx-insight-content__solidity-uint">
                {[value.asBN || value.asString].toString()}
              </span>
            );

          case 'bytes':
            return (
              <span className="tx-insight-content__solidity-bytes">
                {value.asHex}
              </span>
            );

          case 'array':
            return (
              <details>
                <summary className="tx-insight-content__summary">
                  {name}:{' '}
                </summary>
                <ol>
                  {value.map((itemValue, index) => {
                    return (
                      <li key={`${itemValue.type?.typeClass}-${index}`}>
                        {renderLeaf({
                          typeClass: itemValue.type?.typeClass,
                          value: itemValue.value,
                          kind: itemValue.kind,
                        })}
                      </li>
                    );
                  })}
                </ol>
              </details>
            );

          case 'address': {
            const address = value?.asAddress;
            return (
              <Address
                addressOnly
                checksummedRecipientAddress={toChecksumHexAddress(address)}
              />
            );
          }
          default:
            return (
              <pre className="tx-insight-content__solidity-raw">
                {inspect(new Codec.Format.Utils.Inspect.ResultInspector(value))}
              </pre>
            );
        }
    }
  };

  const renderTree = (
    { name, kind, typeClass, type, value, children },
    index,
  ) => {
    return children ? (
      <li key={`${typeClass}-${index}`}>
        <details open={index === 0 ? 'open' : ''}>
          <summary className="tx-insight-content__summary">{name}: </summary>
          <ol>{children.map(renderTree)}</ol>
        </details>
      </li>
    ) : (
      <li className="tx-insight-content__solidity-value">
        <div className="tx-insight-content__solidity-item">
          {typeClass !== 'array' && !Array.isArray(value) ? (
            <span className="tx-insight-content__solidity-item--param-name">
              {name}:{' '}
            </span>
          ) : null}
          <span className="tx-insight-content__solidity-item--param-value">
            {renderLeaf({ name, typeClass, type, value, kind })}
          </span>
        </div>
      </li>
    );
  };

  const renderTransactionDecoding = () => {
    if (loading) {
      return (
        <div className="tx-insight-loading">
          <Spinner color="#F7C06C" />
        </div>
      );
    }

    if (hasError) {
      return (
        <div className="tx-insight-error">
          <ErrorMessage errorMessage={errorMessage} />
        </div>
      );
    }

    return (
      <>
        <div className="tx-insight-content">
          <ol>{tx.map(renderTree)}</ol>
        </div>
        <div className="tx-insight-copy-raw-tx">
          <CopyRawData data={data} />
        </div>
      </>
    );
  };

  return <div className="tx-insight">{renderTransactionDecoding()}</div>;
}

TransactionDecoding.propTypes = {
  to: PropTypes.string.isRequired,
  inputData: PropTypes.string.isRequired,
};
