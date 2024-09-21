import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { Label } from '../../../../component-library';
import { getSendHexData, updateSendHexData } from '../../../../../ducks/send';
import { Textarea } from '../../../../component-library/textarea';
import { SendPageRow } from '.';

export const SendHexData = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();

  const data = useSelector(getSendHexData);

  return (
    <SendPageRow>
      <Label>{t('hexData')}</Label>
      <Textarea
        // TODO: Replace `any` with type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onInput={(event: any) => {
          const newData = event.target.value.replace(/\n/gu, '') || null;
          dispatch(updateSendHexData(newData ?? ''));
        }}
        placeholder={t('optional')}
        defaultValue={data || ''}
        data-testid="send-hex-textarea"
      />
    </SendPageRow>
  );
};
