import React, { useEffect, useCallback } from 'react';
import { Array as YArray, Doc } from 'yjs';
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
    <Box padding={4}>
      <Box display={Display.Flex} flexDirection={FlexDirection.Column} gap={4}>
        <Box>
          <Text variant={TextVariant.headingLg}>Sync Debug Page</Text>
          <Text variant={TextVariant.bodyMd} color={TextColor.textAlternative}>
            This is a debugging page for sync functionality.
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

        <Box display={Display.Flex}>
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
