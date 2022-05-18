import React, { useState } from 'react';
import { isHexString } from 'ethereumjs-util';
import { useDispatch, useSelector } from 'react-redux';
import { getSendHexData, updateSendHexData } from '../../../../ducks/send';
import SendRowWrapper from '../send-row-wrapper';
import Dialog from '../../../../components/ui/dialog';
import { useI18nContext } from '../../../../hooks/useI18nContext';

const SendHexDataRow = () => {
  const [shouldShowError, setShouldShowError] = useState(false);

  const t = useI18nContext();

  const data = useSelector(getSendHexData);

  const dispatch = useDispatch();

  const onInput = (event) => {
    const isValidHex = isHexString(event.target.value) || !event.target.value;
    setShouldShowError(!isValidHex);
    const hexData = event.target.value.replace(/\n/gu, '') || null;
    dispatch(updateSendHexData(hexData));
  };

  const renderError = (error) => {
    return (
      <Dialog
        type="error"
        className="send__error-dialog"
        data-testid="hex-data-error-message"
      >
        {t(error)}
      </Dialog>
    );
  };

  return (
    <>
      <SendRowWrapper
        label={`${t('hexData')}:::`}
        showError={false}
        errorType="amount"
      >
        <textarea
          onInput={onInput}
          placeholder={t('optional')}
          className="send-v2__hex-data__input"
          defaultValue={data || ''}
          data-testid="hex-data-area"
        />
      </SendRowWrapper>
      {shouldShowError && renderError('invalidHexString')}
    </>
  );
};

export default SendHexDataRow;
