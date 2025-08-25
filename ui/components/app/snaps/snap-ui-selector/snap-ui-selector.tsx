import React, {
  useState,
  useEffect,
  MouseEvent as ReactMouseEvent,
  CSSProperties,
} from 'react';
import classnames from 'classnames';
import { State } from '@metamask/snaps-sdk';
import { isObject } from '@metamask/utils';
import {
  Box,
  ButtonBase,
  HelpText,
  HelpTextSeverity,
  IconName,
  IconSize,
  Label,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
} from '../../../component-library';
import {
  BackgroundColor,
  BlockSize,
  BorderRadius,
  Display,
  FlexDirection,
  IconColor,
  TextAlign,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { useSnapInterfaceContext } from '../../../../contexts/snaps';

export type SnapUISelectorProps = {
  className?: string;
  name: string;
  title: string;
  options: { key?: string; value: State; disabled: boolean }[];
  optionComponents: React.ReactNode[];
  form?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  onSelect?: (value: State) => void;
  style?: CSSProperties;
  itemStyle?: CSSProperties;
};

type SelectorItemProps = {
  className?: string;
  value: State;
  children: React.ReactNode;
  disabled?: boolean;
  selected: boolean;
  onSelect: (value: State) => void;
  style?: CSSProperties;
};

const SelectorItem: React.FunctionComponent<SelectorItemProps> = ({
  className,
  value,
  children,
  selected,
  onSelect,
  disabled,
  style,
}) => {
  const handleClick = () => {
    onSelect(value);
  };

  return (
    <ButtonBase
      className={
        className
          ? classnames('snap-ui-renderer__selector-item', className)
          : 'snap-ui-renderer__selector-item'
      }
      data-testid="snap-ui-renderer__selector-item"
      backgroundColor={
        selected ? BackgroundColor.primaryMuted : BackgroundColor.transparent
      }
      borderRadius={BorderRadius.LG}
      paddingTop={2}
      paddingBottom={2}
      paddingRight={4}
      paddingLeft={4}
      ellipsis
      textProps={{
        display: Display.Flex,
        width: BlockSize.Full,
      }}
      onClick={handleClick}
      style={{
        justifyContent: 'inherit',
        textAlign: 'inherit',
        height: 'inherit',
        minHeight: '48px',
        maxHeight: '58px',
        position: 'relative',
        ...style,
      }}
      disabled={disabled}
    >
      {children}
      {selected && (
        <Box
          borderRadius={BorderRadius.pill}
          backgroundColor={BackgroundColor.primaryDefault}
          marginRight={3}
          style={{
            position: 'absolute',
            height: 'calc(100% - 8px)',
            width: '4px',
            top: '4px',
            left: '4px',
          }}
        />
      )}
    </ButtonBase>
  );
};

export const SnapUISelector: React.FunctionComponent<SnapUISelectorProps> = ({
  className,
  name,
  title,
  options,
  optionComponents,
  form,
  label,
  error,
  disabled,
  onSelect,
  style,
  itemStyle,
}) => {
  const { handleInputChange, getValue } = useSnapInterfaceContext();

  const initialValue = getValue(name, form);

  const [selectedOptionValue, setSelectedOption] = useState(initialValue);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (initialValue !== undefined && initialValue !== null) {
      setSelectedOption(initialValue);
      onSelect?.(initialValue);
    }
  }, [initialValue]);

  const handleModalOpen = (event: ReactMouseEvent<HTMLElement>) => {
    event.preventDefault();
    setIsModalOpen(true);
  };

  const handleModalClose = () => setIsModalOpen(false);

  const handleSelect = (value: State) => {
    setSelectedOption(value);
    onSelect?.(value);
    handleInputChange(name, value, form);
    handleModalClose();
  };

  /**
   * Find the index of the selected option in the options array.
   * If the option is an object, use the provided key to compare the values.
   * If the option is a primitive, compare the values directly.
   */
  const selectedOptionIndex = options.findIndex((option) =>
    option.key && isObject(option.value)
      ? option.value[option.key as keyof typeof option.value] ===
        selectedOptionValue?.[option.key as keyof typeof selectedOptionValue]
      : option.value === selectedOptionValue,
  );

  const selectedOption = optionComponents[selectedOptionIndex];

  return (
    <>
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        style={{
          overflow: 'hidden',
        }}
        className={classnames({
          'snap-ui-renderer__field': label !== undefined,
        })}
      >
        {label && <Label htmlFor={name}>{label}</Label>}
        <ButtonBase
          className={
            className
              ? classnames('snap-ui-renderer__selector', className)
              : 'snap-ui-renderer__selector'
          }
          backgroundColor={BackgroundColor.backgroundDefault}
          borderRadius={BorderRadius.LG}
          paddingTop={2}
          paddingBottom={2}
          paddingRight={4}
          paddingLeft={4}
          ellipsis
          textProps={{
            display: Display.Flex,
            width: BlockSize.Full,
          }}
          disabled={disabled}
          endIconName={IconName.ArrowDown}
          endIconProps={{
            color: IconColor.primaryDefault,
            size: IconSize.Sm,
          }}
          gap={2}
          onClick={handleModalOpen}
          style={{
            justifyContent: 'inherit',
            textAlign: 'inherit',
            height: 'inherit',
            minHeight: '48px',
            maxHeight: '58px',
            ...style,
          }}
        >
          {selectedOption}
        </ButtonBase>
        {error && (
          <HelpText severity={HelpTextSeverity.Danger} marginTop={1}>
            {error}
          </HelpText>
        )}
      </Box>
      <Modal isOpen={isModalOpen} onClose={handleModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader onClose={handleModalClose}>
            <Text
              variant={TextVariant.headingSm}
              textAlign={TextAlign.Center}
              ellipsis
            >
              {title}
            </Text>
          </ModalHeader>
          <ModalBody>
            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Column}
              gap={2}
            >
              {optionComponents.map((component, index) => (
                <SelectorItem
                  className={className && `${className}-item`}
                  value={options[index].value}
                  disabled={options[index]?.disabled}
                  onSelect={handleSelect}
                  selected={index === selectedOptionIndex}
                  key={index}
                  style={itemStyle}
                >
                  {component}
                </SelectorItem>
              ))}
            </Box>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};
