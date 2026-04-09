import type { TextColor } from '@metamask/design-system-react';
import type { ReactNode } from 'react';
import type { ConfirmInfoRowSize } from '../../confirm/info/row/row';

export type PerpsFiatSummaryRow = {
  label: string;
  /** Shown when `valueContent` is not set. */
  value?: string;
  /** Renders in place of `value` (e.g. token + network badge). */
  valueContent?: ReactNode;
  'data-testid'?: string;
  emphasizeValue?: boolean;
  /** Value column text color; defaults to `textAlternative`. */
  valueColor?: TextColor;
};

export type PerpsFiatSummaryRowsProps = {
  rows: PerpsFiatSummaryRow[];
  rowVariant?: ConfirmInfoRowSize;
};
