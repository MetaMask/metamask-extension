import React from 'react';
import { Icon, IconColor, IconName } from '@metamask/design-system-react';
import { ToastContent, toast } from '../../../../components/ui/toast/toast';

/**
 * Shows the same "Continue in your browser tab" toast used by the Portfolio
 * buy path when a provider checkout tab is opened.
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
