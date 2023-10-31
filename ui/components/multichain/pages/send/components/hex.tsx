import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { Label } from '../../../../component-library';
import { getSendHexData, updateSendHexData } from '../../../../../ducks/send';
import { SendPageRow } from '.';

export const SendHexData = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();

  const data = useSelector(getSendHexData);

  return (
    <SendPageRow>
      <Label>{t('hexData')}</Label>
      <textarea
        onInput={(event: any) => {
          const newData = event.target.value.replace(/\n/gu, '') || null;
          dispatch(updateSendHexData(newData ?? ''));
        }}
        placeholder={t('optional')}
        defaultValue={data || ''}
        style={{
          padding: '8px 16px',
          borderRadius: '8px',
          background: 'var(--color-background-default)',
          borderColor: 'var(--color-border-default)',
          color: 'var(--color-text-default)',
        }}
      />
    </SendPageRow>
  );
};
