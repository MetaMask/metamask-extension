import React, { useState, useEffect } from 'react';
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
  name: string;
  title: string;
  options: string[];
  optionComponents: React.ReactNode[];
  form?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
};

type SelectorItemProps = {
  value: string;
  children: React.ReactNode;
  onSelect: (value: string) => void;
};

const SelectorItem: React.FunctionComponent<SelectorItemProps> = ({
  value,
  children,
  onSelect,
}) => {
  const handleClick = () => {
    onSelect(value);
  };

  return (
    <ButtonBase
      className="snap-ui-renderer__selector-item"
      backgroundColor={BackgroundColor.transparent}
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
        minHeight: '32px',
        maxHeight: '64px',
      }}
    >
      {children}
    </ButtonBase>
  );
};

export const SnapUISelector: React.FunctionComponent<SnapUISelectorProps> = ({
  name,
  title,
  options,
  optionComponents,
  form,
  label,
  error,
  disabled,
}) => {
  const { handleInputChange, getValue } = useSnapInterfaceContext();

  const initialValue = getValue(name, form) as string;

  const [selectedOptionValue, setSelectedOption] = useState(initialValue);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (initialValue) {
      setSelectedOption(initialValue);
    }
  }, [initialValue]);

  const handleModalOpen = () => setIsModalOpen(true);

  const handleModalClose = () => setIsModalOpen(false);

  const handleSelect = (value: string) => {
    setSelectedOption(value);
    handleInputChange(name, value, form);
    handleModalClose();
  };

  const selectedOptionIndex = options.findIndex(
    (option) => option === selectedOptionValue,
  );

  const selectedOption = optionComponents[selectedOptionIndex];

  return (
    <>
      <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
        {label && <Label htmlFor={name}>{label}</Label>}
        <ButtonBase
          className="snap-ui-renderer__selector"
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
            minHeight: '32px',
            maxHeight: '64px',
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
                <SelectorItem value={options[index]} onSelect={handleSelect}>
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
