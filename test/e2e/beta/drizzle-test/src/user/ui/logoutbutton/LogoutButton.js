import React from 'react'

const LogoutButton = ({ onLogoutUserClick }) => {
  return(
    <li className="pure-menu-item">
      <a href="#" className="pure-menu-link" onClick={(event) => onLogoutUserClick(event)}>Logout</a>
    </li>
  )
}

export default LogoutButton
