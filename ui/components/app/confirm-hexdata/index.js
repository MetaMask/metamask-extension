import React from 'react';
import { useSelector } from 'react-redux';

import { toBuffer } from '../../../../shared/modules/buffer-utils';
import { getKnownMethodData } from '../../../selectors';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useTransactionFunctionType } from '../../../hooks/useTransactionFunctionType';
import CopyRawData from '../transaction-decoding/components/ui/copy-raw-data';

const ConfirmHexData = ({ txData, dataHexComponent }) => {
  const t = useI18nContext();
  const { txParams = {} } = txData;
  const methodData = useSelector(
    (state) => getKnownMethodData(state, txParams.data) || {},
  );
  const { functionType } = useTransactionFunctionType(txData);

  if (dataHexComponent) {
    return dataHexComponent;
  }

  if (!txParams.data || !txParams.to) {
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
      {params && (
        <div className="confirm-page-container-content__data-box">
          <div className="confirm-page-container-content__data-field-label">
            {`${t('parameters')}:`}
          </div>
          <div>
            <pre>{JSON.stringify(params, null, 2)}</pre>
          </div>
        </div>
      )}
      <div className="confirm-page-container-content__data-box-label">
        {`${t('hexData')}: ${toBuffer(txParams?.data).length} bytes`}
      </div>
      <div className="confirm-page-container-content__data-box">
        {txParams?.data}
      </div>
      <CopyRawData data={txParams?.data} />
    </div>
  );
};

ConfirmData.propTypes = {
  txData: PropTypes.object,
  dataHexComponent: PropTypes.element,
};

export default ConfirmHexData;
