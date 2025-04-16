import React from 'react';
import { Box } from '../../../components/component-library';
import { userStorageGetAllItems, userStorageSetItems } from '../../../store/actions';

export const SyncExperimentsTab: React.FC = () => {
  const [items, setItems] = React.useState<Record<string, string> | null>(null);
  const [loading, setLoading] = React.useState(false);

  return (
    <Box className="settings-page__body">
      <div className="settings-page__content-row">
        <div className="settings-page__content-item">
          <h1>Sync Debug Page</h1>
          <div className="settings-page__content-description">
            This is a debugging page for sync functionality.
          </div>
          <button className="settings-page__button" onClick={loadAllItems}>
            Load raw data
          </button>
          {loading && (
            <div className="settings-page__content-description">Loading...</div>
          )}
          {items && (
            <div className="settings-page__content-description">
              <pre>{JSON.stringify(items, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    </Box>
  );

  async function loadAllItems() {
    try {
      setLoading(true);

      const pushResult = await userStorageSetItems('test-items-123', {a : "1", b: "2", c: "3"});
      console.log(`GIGEL pushResult`, pushResult);
      const result = await userStorageGetAllItems('test-items-123');
      setItems(result);
    } catch (e) {
      console.error('GIGEL: BIG Error fetching items:', e);
      setLoading(false);
    }
  }
};
