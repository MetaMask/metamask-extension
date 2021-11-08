import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Tree from '../../ui/tree';
import Spinner from '../../ui/spinner';
import fetchWithCache from '../../../helpers/utils/fetch-with-cache';

import { I18nContext } from '../../../contexts/i18n';

const FETCH_PROJECT_INFO_URI = 'http://localhost:8080/fetch-project';

export default function TransactionDecoding({
  to = '',
  chainId = '',
  inputData = '',
}) {
  const t = useContext(I18nContext);

  const data = {
    id: 'root',
    name: 'Parent',
    children: [
      {
        id: '1',
        name: 'Child - 1',
      },
      {
        id: '3',
        name: 'Child - 3',
        children: [
          {
            id: '4',
            name: 'Child - 4',
          },
        ],
      },
    ],
  };

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const response = await fetchWithCache(
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
        setTimeout(() => resolve(true), 1000);
      });
      setLoading(false);
      console.log('response', response);
    })();
  }, [to, chainId, inputData]);

  return (
    <div className="transaction-decoding-wrapper">
      {loading ? (
        <div className="transaction-decoding-wrapper-loading">
          <Spinner color="#F7C06C" />
        </div>
      ) : (
        <div className="transaction-decoding-wrapper-content">
          <Tree />
        </div>
      )}
    </div>
  );
}

TransactionDecoding.propTypes = {
  contractAddress: PropTypes.string.isRequired,
  chainId: PropTypes.string.isRequired,
  inputData: PropTypes.string.isRequired,
};
