import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getSendHexData, updateSendHexData } from '../../../../ducks/send';
import SendRowWrapper from '../send-row-wrapper';
import { useI18nContext } from '../../../../hooks/useI18nContext';

const SendHexDataRow = () => {
  const t = useI18nContext();

  const { input, error } = useSelector(getSendHexData);

  const showHexDataError = Boolean(error);

  const dispatch = useDispatch();

  const onInput = async (event) => {
    const hexData = event.target.value.replace(/\n/gu, '') || null;
    dispatch(updateSendHexData(hexData));
  };

  return (
    <>
      <SendRowWrapper
        label={`${t('hexData')}`}
        showError={showHexDataError}
        errorType="hexData"
      >
        <textarea
          onInput={onInput}
          placeholder={t('optional')}
          className="send-v2__hex-data__input"
          defaultValue={input || ''}
          data-testid="hex-data-area"
        />
      </SendRowWrapper>
    </>
  );
};

export default SendHexDataRow;
