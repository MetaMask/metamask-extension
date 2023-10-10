import React, { useState } from 'react'
import PropTypes from 'prop-types'
import CaretToggleDropdown from '../../../components/ui/caret-toggle-dropdown'
import ButtonGroup from '../../../components/ui/button-group'
import Button from '../../../components/ui/button'
import Tooltip from '../../../components/ui/tooltip'

export default function CaretDropdownWithButtons ({
  toggleText,
  prefixText,
}) {
  return (
    <div className="caret-dropdown-with-buttons">
      <CaretToggleDropdown text={toggleText}>
        <div className="caret-dropdown-with-buttons__dropdown-content">
          <div className="caret-dropdown-with-buttons__buttons-prefix">
            <div className="caret-dropdown-with-buttons__prefix-text">{prefixText}</div>
            <Tooltip
              interactive
              position="top"
              title="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut gravida dictum diam et sagittis. Sed lorem arcu, consectetur consectetur et, lacinia hendrerit sapien."
              tooltipInnerClassName="caret-dropdown-with-buttons__tooltip-content"
            >
              <img src="images/mm-info-icon.svg" />
            </Tooltip>
          </div>
          <ButtonGroup
            className="caret-dropdown-with-buttons__buttons"
            disabled={false}
            defaultActiveButtonIndex={1}
          >
            <Button>
              +1
            </Button>
            <Button>
              +2
            </Button>
            <Button>
              custom
            </Button>
          </ButtonGroup>
        </div>
      </CaretToggleDropdown>
    </div>
  )
}

CaretDropdownWithButtons.propTypes = {
  toggleText: PropTypes.string,
  prefixText: PropTypes.string,
}
