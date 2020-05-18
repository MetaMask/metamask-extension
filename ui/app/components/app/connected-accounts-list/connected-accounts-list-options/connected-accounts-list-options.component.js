import PropTypes from 'prop-types'
import React, { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { usePopper } from 'react-popper'

const ConnectedAccountsListOptions = ({ children, onShowOptions, onHideOptions, show }) => {
  const [optionsButtonElement, setOptionsButtonElement] = useState(null)
  const [popperElement, setPopperElement] = useState(null)
  const popoverContainerElement = useRef(document.getElementById('popover-content'))

  const { attributes, styles } = usePopper(optionsButtonElement, popperElement, {
    modifiers: [{ name: 'preventOverflow', options: { altBoundary: true } }],
  })
  return (
    <>
      <button className="fas fa-ellipsis-v connected-accounts-options__button" onClick={onShowOptions} ref={setOptionsButtonElement} />
      {
        show
          ? createPortal(
            <>
              <div className="connected-accounts-options__background" onClick={onHideOptions} />
              <div
                className="connected-accounts-options"
                ref={setPopperElement}
                style={styles.popper}
                {...attributes.popper}
              >
                { children }
              </div>
            </>,
            popoverContainerElement.current
          )
          : null
      }
    </>
  )
}

ConnectedAccountsListOptions.propTypes = {
  children: PropTypes.node.isRequired,
  onHideOptions: PropTypes.func.isRequired,
  onShowOptions: PropTypes.func.isRequired,
  show: PropTypes.bool.isRequired,
}

export default ConnectedAccountsListOptions
