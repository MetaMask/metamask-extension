import React, {
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxBorderColor,
  BoxJustifyContent,
  ButtonIcon,
  ButtonIconSize,
  FontWeight,
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
  const dropdownRef = useRef<HTMLDivElement>(null);
  // Captured on open (rather than via a callback ref on mount) so the popover
  // has a positioned reference without triggering a state update on mount.
  const [referenceElement, setReferenceElement] = useState<HTMLElement | null>(
    null,
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const closeDropdown = useCallback(() => setIsDropdownOpen(false), []);

  const renderDropdownList = () => (
    <Box>
      {items?.map((item, index) => {
        const isSelected = index === selectedItemIndex;
        const row = (
          <Box
            key={itemKey(item)}
            alignItems={BoxAlignItems.Center}
            justifyContent={BoxJustifyContent.Between}
            paddingHorizontal={4}
            backgroundColor={
              isSelected ? BoxBackgroundColor.PrimaryMuted : undefined
            }
            className={`relative flex cursor-pointer ${
              isSelected ? '' : 'hover:bg-hover'
            }`}
            onClick={() => {
              onItemSelected(index);
              closeDropdown();
            }}
          >
            {isSelected && (
              <Box
                backgroundColor={BoxBackgroundColor.PrimaryDefault}
                className="absolute inset-y-1 left-1 w-1 rounded-full"
              />
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
                onClick={(event: React.MouseEvent) => {
                  event.stopPropagation();

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
          <Tooltip key={itemKey(item)} title={tooltip} position="bottom">
            {row}
          </Tooltip>
        ) : (
          row
        );
      })}

      <Box
        alignItems={BoxAlignItems.Center}
        padding={4}
        className="flex cursor-pointer hover:bg-hover"
        onClick={onItemAdd}
      >
        <Icon
          color={IconColor.PrimaryDefault}
          name={IconName.Add}
          size={IconSize.Sm}
          className="mr-2"
        />
        <Text
          asChild
          color={TextColor.PrimaryDefault}
          variant={TextVariant.BodySm}
          fontWeight={FontWeight.Medium}
        >
          <button type="button" className="bg-transparent">
            {addButtonText}
          </button>
        </Text>
      </Box>
    </Box>
  );

  let borderColor: BoxBorderColor = BoxBorderColor.BorderMuted;
  if (error) {
    borderColor = BoxBorderColor.ErrorDefault;
  } else if (isDropdownOpen) {
    borderColor = BoxBorderColor.BorderDefault;
  }

  // Call back in a useEffect so it triggers after the opening has rendered
  useEffect(() => {
    if (isDropdownOpen) {
      onDropdownOpened?.();
    }
  }, [isDropdownOpen]);

  const selectedItem = items?.[selectedItemIndex ?? -1];
  const tooltip = selectedItem ? renderTooltip(selectedItem, false) : undefined;

  const trigger = (
    <Box
      ref={dropdownRef}
      alignItems={BoxAlignItems.Center}
      justifyContent={BoxJustifyContent.Between}
      backgroundColor={BoxBackgroundColor.BackgroundMuted}
      borderColor={borderColor}
      borderWidth={1}
      paddingHorizontal={4}
      className="flex min-h-12 cursor-pointer break-all rounded-xl transition-colors"
      onClick={() => {
        setReferenceElement(dropdownRef.current);
        setIsDropdownOpen((isOpen) => !isOpen);
      }}
    >
      {selectedItem ? (
        renderItem(selectedItem, false)
      ) : (
        <Text
          variant={TextVariant.BodyMd}
          color={TextColor.TextAlternative}
          className="select-none"
        >
          {placeholder}
        </Text>
      )}
      <ButtonIcon
        className="ml-auto"
        iconName={isDropdownOpen ? IconName.ArrowUp : IconName.ArrowDown}
        ariaLabel={title}
        size={ButtonIconSize.Md}
        data-testid={buttonDataTestId}
      />
    </Box>
  );

  return (
    <Box paddingTop={4}>
      <Label className="mb-1">{title}</Label>
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
          className={`z-10 rounded-xl px-0 ${
            items && items.length > 0 ? 'py-2' : 'py-0'
          }`}
        >
          {renderDropdownList()}
        </Popover>
      ) : (
        isDropdownOpen && (
          <Box
            marginTop={2}
            borderColor={BoxBorderColor.BorderMuted}
            borderWidth={1}
            className="overflow-hidden rounded-xl"
          >
            {renderDropdownList()}
          </Box>
        )
      )}
    </Box>
  );
};
