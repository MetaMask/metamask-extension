import React, { useEffect } from 'react';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex, hexToBytes } from '@metamask/utils';
import { Doc, applyUpdate } from 'yjs';
import { Box } from '../../../components/component-library';
import {
  userStorageGetAllItems,
  userStorageSetItems,
} from '../../../store/actions';

const EXPERIMENTAL_KEY = 'test-items-116';

// Define the item type
type SyncItem = {
  id: string;
  name: string;
};

class YjsProvider {
  doc: Doc;

  pendingUpdates: Uint8Array[];

  processedUpdates: Set<string>;

  constructor(doc: Doc) {
    this.doc = doc;
    this.pendingUpdates = [];
    this.processedUpdates = new Set<string>();
    doc.on('update', (update: Uint8Array, origin: unknown) => {
      if (origin !== 'remote') {
        console.log(
          `GIGEL store pending update from ${origin} with ${update.length} bytes`,
        );
        this.pendingUpdates.push(update);
      }
    });
  }

  processUpdates(updates: Uint8Array[]) {
    if (!Array.isArray(updates) || updates.length === 0) {
      return 0;
    }

    let updatesApplied = 0;

    updates.forEach((updateData) => {
      const updateId = bytesToHex(sha256(updateData));
      try {
        // Only apply if we haven't seen this update ID before
        if (updateId && !this.processedUpdates.has(updateId)) {
          console.log('GIGEL applying update', updateId);
          // Apply the update to the document
          applyUpdate(this.doc, updateData, 'remote');

          updatesApplied += 1;

          // Track the processed update
          this.processedUpdates.add(updateId);
        }
      } catch (err) {
        console.error(`GIGEL Provider error applying update:`, err);
      }
    });

    return updatesApplied;
  }
}

export const SyncExperimentsTab: React.FC = () => {
  const [rawItems, setRawItems] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [listItems, setListItems] = React.useState<SyncItem[]>([]);
  const [editItemId, setEditItemId] = React.useState<string | null>(null);
  const [editItemValue, setEditItemValue] = React.useState<string>('');

  // Create the doc and provider directly
  const docRef = React.useRef<Doc>(new Doc());
  const doc = docRef.current;

  // Create the provider ref to avoid recreating it on every render
  const providerRef = React.useRef<YjsProvider>(new YjsProvider(doc));
  const provider = providerRef.current;

  // Get the shared array from the document (only once during initialization)
  const itemsArrayRef = React.useRef(doc.getArray<SyncItem>(EXPERIMENTAL_KEY));
  const itemsArray = itemsArrayRef.current;

  // Update items when the YJS array changes
  useEffect(() => {
    const handleItemsChange = () => {
      const newItems = itemsArray.toArray();
      setListItems(newItems);
    };

    itemsArray.observe(handleItemsChange);
    // Initialize with current values
    handleItemsChange();

    return () => {
      itemsArray.unobserve(handleItemsChange);
    };
  }, [itemsArray]);

  const handleAddItem = () => {
    const newItem: SyncItem = {
      id: Date.now().toString(),
      name: `Item ${listItems.length + 1}`,
    };

    doc.transact(() => {
      itemsArray.push([newItem]);
    }, 'local');
  };

  const handleDeleteItem = (id: string) => {
    doc.transact(() => {
      const index = itemsArray
        .toArray()
        .findIndex((item: SyncItem) => item.id === id);
      if (index !== -1) {
        itemsArray.delete(index, 1);
      }
    }, 'local');
  };

  const handleEditItem = (id: string, currentValue: string) => {
    setEditItemId(id);
    setEditItemValue(currentValue);
  };

  const handleSaveEdit = () => {
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
  };

  const handleCancelEdit = () => {
    setEditItemId(null);
    setEditItemValue('');
  };

  const handlePull = async () => {
    setLoading(true);
    try {
      const result = await userStorageGetAllItems(EXPERIMENTAL_KEY);
      setRawItems(result);
      const rawUpdates = result.map(hexToBytes);
      provider.processUpdates(rawUpdates);
    } catch (e) {
      console.error('Error fetching items:', e);
    } finally {
      setLoading(false);
    }
  };

  const handlePush = async () => {
    const entries = provider.pendingUpdates.map((update) => {
      const key = bytesToHex(sha256(update));
      const value = bytesToHex(update);
      return [key, value];
    });
    const itemsToPush: Record<string, string> = Object.fromEntries(entries);
    setLoading(true);
    try {
      await userStorageSetItems(EXPERIMENTAL_KEY, itemsToPush);
    } catch (e) {
      console.error('Error pushing items:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllEntries = async () => {
    setLoading(true);
    try {
      const result = await userStorageGetAllItems(EXPERIMENTAL_KEY);
      setRawItems(result);
    } catch (e) {
      console.error('Error fetching items:', e);
    } finally {
      setLoading(false);
    }
  };

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
