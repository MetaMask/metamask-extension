import React, {
  ReactNode,
  useCallback,
  useEffect,
  useId,
  useState,
} from 'react';
import classnames from 'clsx';
import {
  Box,
  ButtonBase,
  ButtonIcon,
  ButtonIconSize,
  IconColor,
  IconName,
  Label,
  Popover,
  PopoverPosition,
  PopoverRole,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import Tooltip from '../../ui/tooltip';

export enum DropdownEditorStyle {
  /** When open, the dropdown overlays elements that follow  */
  PopoverStyle,
  /** When open, the dropdown pushes down elements that follow */
  BoxStyle,
}

// A dropdown for selecting, adding, and deleting items.
export const DropdownEditor = <Item,>({
  title,
  placeholder,
  items,
  selectedItemIndex,
  addButtonText,
  error,
  style,
  onItemSelected,
  onItemDeleted,
  onItemAdd,
  onDropdownOpened,
  itemKey,
  itemIsDeletable = () => true,
  renderItem,
  renderTooltip,
  buttonDataTestId,
}: {
  title: string;
  placeholder: string;
  items?: Item[];
  selectedItemIndex?: number;
  addButtonText: string;
  error?: boolean;
  style: DropdownEditorStyle;
  onItemSelected: (index: number) => void;
  onItemDeleted: (deletedIndex: number, newSelectedIndex?: number) => void;
  onItemAdd: () => void;
  onDropdownOpened?: () => void;
  itemKey: (item: Item) => string;
  itemIsDeletable?: (item: Item, items: Item[]) => boolean;
  renderItem: (item: Item, isList: boolean) => string | ReactNode;
  renderTooltip: (item: Item, isList: boolean) => string | undefined;
  buttonDataTestId: string;
}) => {
  const t = useI18nContext();
  const [referenceElement, setReferenceElement] = useState<HTMLElement | null>(
    null,
  );
  const listboxId = useId();
  const setDropdownRef = useCallback((node: HTMLElement | null) => {
    setReferenceElement(node);
  }, []);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const renderDropdownList = () => (
    <Box id={listboxId} role="listbox" className="py-2">
      {items?.map((item, index) => {
        const selectItem = () => {
          onItemSelected(index);
          setIsDropdownOpen(false);
        };
        const row = (
          <Box
            key={itemKey(item)}
            role="option"
            aria-selected={index === selectedItemIndex}
            tabIndex={0}
            onClick={selectItem}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                selectItem();
              }
            }}
            className={classnames(
              'relative flex cursor-pointer items-center justify-between px-4 hover:bg-hover',
              {
                'bg-primary-muted hover:bg-primary-muted':
                  index === selectedItemIndex,
              },
            )}
          >
            {index === selectedItemIndex && (
              <Box className="absolute left-1 top-1 h-[calc(100%-8px)] w-1 rounded-full bg-primary-default" />
            )}
            {renderItem(item, true)}
            {itemIsDeletable(item, items) && (
              <ButtonIcon
                className="ml-1"
                ariaLabel={t('delete')}
                size={ButtonIconSize.Sm}
                iconName={IconName.Trash}
                iconProps={{ color: IconColor.ErrorDefault }}
                data-testid={`delete-item-${index}`}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();

                  // Determine which item should be selected after deletion
                  let newSelectedIndex;
                  if (selectedItemIndex === undefined || items.length <= 1) {
                    newSelectedIndex = undefined;
                  } else if (index === selectedItemIndex) {
                    newSelectedIndex = 0;
                  } else if (index > selectedItemIndex) {
                    newSelectedIndex = selectedItemIndex;
                  } else if (index < selectedItemIndex) {
                    newSelectedIndex = selectedItemIndex - 1;
                  }

                  onItemDeleted(index, newSelectedIndex);
                }}
              />
            )}
          </Box>
        );

        const tooltip = renderTooltip(item, true);
        return tooltip ? (
          <Tooltip title={tooltip} position="bottom">
            {row}
          </Tooltip>
        ) : (
          row
        );
      })}

      <ButtonBase
        asChild
        onClick={onItemAdd}
        startIconName={IconName.Add}
        className="h-auto w-full justify-start rounded-none bg-transparent px-4 py-4 text-primary-default hover:bg-hover active:scale-100 active:bg-pressed"
      >
        <button type="button">{addButtonText}</button>
      </ButtonBase>
    </Box>
  );

  // Call back in a useEffect so it triggers after the opening has rendered
  useEffect(() => {
    if (isDropdownOpen) {
      onDropdownOpened?.();
    }
  }, [isDropdownOpen]);

  const selectedItem = items?.[selectedItemIndex ?? -1];
  const tooltip = selectedItem ? renderTooltip(selectedItem, false) : undefined;

  const box = (
    <ButtonBase
      type="button"
      onClick={() => {
        setIsDropdownOpen(!isDropdownOpen);
      }}
      aria-label={title}
      aria-controls={listboxId}
      aria-expanded={isDropdownOpen}
      aria-haspopup="listbox"
      className={classnames(
        'min-h-12 h-auto w-full justify-between rounded-lg border bg-muted px-4 text-left hover:bg-muted-hover active:scale-100 active:bg-muted-pressed',
        {
          'border-error-default': error,
          'border-default': !error && isDropdownOpen,
          'border-muted': !error && !isDropdownOpen,
        },
      )}
      ref={setDropdownRef}
      data-testid={buttonDataTestId}
      endIconName={isDropdownOpen ? IconName.ArrowUp : IconName.ArrowDown}
      endIconProps={{
        color: IconColor.IconDefault,
      }}
    >
      <Box className="min-w-0 flex-1">
        {selectedItem ? (
          renderItem(selectedItem, false)
        ) : (
          <Text
            asChild
            variant={TextVariant.BodyMd}
            color={TextColor.TextAlternative}
          >
            <span>{placeholder}</span>
          </Text>
        )}
      </Box>
    </ButtonBase>
  );

  return (
    <Box className="pt-4">
      <Label className="mb-1">{title}</Label>
      {tooltip ? (
        <Tooltip title={tooltip} position="bottom">
          {box}
        </Tooltip>
      ) : (
        box
      )}
      {style === DropdownEditorStyle.PopoverStyle ? (
        <Popover
          matchWidth
          className="z-[1] p-0"
          referenceElement={referenceElement}
          position={PopoverPosition.Bottom}
          role={PopoverRole.Dialog}
          isOpen={isDropdownOpen}
          offset={[0, 4]}
          onClickOutside={() => setIsDropdownOpen(false)}
          onPressEscKey={() => setIsDropdownOpen(false)}
        >
          {renderDropdownList()}
        </Popover>
      ) : (
        <Box
          className={classnames(
            'mt-2 overflow-hidden rounded-lg border border-muted',
            {
              hidden: !isDropdownOpen,
            },
          )}
        >
          {renderDropdownList()}
        </Box>
      )}
    </Box>
  );
};
