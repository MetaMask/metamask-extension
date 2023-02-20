import React from 'react';
import { useSelector } from 'react-redux';

import { getKnownMethodData } from '../../../selectors';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useTransactionFunctionType } from '../../../hooks/useTransactionFunctionType';

import Disclosure from '../../ui/disclosure';
import TransactionDecoding from '../transaction-decoding';

const ConfirmData = ({ txData, dataComponent }) => {
  const t = useI18nContext();
  const { txParams = {} } = txData;
  const methodData = useSelector(
    (state) => getKnownMethodData(state, txParams.data) || {},
  );
  const { functionType } = useTransactionFunctionType(txData);

  if (dataComponent) {
    return dataComponent;
  }

  if (!txParams.data) {
    return null;
  }

  const { params } = methodData;
  const functionParams = params?.length
    ? `(${params.map(({ type }) => type).join(', ')})`
    : '';

  return (
    <div className="confirm-page-container-content__data">
      <div className="confirm-page-container-content__data-box-label">
        {`${t('functionType')}:`}
        <span className="confirm-page-container-content__function-type">
          {`${functionType} ${functionParams}`}
        </span>
      </div>
      <Disclosure>
        <TransactionDecoding to={txParams?.to} inputData={txParams?.data} />
      </Disclosure>
    </div>
  );
};

ConfirmData.propTypes = {
  txData: PropTypes.object,
  dataComponent: PropTypes.element,
};

export default ConfirmData;
