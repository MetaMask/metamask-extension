import React from 'react'
import Popover from './popover.component'
import { text } from '@storybook/addon-knobs/react'
import Copy from '../icon/copy-icon.component'
import Tooltip from '../tooltip'

const containerStyle = {
  width: 800,
  height: 600,
  background: 'pink',
  position: 'relative',
}

const preventDefault = (event) => {
  event.preventDefault()
}

export default {
  title: 'Popover',
}

export const approve = () => (
  <div style={containerStyle}>
    <Popover title={text('title', 'Approve spend limit')} onClose={preventDefault}>
      <div className="popover-item">
        <div className="popover-item__col">
          <h3 className="popover-item__heading">STATUS</h3>
          <h4 className="popover-item__subheading confirmed">
            Confirmed
            <Tooltip position="right" title="Copy Transaction ID">
              <button className="popover-item__icon" onClick={preventDefault}>
                <Copy
                  className="popover-item__copy"
                  size={11}
                  color="#6A737D"
                />
              </button>
            </Tooltip>
          </h4>
        </div>
        <div className="popover-item__col">
          <h3 className="popover-item__heading">DATE</h3>
          <h4 className="popover-item__subheading">Sept 20 at 9:08am</h4>
        </div>
      </div>
      <div className="popover-item">
        <div className="popover-item__col">
          <h3 className="popover-item__heading">from</h3>
          <h4 className="popover-item__subheading">834759....872345</h4>
        </div>
        <div className="popover-item__col">
          <h3 className="popover-item__heading">to</h3>
          <h4 className="popover-item__subheading">834759....872345</h4>
        </div>
      </div>
      <div className="popover-item">
        <div className="popover-item__col">
          <h3 className="popover-item__heading">nonce</h3>
          <h4 className="popover-item__subheading">#5</h4>
        </div>
        <div className="popover-item__col">
          <h3 className="popover-item__heading">description</h3>
          <h4 className="popover-item__subheading">0x may spend up to:<br /> 071,992.54744099 DAI</h4>
        </div>
      </div>
    </Popover>
  </div>
)
