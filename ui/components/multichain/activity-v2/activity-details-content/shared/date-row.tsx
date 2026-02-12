import React from 'react';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useFormatters } from '../../../../../hooks/useFormatters';
import { Row } from '.';

type DateRowProps = {
  time: number;
};

export const DateRow = ({ time }: DateRowProps) => {
  const t = useI18nContext();
  const { formatDateTime } = useFormatters();
  return <Row left={t('date')} right={formatDateTime(time)} />;
};
