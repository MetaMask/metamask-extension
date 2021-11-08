import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import Tree from '../../ui/tree';

import { I18nContext } from '../../../contexts/i18n';

export default function TransactionDecoding({
  contractAddress = '',
  chainId = '',
  inputData = '',
}) {
  const t = useContext(I18nContext);

  return <Tree />;
}

TransactionDecoding.propTypes = {
  contractAddress: PropTypes.string.isRequired,
  chainId: PropTypes.string.isRequired,
  inputData: PropTypes.string.isRequired,
};
