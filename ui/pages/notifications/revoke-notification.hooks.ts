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
          'https://webhook.site/token/c5e61ff6-dc8d-4aa0-b651-5ab0433eec2c/request/latest/raw',
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
