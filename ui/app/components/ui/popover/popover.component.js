import React from 'react'
// import PropTypes from 'prop-types'

const PopOver = () => (
  <div>
    <div className="popover-content">
      <div className="header">
        <h2>Approve spend limit</h2>
        <a className="close" onClick={e => console.log(e)}>
          <div>
            <div className="line a"></div>
            <div className="line b"></div>
          </div>
        </a>
      </div>
    </div>
    <div className="popover-bg" />
  </div>
)

export default PopOver
