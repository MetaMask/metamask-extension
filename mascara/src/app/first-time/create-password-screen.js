import React, {Component, PropTypes} from 'react'

export default class CreatePasswordScreen extends Component {

  state = {
    password: '',
    confirmPassword: ''
  }

  render() {
    return (
      <div className="create-password">
        <div className="create-password__title">
          Create Password
        </div>
        <input
          className="first-time-flow__input"
          type="password"
          placeholder="New Password (min 8 characters)"
          onChange={e => this.setState({password: e.target.value})}
        />
        <input
          className="first-time-flow__input create-password__confirm-input"
          type="password"
          placeholder="Confirm Password"
          onChange={e => this.setState({confirmPassword: e.target.value})}
        />
        <button
          className="first-time-flow__button"
        >
          Create
        </button>
        <a
          href=""
          className="first-time-flow__link"
          onClick={e => e.preventDefault()}
        >
          Import an account
        </a>
        <div />
      </div>
    )
  }

}