import React from 'react';
import { NotificationDetailTitle } from '../../../components/multichain';
import { formatIsoDateString } from '../../../helpers/utils/notification.util';

type NotificationWithTemplateTitle = {
  createdAt: string;
  template?: { title?: string };
};

/**
 * Shared `details.title` renderer for on-chain notification components.
 * The API-provided `template.title` is now the single source of truth for
 * the detail header copy, so every on-chain notification component renders
 * it identically.
 *
 * @param props - The properties of the component
 * @param props.notification - The notification to render the title for
 * @returns A JSX element
 */
export const OnChainNotificationDetailsTitle = ({
  notification,
}: {
  notification: NotificationWithTemplateTitle;
}) => (
  <NotificationDetailTitle
    title={notification.template?.title ?? ''}
    date={formatIsoDateString(notification.createdAt)}
  />
);
