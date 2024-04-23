import { v4 as uuidv4 } from 'uuid';
import { NotificationTrigger } from '../utils/utils';

export function createMockNotificationTrigger(
  override?: Partial<NotificationTrigger>,
): NotificationTrigger {
  return {
    id: uuidv4(),
    address: '0xFAKE_ADDRESS',
    chainId: '1',
    kind: 'eth_sent',
    enabled: true,
    ...override,
  };
}
