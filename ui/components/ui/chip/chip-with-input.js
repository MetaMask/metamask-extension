import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { COLORS } from '../../../helpers/constants/design-system';
import Chip from '.';

export function ChipWithInput({
  dataTestId,
  className,
  borderColor = COLORS.BORDER_DEFAULT,
  inputValue,
  setInputValue,
}) {
  return (
    <Chip
      className={classnames(className, 'chip--with-input')}
      borderColor={borderColor}
    >
      {setInputValue && (
        <input
          data-testid={dataTestId}
          type="text"
          className="chip__input"
          onChange={(e) => {
            setInputValue(e.target.value);
          }}
          value={inputValue}
        />
      )}
    </Chip>
  );
}

ChipWithInput.propTypes = {
  dataTestId: PropTypes.string,
  borderColor: PropTypes.oneOf(Object.values(COLORS)),
  className: PropTypes.string,
  inputValue: PropTypes.string,
  setInputValue: PropTypes.func,
};
