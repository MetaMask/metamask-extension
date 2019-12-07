
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

const Item = ({ icon, title, subtitle, more }) => {
  console.log(icon, title, subtitle, more)
  return (
    <div className="Item__flex-grid">
      <div className="col">
        <Icon
          type="send"
          width={28}
          height={28}
          color="#2F80ED"
          borderWidth={1}
          borderRadius={18}
        />
      </div>
      <div className="col">
        <h2>Send Dai</h2>
        <h3>Sept 20 · To: 00X4...3058</h3>
      </div>
      <div className="col">
        <div></div>
      </div>
    </div>
  )
}

Item.propTypes = {
  // cols: PropTypes.string,
  icon: PropTypes.number,
  title: PropTypes.number,
  subtitle: PropTypes.string,
  more: PropTypes.number,
}

export default Item
