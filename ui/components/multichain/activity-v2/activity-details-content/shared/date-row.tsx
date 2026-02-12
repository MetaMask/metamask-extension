import React from 'react';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { formatDateTime } from '../../helpers';
import { Row } from '.';

type DateRowProps = {
  time: number;
};

export const DateRow = ({ time }: DateRowProps) => {
  const t = useI18nContext();
  return <Row left={t('date')} right={formatDateTime(time)} />;
};
