
import React from 'react'
import PropTypes from 'prop-types'
import Icon from '../icon'

/* const Icon = () => ({})
const Title = () => (
  <h2>Send Dai</h2>
)
const Subtitle = component => (
  <h3>Sept 20 · To: 00X4...3058</h3>
)
const More = () => ({}) */

const Item = ({ className, icon, title, subtitle, more }) => {
  console.log(icon, title, subtitle, more)
  return (
    <div className={className}>
      <div className="col icon">
        {icon}
      </div>
      <div className="col main">
        <h2>Send DAI</h2>
        <h3>Sept 20 · To: 00X4...3058</h3>
        <div className="more">
          <button>Speed up</button>
          <button>Cancel</button>
        </div>
      </div>
      <div className="col amount">
        <h2>- 0.0732 DAI</h2>
        <h3>- $6.04 USD</h3>
      </div>
    </div>
  )
}

Item.propTypes = {
  className: PropTypes.string,
  icon: PropTypes.node,
  title: PropTypes.string,
  subtitle: PropTypes.string,
  more: PropTypes.number,
}

export default Item
