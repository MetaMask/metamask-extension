import { RecurringInterval } from '@metamask/subscription-controller';

export type Plan = {
  id: RecurringInterval;
  label: string;
  price: string;
};
