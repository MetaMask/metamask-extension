import React, {
  ReactNode,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import classnames from 'clsx';
import {
  Box,
  ButtonBase,
  ButtonIcon,
  ButtonIconSize,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Label,
  Popover,
  PopoverPosition,
  PopoverRole,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import Tooltip from '../../ui/tooltip/tooltip';

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
  itemDataTestId,
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
  itemDataTestId?: (item: Item, index: number) => string | undefined;
  itemIsDeletable?: (item: Item, items: Item[]) => boolean;
  renderItem: (item: Item, isList: boolean) => string | ReactNode;
  renderTooltip: (item: Item, isList: boolean) => string | undefined;
  buttonDataTestId: string;
}) => {
  const t = useI18nContext();
  const dropdownRef = useRef<HTMLButtonElement>(null);
  // Captured on open (rather than via a callback ref on mount) so the popover
  // has a positioned reference without triggering a state update on mount.
  const [referenceElement, setReferenceElement] = useState<HTMLElement | null>(
    null,
  );
  const labelId = useId();
  const listboxId = useId();
  const selectedValueId = useId();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const closeDropdown = useCallback(() => setIsDropdownOpen(false), []);

  const renderDropdownList = () => (
    <Box
      id={listboxId}
      role="listbox"
      className="max-h-40 overflow-y-auto py-2"
    >
      {items?.map((item, index) => {
        const selectItem = () => {
          onItemSelected(index);
          setIsDropdownOpen(false);
        };
        const row = (
          <Box
            key={itemKey(item)}
            className={classnames(
              'relative flex items-center justify-between px-4 hover:bg-hover',
              {
                'bg-primary-muted hover:bg-primary-muted':
                  index === selectedItemIndex,
              },
            )}
          >
            {index === selectedItemIndex && (
              <Box className="absolute inset-y-1 left-1 w-1 rounded-full bg-primary-default" />
            )}
            <button
              type="button"
              role="option"
              aria-selected={index === selectedItemIndex}
              className="min-w-0 flex-1 text-left"
              data-testid={
                itemDataTestId?.(item, index) ??
                `dropdown-editor-option-${index}`
              }
              onClick={selectItem}
            >
              {renderItem(item, true)}
            </button>
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

      <button
        type="button"
        onClick={onItemAdd}
        className="flex h-auto w-full items-center justify-start gap-2 rounded-none bg-transparent px-4 py-4 text-primary-default hover:bg-hover active:bg-pressed"
      >
        <Icon
          name={IconName.Add}
          size={IconSize.Sm}
          color={IconColor.PrimaryDefault}
          aria-hidden
        />
        {addButtonText}
      </button>
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

  const trigger = (
    <ButtonBase
      type="button"
      onClick={() => {
        setReferenceElement(dropdownRef.current);
        setIsDropdownOpen((isOpen) => !isOpen);
      }}
      aria-labelledby={`${labelId} ${selectedValueId}`}
      aria-controls={listboxId}
      aria-expanded={isDropdownOpen}
      aria-haspopup="listbox"
      className={classnames(
        'min-h-12 h-auto w-full justify-between rounded-xl border bg-muted px-4 text-left hover:bg-muted-hover active:scale-100 active:bg-muted-pressed',
        {
          'border-error-default': error,
          'border-default': !error && isDropdownOpen,
          'border-muted': !error && !isDropdownOpen,
        },
      )}
      ref={dropdownRef}
      data-testid={buttonDataTestId}
      endIconName={isDropdownOpen ? IconName.ArrowUp : IconName.ArrowDown}
      endIconProps={{
        color: IconColor.IconDefault,
      }}
    >
      <Box id={selectedValueId} className="min-w-0 flex-1">
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
      <Label id={labelId} className="mb-1">
        {title}
      </Label>
      {tooltip ? (
        <Tooltip title={tooltip} position="bottom">
          {trigger}
        </Tooltip>
      ) : (
        trigger
      )}
      {style === DropdownEditorStyle.PopoverStyle ? (
        <Popover
          referenceElement={referenceElement}
          position={PopoverPosition.Bottom}
          role={PopoverRole.Dialog}
          matchWidth
          isOpen={isDropdownOpen}
          onClickOutside={closeDropdown}
          onPressEscKey={closeDropdown}
          className="z-10 rounded-xl p-0"
        >
          {renderDropdownList()}
        </Popover>
      ) : (
        <Box
          className={classnames(
            'mt-2 overflow-hidden rounded-xl border border-muted',
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
