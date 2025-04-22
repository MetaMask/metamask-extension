import React, { useEffect } from 'react';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex, hexToBytes } from '@metamask/utils';
import { Doc, applyUpdate } from 'yjs';
import { Box } from '../../../components/component-library';
import {
  userStorageGetAllItems,
  userStorageSetItems,
} from '../../../store/actions';

const EXPERIMENTAL_KEY = 'test-items-115';

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
  const [items, setItems] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [inputValue, setInputValue] = React.useState<string>('');

  // Create the doc and provider directly
  const docRef = React.useRef<Doc>(new Doc());
  const doc = docRef.current;

  // Create the provider ref to avoid recreating it on every render
  const providerRef = React.useRef<YjsProvider>(new YjsProvider(doc));

  const provider = providerRef.current;

  // Get the shared text from the document (only once during initialization)
  const textRef = React.useRef(doc.getText(EXPERIMENTAL_KEY));
  const text = textRef.current;

  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const selStart = React.useRef<number | null>(null);
  const selEnd = React.useRef<number | null>(null);

  const handleBeforeInput = (e: InputEvent) => {
    const { inputType, data, target } = e;
    const tt = target as HTMLTextAreaElement;
    const start = tt?.selectionStart ?? 0;
    const end = tt?.selectionEnd ?? 0;
    // 1. Save current selection
    if (inputRef.current) {
      console.log(`GIGEL capturing inputRef selection ${start}, ${end}`);
      selStart.current = inputRef.current.selectionStart ?? start;
      selEnd.current = inputRef.current.selectionEnd ?? end;
    }

    console.log(`GIGEL beforeinput: ${inputType} "${data}" [${start}, ${end})`);
    doc.transact(() => {
      switch (inputType) {
        // --- Insertions ---
        case 'insertText':
        case 'insertCompositionText':
          if (start !== end) {
            text.delete(start, end - start);
            // `Replaced [${start}, ${end}) with "${data}"`;
          }
          text.insert(start, data);
          selStart.current += data?.length ?? 0;
          break;

        case 'insertFromPaste':
        case 'insertFromDrop':
          text.insert(start, data);
          selStart.current = start + (data?.length ?? 0);
          break;

        // --- Deletions ---
        case 'deleteContentBackward':
        case 'deleteContentForward':
        case 'deleteByCut':
        case 'deleteByDrag':
          text.delete(start, end - start);
          break;
        case 'historyUndo':
          // TODO
          break;
        case 'historyRedo':
          // TODO
          break;
        // --- Other editing commands (undo/redo, formatting, etc.) ---
        default:
          console.log(`GIGEL ${inputType} (no-op handler)`);
      }
    }, 'local');
    e.preventDefault();
  };

  useEffect(() => {
    const el = inputRef.current as unknown as HTMLTextAreaElement;
    console.log('GIGEL inputRef', el);
    if (!el) {
      return undefined;
    }

    el.addEventListener('beforeinput', handleBeforeInput);
    return () => el.removeEventListener('beforeinput', handleBeforeInput);
  }, []);

  // Update the inputValue when text changes
  useEffect(() => {
    const handleTextChange = () => {
      const newValue = text.toString();
      if (newValue !== inputValue) {
        console.log(
          `GIGEL updating inputValue from DOC, ref= ${inputRef.current} selection=${selStart}, ${selEnd}`,
        );
        setInputValue(newValue);
        if (inputRef.current && selStart.current !== null) {
          console.log('GIGEL updating selectionRange', selStart, selEnd);
          inputRef.current.setSelectionRange(selStart.current, null);
        }
      }
    };

    text.observe(handleTextChange);

    return () => {
      text.unobserve(handleTextChange);
    };
  }, [text, inputValue]);

  const handlePull = async () => {
    setLoading(true);
    try {
      const result = await userStorageGetAllItems(EXPERIMENTAL_KEY);
      setItems(result);
      const rawUpdates = result.map(hexToBytes);
      provider.processUpdates(rawUpdates);
    } catch (e) {
      console.error('GIGEL Error fetching items:', e);
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
      setItems(result);
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
            <textarea
              // type="text"
              className="settings-page__input"
              value={inputValue}
              // onBeforeInput={handleBeforeInput}
              placeholder="type something"
              ref={inputRef}
            />
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
          {items && (
            <div className="settings-page__content-description">
              <pre>{JSON.stringify(items, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    </Box>
  );
};
