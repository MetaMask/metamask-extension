import React from 'react';
import { useDispatch } from 'react-redux';
import { Box } from '../../../components/component-library';
import { performGetStorageAllFeatureEntries } from '../../../store/actions';

export const SyncExperimentsTab: React.FC = () => {
  // get all items from accounts_v2 and render them in the component
  const [items, setItems] = React.useState<Record<string, string> | null>(null);
  const [loading, setLoading] = React.useState(false);
  const dispatch = useDispatch();

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
      let result;
      try {
        result = await dispatch(
          performGetStorageAllFeatureEntries('accounts_v2'),
        );
      } catch (e) {
        console.error('Error fetching items:', e);
        return;
      } finally {
        setLoading(false);
      }
      setItems(result);
    } catch (e) {
      console.error('BIG Error fetching items:', e);
    }
  }
};
