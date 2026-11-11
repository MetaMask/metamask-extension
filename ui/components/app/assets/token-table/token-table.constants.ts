import type { HeaderColumn } from './token-table.types';

// Measures the table, not the viewport: the side nav has already taken 320px
// by the time `lg` would apply. Below `@2xl` (42rem of this table) the price
// cell stacks the 24h change under the price. At `@2xl` they are separate columns.
export const COLUMNS_CLASS_NAME =
  'grid w-full grid-cols-[minmax(0,1.5fr)_repeat(2,minmax(0,1fr))] items-center gap-4 px-4 @2xl/token-table:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,1fr))]';

export const PRICE_AND_CHANGE_ITEM_CLASS_NAME =
  'min-w-0 @2xl/token-table:justify-self-end';

export const PERCENT_CHANGE_CLASS_NAME = `${PRICE_AND_CHANGE_ITEM_CLASS_NAME} @2xl/token-table:[&_.mm-text]:text-l-body-md`;

export const HEADER_COLUMNS: HeaderColumn[] = [
  { column: 'token', labelKey: 'token', className: 'flex' },
  { column: 'price', labelKey: 'price', className: 'flex justify-end' },
  {
    column: 'change',
    labelKey: '24hChange',
    className: 'hidden justify-end @2xl/token-table:inline-flex',
  },
  { column: 'balance', labelKey: 'balance', className: 'flex justify-end' },
];
