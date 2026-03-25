import type { ConfirmInfoRowSize } from '../../confirm/info/row/row';

export type PerpsFiatSummaryRow = {
  label: string;
  value: string;
  'data-testid'?: string;
  emphasizeValue?: boolean;
};

export type PerpsFiatSummaryRowsProps = {
  rows: PerpsFiatSummaryRow[];
  rowVariant?: ConfirmInfoRowSize;
};
