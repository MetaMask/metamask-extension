import React, { useContext, useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import Spinner from '../../ui/spinner';
import ErrorMessage from '../../ui/error-message';
import fetchWithCache from '../../../helpers/utils/fetch-with-cache';
import { useSelector } from 'react-redux';
import { forAddress } from '@truffle/decoder';
import { getSelectedAccount, getCurrentChainId } from '../../../selectors';
import { FETCH_PROJECT_INFO_URI, TX_EXTRA_URI } from './constants';
import { hexToDecimal } from '../../../helpers/utils/conversions.util';
import { ethers } from 'ethers';
import { I18nContext } from '../../../contexts/i18n';
import { renderTree, transformTxDecoding } from './transaction-decoding.util';

import CopyRawData from './components/ui/copy-raw-data/';
import { render } from 'enzyme';

export default function TransactionDecoding({
  to = '',
  inputData: data = '',
  title = '',
}) {
  const t = useContext(I18nContext);
  const bottomEl = useRef(null);
  const [tx, setTx] = useState([]);
  const { address: from } = useSelector(getSelectedAccount);
  const chainId = hexToDecimal(useSelector(getCurrentChainId));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // const { info: projectInfo } = await fetchWithCache(
        //   FETCH_PROJECT_INFO_URI +
        //     '?' +
        //     new URLSearchParams({
        //       to,
        //       ['network-id']: chainId,
        //     }),
        //   { method: 'GET' },
        // );

        const request_url =
          TX_EXTRA_URI +
          '?' +
          new URLSearchParams({
            to,
            from,
            data,
          });

        const response = await fetchWithCache(request_url, {
          method: 'GET',
        });

        if (!response) {
          throw new Error(`Decoding error: request time out !`);
        }

        if (!response?.decoding) {
          throw new Error(`Decoding error: ${response}`);
        }

        // fake await
        await new Promise((resolve) => {
          setTimeout(() => resolve(true), 500);
        });

        // transform tx decoding arguments into tree data
        const params = transformTxDecoding(response?.decoding?.arguments);
        setTx(params);

        // const decoder = await forAddress(to, {
        //   provider: global.ethereumProvider,
        //   projectInfo,
        // });
        // console.log('🚀 decoder', decoder);

        setLoading(false);
      } catch (error) {
        setLoading(false);
        setError(true);
        setErrorMessage(error?.message);
      }

      // console.log('🚀 ~  global.ethereumProvider', global.ethereumProvider);

      // const provider = new ethers.providers.InfuraWebSocketProvider(
      //   chainId,
      //   'e24b1e96c17e4aa995ad8c0ee861667c',
      // );

      // // build the strucutre of the tx
      // const tx = {
      //   from,
      //   to,
      //   input: data,
      //   blockNumber: null,
      // };
    })();
  }, [to, chainId, data]);

  useEffect(() => {
    if (!loading && !error && tx) {
      scrollToBottom();
    }
  }, [loading, error, tx]);

  const scrollToBottom = () => {
    bottomEl && bottomEl.current.scrollIntoView({ behavior: 'smooth' });
  };

  const renderTransactionDecoding = () => {
    return loading ? (
      <div className="tx-insight-loading">
        <Spinner color="#F7C06C" />
      </div>
    ) : error ? (
      <div className="tx-insight-error">
        <ErrorMessage errorMessage={errorMessage} />
      </div>
    ) : (
      <div className="tx-insight-content">
        <div className="tx-insight-content__tree-component">
          <ol>{tx.map(renderTree)}</ol>
        </div>
        <div ref={bottomEl} className="tx-insight-content__copy-raw-tx">
          <CopyRawData data={data} />
        </div>
      </div>
    );
  };

  return title ? (
    <div className="tx-insight">
      <details>
        <summary className="tx-insight-title typography--weight-bold typography--color-black">
          {title}:{' '}
        </summary>
        {renderTransactionDecoding()}
      </details>
    </div>
  ) : (
    <div className="tx-insight">{renderTransactionDecoding()}</div>
  );
}

TransactionDecoding.propTypes = {
  to: PropTypes.string.isRequired,
  inputData: PropTypes.string.isRequired,
};
