export enum KnownSessionProperties {
  SolanaAccountChangedNotifications = 'solana_accountChanged_notifications',
}

export function isKnownSessionPropertyValue(
  value: string,
): value is KnownSessionProperties {
  return Object.values(KnownSessionProperties).includes(
    value as KnownSessionProperties,
  );
}
