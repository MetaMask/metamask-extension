import React from 'react'
import { storiesOf } from '@storybook/react'
import PopOver from './popover.component'
import TransactionDetails from '../transaction-details'
import TransactionActivity from '../transaction-activity'
import TransactionFees from '../transaction-fees'
import { text } from '@storybook/addon-knobs/react'

import { Tab, Tabs, TabList, TabPanel } from 'react-tabs'
// import 'react-tabs/style/react-tabs.css'

const activities = [
  'Transaction created with a value of 0.000023 ETH at 09:50 on 8/8/2019.',
  'Transaction submitted with gas fee of 0 WEI at 09:47 on 8/8/2019.',
  'Transaction confirmed at 09:45 on 8/8/2019.',
  'Transaction created with a value of 0.000023 ETH at 09:50 on 8/8/2019.',
  'Transaction submitted with gas fee of 0 WEI at 09:47 on 8/8/2019.',
  'Transaction confirmed at 09:45 on 8/8/2019.',
]

const containerStyle = {
  width: 800,
  height: 600,
  background: 'pink',
  position: 'relative',
}

const close = e => {
  e.preventDefault()
  console.log('close window')
}

const Chart = () => (
  <div className="popover__chart"></div>
)

storiesOf('PopOver', module)
  .add('PopOver - Approve', () => (
    <div style={containerStyle}>
      <PopOver title={text('title', 'Approve spend limit')} onClose={close}>
        <div className="popover-container">
          <div className="popover-item">
            <div className="popover-item__col">
              <h3 className="popover-item__heading">STATUS</h3>
              <h4 className="popover-item__subheading confirmed">Confirmed</h4>
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
          <TransactionDetails amount={0.00} fee={0.04} ethCost={0.000185} />
          <TransactionActivity activities={activities} />
        </div>
      </PopOver>
    </div>
  ))
  .add('PopOver - Speed Up', () => (
    <div style={containerStyle}>
      <PopOver title={text('title', 'Speed up')} onClose={close}>
        <Tabs>
          <TabList>
            <Tab>Basic</Tab>
            <Tab>Advanced</Tab>
          </TabList>

          <TabPanel>
            <div className="popover-container">
              <h3 className="popover__heading">Select a higher fee to accelerate your transaction.</h3>
              <TransactionFees />
              <TransactionDetails amount={0.00} fee={0.04} ethCost={0.000185} />
              <button className="popover__save">Save</button>
            </div>
          </TabPanel>
          <TabPanel>
            <div className="popover-container">
              <div className="popover__advanced-input-controls">
                <div className="col">
                  <div className="advanced-gas-inputs__gas-edit-row__label">Gas Price (GWEI)<i className="fa fa-info-circle"></i></div>
                  <div className="">
                    <input defaultValue="8" type="number" id="tentacles" name="tentacles" min="8" max="100" />
                  </div>
                </div>
                <div className="col">
                  <div className="advanced-gas-inputs__gas-edit-row__label">Gas Price (GWEI)<i className="fa fa-info-circle"></i></div>
                  <div className="">
                    <input defaultValue="2100" type="number" id="tentacles" name="tentacles" min="8" max="100" />
                  </div>
                </div>
              </div>
              <Chart />
              <TransactionDetails amount={0.00} fee={0.04} ethCost={0.000185} />
              <button className="popover__save">Save</button>
            </div>
          </TabPanel>
        </Tabs>
      </PopOver>
    </div>
  ))
