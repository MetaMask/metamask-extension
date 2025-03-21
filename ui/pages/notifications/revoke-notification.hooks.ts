import { useEffect, useState } from 'react';
import { RevokeData, RevokeNotification } from './revoke-notification.types';

export const TEST_REVOKE_NOTIFICATION_ID =
  'f6ad9c5a-6498-4c8d-b474-29a170e55590';

export const useRevokeNotification = () => {
  const [notification, setNotification] = useState<RevokeNotification | null>(
    null,
  );
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchNotification = async () => {
      try {
        const response = await fetch(
          'https://webhook.site/token/75f46780-5ba3-4354-ab32-748eb3cdeecc/request/latest/raw',
        );
        if (!response.ok) {
          throw new Error('Failed to fetch notification');
        }
        const data: RevokeData = await response.json();
        setNotification({
          type: 'RevokeNotification',
          data,
          id: TEST_REVOKE_NOTIFICATION_ID,
          createdAt: new Date().toString(),
          isRead: false,
        });
      } catch (err) {
        // Do Nothing
      } finally {
        setLoading(false);
      }
    };

    fetchNotification();
  }, []);

  return { notification, loading };
};
