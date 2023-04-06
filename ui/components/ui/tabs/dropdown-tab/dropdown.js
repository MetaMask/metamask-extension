import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Box from '../../../../../development/ts-migration-dashboard/app/components/Box';
import { ICON_NAMES, ICON_SIZES, Icon, Text } from '../../../component-library';

export const Dropdown = ({
  className,
  disabled = false,
  onChange,
  options,
  selectedOption,
  style,
  title,
  'data-testid': dataTestId,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(selectedOption);

  const open = () => setIsOpen(!isOpen);
  const handleChange = useCallback(
    (option) => {
      setSelected(option.name);
      onChange(option.value);
      setIsOpen(false);
    },
    [onChange],
  );
  return (
    <Box className={classnames('dropdown', className)} style={style}>
      <Box onClick={open} dataTestId={dataTestId}>
        <Text>{selected ?? title}</Text>
        <Icon name={ICON_NAMES.ARROW_DOWN} size={ICON_SIZES.SM} />
      </Box>
      {isOpen && (
        <Box>
          {options.map((option, i) => (
            <Text onClick={handleChange(option)} key={i}>
              {option.name}
            </Text>
          ))}
        </Box>
      )}
    </Box>
  );
};

Dropdown.propTypes = {
  /**
   * Additional css className to add to root of Dropdown component
   */
  className: PropTypes.string,
  /**
   * Disable dropdown by setting to true
   */
  disabled: PropTypes.bool,
  /**
   * Title of the dropdown
   */
  title: PropTypes.string,
  /**
   * On options change handler
   */
  onChange: PropTypes.func.isRequired,
  /**
   * Predefined options for component
   */
  options: PropTypes.arrayOf(
    PropTypes.exact({
      name: PropTypes.string,
      value: PropTypes.string.isRequired,
    }),
  ).isRequired,
  /**
   * Selected options of dropdown
   */
  selectedOption: PropTypes.string,
  /**
   * Add inline style for the component
   */
  style: PropTypes.object,
  /**
   * Unit testing test id
   */
  'data-testid': PropTypes.string,
};
