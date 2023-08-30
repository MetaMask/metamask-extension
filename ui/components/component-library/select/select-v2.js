import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  BackgroundColor,
  BorderColor,
  Display,
  AlignItems,
  BorderRadius,
  TextVariant,
} from '../../../helpers/constants/design-system';
import {
  Box,
  Popover,
  Icon,
  IconName,
  IconSize,
  AvatarAccount,
  AvatarAccountSize,
  Text,
} from '..';

/* -------------------------------------------------------------------------------------------------
 * SelectContext
 * -----------------------------------------------------------------------------------------------*/

const SelectContext = createContext();

export const SelectProvider = ({ children }) => {
  // Create a state to store the selected option
  const [selectedOption, setSelectedOption] = useState(null);

  const updateSelectedOption = (option) => {
    setSelectedOption(option);
  };

  // Create a state to store the Popover open/close state
  const [isOpen, setIsOpen] = useState(false);

  const updateSelectMenuOpenState = (isOpen) => {
    setIsOpen(isOpen);
  };

  // Create a state to store the Popover ref
  const [referenceElement, setReferenceElement] = useState();

  const updateSelectTriggerRef = (ref) => {
    setReferenceElement(ref);
  };

  return (
    <SelectContext.Provider
      value={{
        selectedOption,
        updateSelectedOption,
        isOpen,
        updateSelectMenuOpenState,
        referenceElement,
        updateSelectTriggerRef,
      }}
    >
      {children}
    </SelectContext.Provider>
  );
};

const useSelectContext = () => useContext(SelectContext);

/* -------------------------------------------------------------------------------------------------
 * SelectButton
 * -----------------------------------------------------------------------------------------------*/

const SelectButton = React.forwardRef(
  (
    {
      label,
      description,
      children,
      onClick,
      startAccessory,
      endAccessory,
      ...props
    },
    ref,
  ) => {
    return (
      <Box
        ref={ref}
        onClick={onClick}
        as="button"
        display={Display.Flex}
        gap={2}
        padding={2}
        backgroundColor={BackgroundColor.transparent}
        borderColor={BorderColor.borderDefault}
        borderRadius={BorderRadius.MD}
        alignItems={AlignItems.center}
        {...props}
      >
        {startAccessory && <>{startAccessory}</>}
        {label && <Text ellipsis>{label}</Text>}
        {description && <Text ellipsis>{description}</Text>}
        {children && <>children</>}
        {endAccessory && <>{endAccessory}</>}
        <Icon name={IconName.ArrowDown} size={IconSize.Sm} />
      </Box>
    );
  },
);

/* -------------------------------------------------------------------------------------------------
 * SelectOption
 * -----------------------------------------------------------------------------------------------*/

const SelectOption = ({ value, children, isDisabled, onClick, ...props }) => {
  const { updateSelectedOption, updateSelectMenuOpenState } =
    useSelectContext(); // Use the context to update the selected option

  const handleOnClick = () => {
    onClick?.(value);
    updateSelectedOption(value);
    updateSelectMenuOpenState(false);
  };

  return (
    <Text
      as="div"
      onClick={handleOnClick}
      role="option"
      tabIndex={isDisabled ? undefined : -1}
      {...props}
    >
      {children}
    </Text>
  );
};

/* -------------------------------------------------------------------------------------------------
 * SelectWrapper
 * -----------------------------------------------------------------------------------------------*/

const SelectWrapper = ({ TriggerComponent, children, placeholder }) => {
  const {
    selectedOption,
    isOpen,
    referenceElement,
    updateSelectMenuOpenState,
    updateSelectTriggerRef,
  } = useSelectContext(); // Use the context to get the selected option

  const handleClick = () => {
    updateSelectMenuOpenState(!isOpen);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      updateSelectMenuOpenState(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  const setBoxRef = (ref) => {
    updateSelectTriggerRef(ref);
  };

  return (
    <span>
      <TriggerComponent
        ref={setBoxRef}
        onClick={handleClick}
        label={selectedOption?.label || placeholder}
        {...selectedOption}
      />
      <Popover referenceElement={referenceElement} isOpen={isOpen} matchWidth>
        {children}
      </Popover>
    </span>
  );
};

export const SelectV2 = () => {
  return (
    <>
      {`SelectV2 accepts the trigger component as a node triggerComponent=
      {<SelectButton />}`}
      <br />
      <br />
      <SelectProvider>
        <SelectWrapper
          TriggerComponent={SelectButton}
          triggerComponent={<SelectButton />}
          placeholder="Select an option"
        >
          <SelectOption
            value={{
              value: 'account-1',
              label: 'Account 1',
              startAccessory: (
                <AvatarAccount
                  size={AvatarAccountSize.Sm}
                  address="0x12931904asdf278wafaw4102934"
                />
              ),
            }}
          >
            Account 1
          </SelectOption>
          <SelectOption
            value={{
              value: 'account-2',
              label: 'Account 2',
              startAccessory: (
                <AvatarAccount
                  size={AvatarAccountSize.Sm}
                  address="0x129awf31904278asdfasdf4102934"
                />
              ),
            }}
          >
            Account 2
          </SelectOption>
          <SelectOption
            value={{
              value: 'account-3',
              label: 'Account 3',
              startAccessory: (
                <AvatarAccount
                  size={AvatarAccountSize.Sm}
                  address="0x1asdf29awfawf31904278asdfasdf4102934"
                />
              ),
            }}
            display={Display.Flex}
            gap={2}
          >
            <AvatarAccount
              size={AvatarAccountSize.Sm}
              address="0x1asdf29awfawf31904278asdfasdf4102934"
            />
            <span>
              <Text variant={TextVariant.bodyLgMedium}>Account 3</Text>
              <Text>0x1asdf29awfawf31904278asdfasdf4102934</Text>
            </span>
          </SelectOption>
        </SelectWrapper>
      </SelectProvider>
    </>
  );
};
