import { useVirtualizer, Virtualizer } from '@tanstack/react-virtual';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type FC,
  type MutableRefObject,
} from 'react';
import { Box } from '../components/component-library';

type Props<T> = {
  /**
   * List of items to render
   */
  items: T[];
  /**
   * Estimate the size of an item.
   * You can use the browser devtools to give you a size.
   */
  estimatedSize: number;
  /**
   * Return the key for each item
   */
  getKey: (t: T) => string;

  /**
   * Override and use a custom scroll container if known
   */
  scrollRef?: MutableRefObject<HTMLElement>;

  /**
   * Starting Position in the list
   */
  startingIndex?: number;
};

type VirtualListProps<T> = {
  children: (item: T) => React.ReactNode;
};

/**
 * For virtualization with lists that don't have a defined container (e.g. we want the window to scroll)
 * We need to target the closest parent that has this scroll container.
 * Extension View and Full Screen View utilize different scroll containers
 *
 * @param node - node of where our list is located.
 * @returns the nearest scroll parent.
 */
function getScrollParent(node: HTMLElement | null): HTMLElement | null {
  if (node === null) {
    return null;
  }

  if (node.scrollHeight > node.clientHeight) {
    return node;
  }
  return getScrollParent(node.parentElement);
}

const useInitializeScrollContainerEffect = (props: {
  virtualizer: Virtualizer<HTMLElement, Element>;
  listRef: MutableRefObject<HTMLDivElement | null>;
  scrollParentRef: MutableRefObject<HTMLElement | null>;
  overrideScrollRef?: MutableRefObject<HTMLElement | null>;
  startingIndex?: number;
}) => {
  const { virtualizer, listRef, scrollParentRef, overrideScrollRef } = props;

  const isOverriding = overrideScrollRef?.current;

  // Effect - Initializing the scroll container
  useEffect(() => {
    if (isOverriding) {
      return;
    }

    if (listRef.current) {
      const scrollParent = getScrollParent(listRef.current);
      scrollParentRef.current = scrollParent;
    }
  }, [isOverriding, listRef, scrollParentRef]);

  // Effect - Remeasure Virtual Container
  // TODO - this effect might not be necessary.
  useEffect(() => {
    if (isOverriding) {
      return;
    }

    if (scrollParentRef.current) {
      virtualizer.measure();
    }
  }, [isOverriding, scrollParentRef, virtualizer]);
};

export const useVirtualList = <T,>(props: Props<T>) => {
  const listRef = useRef<HTMLDivElement | null>(null);
  const scrollParentRef = useRef<HTMLElement | null>(null);
  const virtualizer = useVirtualizer({
    count: props.items.length,
    overscan: 5,
    estimateSize: () => props.estimatedSize,
    getScrollElement: () => props.scrollRef?.current ?? scrollParentRef.current,
    scrollMargin: listRef.current?.offsetTop ?? 0,
    getItemKey: (idx) => props.getKey(props.items[idx]),
    initialOffset: props.startingIndex
      ? props.startingIndex * props.estimatedSize
      : 0,
  });

  useInitializeScrollContainerEffect({
    listRef,
    scrollParentRef,
    virtualizer,
    overrideScrollRef: props.scrollRef,
  });

  const listSize = props.items.length;

  const { getVirtualItems } = virtualizer;

  // TODO - see if this is necessary
  const containerStyle = useMemo(
    () => ({ minHeight: `${props.estimatedSize}px` } as const),
    [props.estimatedSize],
  );

  const virtualContainerStyle = useMemo(() => {
    const height = listSize ? virtualizer.getTotalSize() : 0;
    return {
      height: `${height}px`,
      width: '100%',
      position: 'relative',
    } as const;
  }, [virtualizer, listSize]);

  const virtualItemStyle = useCallback(
    (virtualItem) =>
      ({
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: `${virtualItem.size}px`,
        transform: `translateY(${
          virtualItem.start - virtualizer.options.scrollMargin
        }px)`,
      } as const),
    [virtualizer.options.scrollMargin],
  );

  const VirtualList: FC<VirtualListProps<T>> = useCallback(
    (virtualListProps) => (
      // Container
      <Box ref={props.scrollRef ? undefined : listRef} style={containerStyle}>
        {/* Virtual Container */}
        <Box style={virtualContainerStyle}>
          {getVirtualItems().map((virtualItem) => {
            const actualItem = props.items[virtualItem.index] ?? undefined;
            if (!actualItem) {
              return null;
            }

            return (
              <Box
                key={virtualItem.key.toString()}
                data-index={virtualItem.index}
                style={virtualItemStyle(virtualItem)}
              >
                {virtualListProps.children(actualItem)}
              </Box>
            );
          })}
        </Box>
      </Box>
    ),
    [
      containerStyle,
      getVirtualItems,
      props.items,
      props.scrollRef,
      virtualContainerStyle,
      virtualItemStyle,
    ],
  );

  return { VirtualList, virtualizer };
};
