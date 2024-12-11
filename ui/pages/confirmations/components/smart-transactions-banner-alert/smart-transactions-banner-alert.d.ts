import { FC } from 'react';

interface SmartTransactionsBannerAlertProps {
  marginType?: 'default' | 'none' | 'noTop' | 'onlyTop';
}

declare const SmartTransactionsBannerAlert: FC<SmartTransactionsBannerAlertProps>;

export { SmartTransactionsBannerAlert };
