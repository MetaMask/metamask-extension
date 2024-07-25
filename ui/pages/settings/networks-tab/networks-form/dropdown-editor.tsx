import { on } from 'events';
import React, { ReactNode, useEffect, useRef, useState } from 'react';
import classnames from 'classnames';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  Icon,
  IconName,
  IconSize,
  Input,
  Label,
  Popover,
  PopoverPosition,
  Text,
} from '../../../../components/component-library';
import {
  AlignItems,
  BackgroundColor,
  BorderColor,
  BorderRadius,
  Display,
  IconColor,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';

export enum DropdownEditorStyle {
  /** When open, the dropdown overlays elements that follow  */
  Popover,
  /** When open, dropdown pushes down elements that follow */
  Box,
}

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
  renderItem: (item?: Item) => string | ReactNode;
}) => {
  const t = useI18nContext();
  const dropdown = useRef(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const content = () => (
    <Box>
      {items?.map((item, index) => (
        <Box
          alignItems={AlignItems.center}
          padding={4}
          display={Display.Flex}
          justifyContent={JustifyContent.spaceBetween}
          key={itemKey(item)}
          onClick={() => {
            onItemSelected(index);
            setIsDropdownOpen(false);
          }}
          className={classnames('networks-tab__item', {
            'networks-tab__item--selected': index === selectedItemIndex,
          })}
        >
          {index === selectedItemIndex && (
            <Box
              className="networks-tab__item-selected-pill"
              borderRadius={BorderRadius.pill}
              backgroundColor={BackgroundColor.primaryDefault}
            />
          )}
          {renderItem(item)}
          {itemIsDeletable(item, items) && (
            <ButtonIcon
              marginLeft={1}
              ariaLabel={t('delete')}
              size={ButtonIconSize.Sm}
              iconName={IconName.Trash}
              color={IconColor.errorDefault}
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
      ))}
      <Box
        onClick={onItemAdd}
        padding={4}
        display={Display.Flex}
        alignItems={AlignItems.center}
        className="networks-tab__item"
      >
        <Icon
          color={IconColor.primaryDefault}
          name={IconName.Add}
          size={IconSize.Sm}
          marginRight={2}
        />
        <Text
          as="button"
          backgroundColor={BackgroundColor.transparent}
          color={TextColor.primaryDefault}
          variant={TextVariant.bodySmMedium}
        >
          {addButtonText}
        </Text>
      </Box>
    </Box>
  );

  let borderColor = BorderColor.borderDefault;
  if (error) {
    borderColor = BorderColor.errorDefault;
  } else if (isDropdownOpen) {
    borderColor = BorderColor.primaryDefault;
  }

  // Call back in a useEffect so it triggers after the opening has rendered
  useEffect(() => {
    if (isDropdownOpen) {
      onDropdownOpened?.();
    }
  }, [isDropdownOpen]);

  return (
    <Box paddingTop={4}>
      <Label variant={TextVariant.bodyMdMedium}>{title}</Label>
      <Box
        onClick={() => {
          setIsDropdownOpen(!isDropdownOpen);
        }}
        className="networks-tab__item-dropdown"
        display={Display.Flex}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.spaceBetween}
        borderRadius={BorderRadius.LG}
        borderColor={borderColor}
        borderWidth={1}
        paddingTop={2}
        paddingBottom={2}
        paddingLeft={4}
        paddingRight={4}
        ref={dropdown}
      >
        {items?.[selectedItemIndex] ? (
          renderItem(items?.[selectedItemIndex])
        ) : (
          <Input
            className="networks-tab__item-placeholder"
            placeholder={placeholder}
            readOnly
            tabIndex={-1}
            marginTop={1}
            marginBottom={1}
          />
        )}
        <ButtonIcon
          marginLeft="auto"
          iconName={isDropdownOpen ? IconName.ArrowUp : IconName.ArrowDown}
          ariaLabel={title}
          size={ButtonIconSize.Sm}
        />
      </Box>
      {style == DropdownEditorStyle.Popover ? (
        <Popover
          paddingTop={items && items.length > 0 ? 2 : 0}
          paddingBottom={items && items.length > 0 ? 2 : 0}
          paddingLeft={0}
          matchWidth={true}
          paddingRight={0}
          className="networks-tab__item-popover"
          referenceElement={dropdown.current}
          position={PopoverPosition.Bottom}
          isOpen={isDropdownOpen}
          onClickOutside={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          {content()}
        </Popover>
      ) : (
        <Box
          marginTop={2}
          display={isDropdownOpen ? Display.Block : Display.None}
          borderColor={BorderColor.borderMuted}
          borderRadius={BorderRadius.LG}
        >
          {content()}
        </Box>
      )}
    </Box>
  );
};

export default DropdownEditor;
