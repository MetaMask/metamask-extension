import React from 'react';
import { Icon, IconColor, IconName } from '@metamask/design-system-react';
import { ToastContent, toast } from '../../components/ui/toast/toast';

/**
 * Shows the "Continue in your browser tab" toast used whenever a buy flow
 * opens a checkout tab (native ramps checkout or the Portfolio buy path).
 *
 * @param title - Toast title (buyTabOpenedToastText).
 * @param description - Toast description (buyTabOpenedToastDescription).
 */
export function showBuyTabOpenedToast(title: string, description: string) {
  toast.success(<ToastContent title={title} description={description} />, {
    id: 'buy-tab-opened-toast',
    icon: <Icon name={IconName.Export} color={IconColor.IconDefault} />,
  });
}
