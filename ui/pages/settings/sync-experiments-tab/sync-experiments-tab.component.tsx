import React, { useEffect, useCallback } from 'react';
import { Array as YArray, Doc } from 'yjs';
import { Box } from '../../../components/component-library';
import { userStorageGetAllItems } from '../../../store/actions';
import { YjsProvider } from './yjs.provider';

const EXPERIMENTAL_KEY = 'test-items-116';

// Define the item type
type SyncItem = {
  id: string;
  name: string;
};

export const SyncExperimentsTab: React.FC = () => {
  const [rawItems, setRawItems] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [listItems, setListItems] = React.useState<SyncItem[]>([]);
  const [editItemId, setEditItemId] = React.useState<string | null>(null);
  const [editItemValue, setEditItemValue] = React.useState<string>('');

  // Create the doc and provider directly
  const doc = React.useMemo<Doc>(() => new Doc(), []);

  // Create the provider ref to avoid recreating it on every render
  const provider = React.useMemo<YjsProvider>(
    () => new YjsProvider(doc, EXPERIMENTAL_KEY),
    [doc],
  );

  // Get the shared array from the document (only once during initialization)
  const itemsArray = React.useMemo<YArray<SyncItem>>(
    () => doc.getArray<SyncItem>(EXPERIMENTAL_KEY),
    [doc],
  );

  // Use memoized handler to avoid recreating it on every render
  const handleItemsChange = useCallback(() => {
    const newItems = itemsArray.toArray();
    setListItems(newItems);
  }, [itemsArray]);

  // Update items when the YJS array changes
  useEffect(() => {
    // Initialize with current values
    handleItemsChange();

    // Use a single observer to reduce event handling
    itemsArray.observe(handleItemsChange);

    return () => {
      itemsArray.unobserve(handleItemsChange);
    };
  }, [itemsArray, handleItemsChange]);

  // Memoize handlers to prevent unnecessary recreations
  const handlePull = useCallback(async () => {
    setLoading(true);
    try {
      const updates = await provider.handlePull();
      setRawItems(updates);
    } catch (e) {
      console.error('Error fetching items:', e);
    } finally {
      setLoading(false);
    }
  }, [provider]);

  const handlePush = useCallback(async () => {
    setLoading(true);
    try {
      await provider.handlePush();
    } catch (e) {
      console.error('Error pushing items:', e);
    } finally {
      setLoading(false);
    }
  }, [provider]);

  const fetchAllEntries = useCallback(async () => {
    setLoading(true);
    try {
      const result = await userStorageGetAllItems(EXPERIMENTAL_KEY);
      setRawItems(result);
    } catch (e) {
      console.error('Error fetching items:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAddItem = useCallback(() => {
    const newItem: SyncItem = {
      id: Date.now().toString(),
      name: `Item ${listItems.length + 1}`,
    };

    // Use a single transaction for all changes
    doc.transact(() => {
      itemsArray.push([newItem]);
    }, 'local');
  }, [doc, itemsArray, listItems.length]);

  const handleDeleteItem = useCallback(
    (id: string) => {
      doc.transact(() => {
        const index = itemsArray
          .toArray()
          .findIndex((item: SyncItem) => item.id === id);
        if (index !== -1) {
          itemsArray.delete(index, 1);
        }
      }, 'local');
    },
    [doc, itemsArray],
  );

  const handleEditItem = useCallback((id: string, currentValue: string) => {
    setEditItemId(id);
    setEditItemValue(currentValue);
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (editItemId === null) {
      return;
    }

    doc.transact(() => {
      const index = itemsArray
        .toArray()
        .findIndex((item: SyncItem) => item.id === editItemId);
      if (index !== -1) {
        const updatedItem = { ...itemsArray.get(index), name: editItemValue };
        itemsArray.delete(index, 1);
        itemsArray.insert(index, [updatedItem]);
      }
    }, 'local');

    setEditItemId(null);
    setEditItemValue('');
  }, [doc, itemsArray, editItemId, editItemValue]);

  const handleCancelEdit = useCallback(() => {
    setEditItemId(null);
    setEditItemValue('');
  }, []);

  return (
    <Box className="settings-page__body">
      <div className="settings-page__content-row">
        <div className="settings-page__content-item">
          <h1>Sync Debug Page</h1>
          <div className="settings-page__content-description">
            This is a debugging page for sync functionality.
          </div>

          <div className="settings-page__content-item-col">
            <div className="settings-page__item-list">
              {listItems.length === 0 ? (
                <div className="settings-page__no-items">
                  No items. Add an item to get started.
                </div>
              ) : (
                <ul className="settings-page__items">
                  {listItems.map((item) => (
                    <li key={item.id} className="settings-page__item">
                      {editItemId === item.id ? (
                        <div className="settings-page__item-edit">
                          <input
                            type="text"
                            className="settings-page__input"
                            value={editItemValue}
                            onChange={(e) => setEditItemValue(e.target.value)}
                            autoFocus
                          />
                          <div className="settings-page__item-actions">
                            <button
                              className="settings-page__button settings-page__button--small"
                              onClick={handleSaveEdit}
                            >
                              Save
                            </button>
                            <button
                              className="settings-page__button settings-page__button--small"
                              onClick={handleCancelEdit}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="settings-page__item-display">
                          <span className="settings-page__item-name">
                            {item.name}
                          </span>
                          <div className="settings-page__item-actions">
                            <button
                              className="settings-page__button settings-page__button--small"
                              onClick={() => handleEditItem(item.id, item.name)}
                            >
                              Edit
                            </button>
                            <button
                              className="settings-page__button settings-page__button--small settings-page__button--danger"
                              onClick={() => handleDeleteItem(item.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button
              className="settings-page__button settings-page__button--primary"
              onClick={handleAddItem}
            >
              Add Item
            </button>
          </div>

          <div className="settings-page__button-group">
            <button className="settings-page__button" onClick={fetchAllEntries}>
              Load raw data
            </button>
            <button className="settings-page__button" onClick={handlePull}>
              Pull
            </button>
            <button className="settings-page__button" onClick={handlePush}>
              Push
            </button>
          </div>

          {loading && (
            <div className="settings-page__content-description">Loading...</div>
          )}
          {rawItems && rawItems.length > 0 && (
            <div className="settings-page__content-description">
              <pre>{JSON.stringify(rawItems, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    </Box>
  );
};
