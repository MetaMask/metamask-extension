import React from 'react'
import { storiesOf } from '@storybook/react'
import PopOver from './popover.component'
import TransactionDetails from '../transaction-details'
import { text } from '@storybook/addon-knobs/react'

import { Tab, Tabs, TabList, TabPanel } from 'react-tabs'
// import 'react-tabs/style/react-tabs.css'

const containerStyle = {
  width: 800,
  height: 600,
  background: 'pink',
  position: 'relative',
}

const close = e => {
  e.preventDefault()
  console.log(e)
}

const activities = [
  'Transaction created with a value of 0.000023 ETH at 09:50 on 8/8/2019.',
  'Transaction submitted with gas fee of 0 WEI at 09:47 on 8/8/2019.',
  'Transaction confirmed at 09:45 on 8/8/2019.',
  'Transaction created with a value of 0.000023 ETH at 09:50 on 8/8/2019.',
  'Transaction submitted with gas fee of 0 WEI at 09:47 on 8/8/2019.',
  'Transaction confirmed at 09:45 on 8/8/2019.',
]

const Fees = () => (
  <div className="fees">
    <div className="fees__option fast selected">
      <h3>Fast</h3>
      <h4>2m 30s</h4>
      <p>
        $0.20
        <span className="eth">0.00354 ETH</span>
      </p>
    </div>
    <div className="fees__option faster">
      <h3>Faster</h3>
      <h4>1m 30s</h4>
      <p>
        $0.30
        <span className="eth">0.00456 ETH</span>
      </p>
    </div>
    <div className="fees__option fastest">
      <h3>Fastest</h3>
      <h4>30s</h4>
      <p>
        $0.50
        <span className="eth">0.00567 ETH</span>
      </p>
    </div>
  </div>
)

const Activity = () => (
  <div className="activity">
    <div className="header">
      <a href="#" onClick={e => e.preventDefault()} className="etherscan">
        View on Etherscan
      </a>
      <h3>Activity</h3>
    </div>
    <ul>
      {
        activities.map((item, index) => (
          <li key={index}>
            <div className="line" />
            <div className="bullet">
              <svg width="7" height="7" viewBox="0 0 7 7" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="3.5" cy="3.5" r="3.5" fill="#037DD6" />
              </svg>
            </div>
            <span>{item}</span>
          </li>
        ))
      }
    </ul>
  </div>
)

const Chart = () => (
  <div className="chart"></div>
)

storiesOf('PopOver', module)
  .add('PopOver - Approve', () => (
    <div style={containerStyle}>
      <PopOver title={text('title', 'Approve spend limit')} onClose={close}>
        <div className="container">
          <div className="popover-item">
            <div className="col">
              <h3>STATUS</h3>
              <h4>Confirmed</h4>
            </div>
            <div className="col">
              <h3>DATE</h3>
              <h4>Sept 20 at 9:08am</h4>
            </div>
          </div>
          <div className="popover-item">
            <div className="col">
              <h3>from</h3>
              <h4>834759....872345</h4>
            </div>
            <div className="col">
              <h3>to</h3>
              <h4>834759....872345</h4>
            </div>
          </div>
          <div className="popover-item">
            <div className="col">
              <h3>nonce</h3>
              <h4>#5</h4>
            </div>
            <div className="col">
              <h3>description</h3>
              <h4>0x may spend up to:<br /> 071,992.54744099 DAI</h4>
            </div>
          </div>
          <TransactionDetails amount={0.00} fee={0.04} ethCost={0.000185} />
          <Activity />
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
            <div className="container">
              <h3>Select a higher fee to accelerate your transaction.</h3>
              <Fees />
              <TransactionDetails amount={0.00} fee={0.04} ethCost={0.000185} />
              <button className="save">Save</button>
            </div>
          </TabPanel>
          <TabPanel>
            <div className="container">
              <div className="advanced-input-controls">
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
              <button className="save">Save</button>
            </div>
          </TabPanel>
        </Tabs>
      </PopOver>
    </div>
  ))
