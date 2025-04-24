import React, { useEffect, useCallback } from 'react';
import { Map as YMap, Doc, YMapEvent } from 'yjs';
import {
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
  Text,
  TextField,
  TextFieldSize,
  Icon,
  IconName,
  IconSize,
} from '../../../components/component-library';
import {
  Display,
  FlexDirection,
  AlignItems,
  JustifyContent,
  TextColor,
  BackgroundColor,
  BorderColor,
  IconColor,
  BorderRadius,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { userStorageGetAllItems } from '../../../store/actions';
import { YjsProvider } from './yjs.provider';
import { YjsIndexedDBProvider } from './yjs.indexeddb.provider';

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
  const [experimentalKey, setExperimentalKey] =
    React.useState<string>('test-items-120');
  const [isEditingKey, setIsEditingKey] = React.useState<boolean>(false);
  const [tempExperimentalKey, setTempExperimentalKey] =
    React.useState<string>('test-items-120');

  // Create the doc and providers directly
  const doc = React.useMemo<Doc>(() => new Doc(), []);

  const remoteProvider = React.useMemo<YjsProvider>(
    () => new YjsProvider(doc, experimentalKey),
    [doc, experimentalKey],
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const localProvider = React.useMemo<YjsIndexedDBProvider>(
    () => new YjsIndexedDBProvider(doc, experimentalKey),
    [doc, experimentalKey],
  );

  // Get the shared map from the document (only once during initialization)
  const itemsMap = React.useMemo<YMap<SyncItem>>(
    () => doc.getMap<SyncItem>(experimentalKey),
    [doc, experimentalKey],
  );

  const handleItemsChange = useCallback(
    (event?: YMapEvent<SyncItem>) => {
      event?.changes.keys.forEach((change, key) => {
        const ymap = event.target as YMap<SyncItem>;
        if (change.action === 'add') {
          console.log(
            `GIGEL Property "${key}" was added. Initial value: "${
              ymap.get(key)?.name
            }".`,
          );
        } else if (change.action === 'update') {
          console.log(
            `GIGEL Property "${key}" was updated. New value: "${
              ymap.get(key)?.name
            }". Previous value: "${change.oldValue?.name}".`,
          );
        } else if (change.action === 'delete') {
          console.log(
            `GIGEL Property "${key}" was deleted. Previous value: "${change.oldValue?.name}".`,
          );
        }
      });

      const newItems: SyncItem[] = [];
      itemsMap.forEach((value) => {
        newItems.push(value);
      });
      setListItems(newItems);
    },
    [itemsMap],
  );

  // Update items when the YJS map changes
  useEffect(() => {
    itemsMap.observe(handleItemsChange);
    return () => {
      itemsMap.unobserve(handleItemsChange);
    };
  }, [itemsMap, handleItemsChange]);

  // Reset UI state when experimental key changes
  useEffect(() => {
    setListItems([]);
    setRawItems([]);
    setEditItemId(null);
    setEditItemValue('');

    // Trigger initial load of items from the map
    handleItemsChange();
  }, [experimentalKey, handleItemsChange]);

  // Memoize handlers to prevent unnecessary recreations
  const handlePull = useCallback(async () => {
    setLoading(true);
    try {
      const updates = await remoteProvider.handlePull();
      setRawItems(updates);
    } catch (e) {
      console.error('Error fetching items:', e);
    } finally {
      setLoading(false);
    }
  }, [remoteProvider]);

  const handlePush = useCallback(async () => {
    setLoading(true);
    try {
      await remoteProvider.handlePush();
    } catch (e) {
      console.error('Error pushing items:', e);
    } finally {
      setLoading(false);
    }
  }, [remoteProvider]);

  const fetchAllEntries = useCallback(async () => {
    setLoading(true);
    try {
      const result = await userStorageGetAllItems(experimentalKey);
      setRawItems(result);
    } catch (e) {
      console.error('Error fetching items:', e);
    } finally {
      setLoading(false);
    }
  }, [experimentalKey]);

  const handleAddItem = useCallback(() => {
    const id = Date.now().toString();
    const newItem: SyncItem = {
      id,
      name: `Item ${listItems.length + 1}`,
    };

    // Use a single transaction for all changes
    doc.transact(() => {
      itemsMap.set(id, newItem);
    }, 'local');
  }, [doc, itemsMap, listItems.length]);

  const handleDeleteItem = useCallback(
    (id: string) => {
      doc.transact(() => {
        itemsMap.delete(id);
      }, 'local');
    },
    [doc, itemsMap],
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
      const currentItem = itemsMap.get(editItemId);
      if (currentItem) {
        const updatedItem = { ...currentItem, name: editItemValue };
        itemsMap.set(editItemId, updatedItem);
      }
    }, 'local');

    setEditItemId(null);
    setEditItemValue('');
  }, [doc, itemsMap, editItemId, editItemValue]);

  const handleCancelEdit = useCallback(() => {
    setEditItemId(null);
    setEditItemValue('');
  }, []);

  const handleStartEditingKey = useCallback(() => {
    setTempExperimentalKey(experimentalKey);
    setIsEditingKey(true);
  }, [experimentalKey]);

  const handleSaveKey = useCallback(() => {
    setExperimentalKey(tempExperimentalKey);
    setIsEditingKey(false);
  }, [tempExperimentalKey]);

  const handleCancelEditKey = useCallback(() => {
    setTempExperimentalKey(experimentalKey);
    setIsEditingKey(false);
  }, [experimentalKey]);

  return (
    <Box padding={4}>
      <Box display={Display.Flex} flexDirection={FlexDirection.Column} gap={4}>
        <Box>
          <Text variant={TextVariant.headingLg}>Sync Debug Page</Text>
          <Text variant={TextVariant.bodyMd} color={TextColor.textAlternative}>
            This is a debugging page for sync functionality.
          </Text>
        </Box>

        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          gap={2}
          backgroundColor={BackgroundColor.backgroundAlternative}
          padding={4}
          borderRadius={BorderRadius.MD}
        >
          <Box
            display={Display.Flex}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.spaceBetween}
          >
            <Text variant={TextVariant.bodyMd} color={TextColor.textDefault}>
              User-storage feature name:
            </Text>
            {isEditingKey ? (
              <Box display={Display.Flex} gap={2}>
                <Button
                  variant={ButtonVariant.Secondary}
                  size={ButtonSize.Sm}
                  onClick={handleSaveKey}
                >
                  Save
                </Button>
                <Button
                  variant={ButtonVariant.Secondary}
                  size={ButtonSize.Sm}
                  onClick={handleCancelEditKey}
                >
                  Cancel
                </Button>
              </Box>
            ) : (
              <Button
                variant={ButtonVariant.Secondary}
                size={ButtonSize.Sm}
                onClick={handleStartEditingKey}
              >
                Edit
              </Button>
            )}
          </Box>

          {isEditingKey ? (
            <TextField
              value={tempExperimentalKey}
              onChange={(e) => setTempExperimentalKey(e.target.value)}
              size={TextFieldSize.Md}
              autoFocus
              placeholder="Enter namespace key"
            />
          ) : (
            <Box
              backgroundColor={BackgroundColor.backgroundDefault}
              padding={2}
              borderRadius={BorderRadius.SM}
            >
              <Text variant={TextVariant.bodyMd}>{experimentalKey}</Text>
            </Box>
          )}

          <Text variant={TextVariant.bodyXs} color={TextColor.textAlternative}>
            Note: Changing the key will load a different shared document.
          </Text>
        </Box>

        <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
          {listItems.length === 0 ? (
            <Box
              backgroundColor={BackgroundColor.backgroundAlternative}
              borderRadius={BorderRadius.MD}
            >
              <Text variant={TextVariant.bodyMd}>
                No items. Add an item to get started.
              </Text>
            </Box>
          ) : (
            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Column}
              borderColor={BorderColor.borderMuted}
              borderRadius={BorderRadius.MD}
            >
              {listItems.map((item) => (
                <Box
                  key={item.id}
                  borderRadius={BorderRadius.SM}
                  borderColor={BorderColor.borderMuted}
                  backgroundColor={BackgroundColor.backgroundDefault}
                >
                  {editItemId === item.id ? (
                    <Box
                      display={Display.Flex}
                      flexDirection={FlexDirection.Column}
                    >
                      <TextField
                        size={TextFieldSize.Md}
                        value={editItemValue}
                        onChange={(e) => setEditItemValue(e.target.value)}
                        autoFocus
                      />
                      <Box display={Display.Flex} gap={2}>
                        <Button size={ButtonSize.Sm} onClick={handleSaveEdit}>
                          Save
                        </Button>
                        <Button
                          variant={ButtonVariant.Secondary}
                          size={ButtonSize.Sm}
                          onClick={handleCancelEdit}
                        >
                          Cancel
                        </Button>
                      </Box>
                    </Box>
                  ) : (
                    <Box
                      display={Display.Flex}
                      justifyContent={JustifyContent.spaceBetween}
                      alignItems={AlignItems.center}
                    >
                      <Text variant={TextVariant.bodyMd}>{item.name}</Text>
                      <Box display={Display.Flex} gap={2}>
                        <Button
                          variant={ButtonVariant.Secondary}
                          size={ButtonSize.Sm}
                          onClick={() => handleEditItem(item.id, item.name)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant={ButtonVariant.Secondary}
                          size={ButtonSize.Sm}
                          danger
                          onClick={() => handleDeleteItem(item.id)}
                        >
                          Delete
                        </Button>
                      </Box>
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
          )}

          <Box>
            <Button variant={ButtonVariant.Primary} onClick={handleAddItem}>
              Add Item
            </Button>
          </Box>
        </Box>

        <Box display={Display.Flex} gap={2}>
          <Button
            variant={ButtonVariant.Secondary}
            size={ButtonSize.Md}
            onClick={fetchAllEntries}
          >
            Load raw data
          </Button>
          <Button
            variant={ButtonVariant.Secondary}
            size={ButtonSize.Md}
            onClick={handlePull}
          >
            Pull
          </Button>
          <Button
            variant={ButtonVariant.Secondary}
            size={ButtonSize.Md}
            onClick={handlePush}
          >
            Push
          </Button>
          <Button
            variant={ButtonVariant.Secondary}
            danger
            size={ButtonSize.Md}
            onClick={() => {
              doc.transact(() => {
                itemsMap.clear();
              }, 'local');
            }}
          >
            Clear All Items
          </Button>
        </Box>

        {loading && (
          <Box display={Display.Flex} alignItems={AlignItems.center} gap={2}>
            <Icon
              name={IconName.Loading}
              size={IconSize.Sm}
              color={IconColor.iconDefault}
            />
            <Text
              variant={TextVariant.bodyMd}
              color={TextColor.textAlternative}
            >
              Loading...
            </Text>
          </Box>
        )}

        {rawItems && rawItems.length > 0 && (
          <Box borderRadius={BorderRadius.MD}>
            <Text variant={TextVariant.bodyMd}>
              Raw data from user storage:
            </Text>
            <Box
              as="pre"
              style={{ overflow: 'auto' }}
              backgroundColor={BackgroundColor.backgroundAlternative}
            >
              <Text variant={TextVariant.bodyXs} as="code">
                {JSON.stringify(rawItems, null, 2)}
              </Text>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};
