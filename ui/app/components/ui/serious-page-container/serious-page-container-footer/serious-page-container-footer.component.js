import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Button from '../../button'

export default class SeriousPageContainerFooter extends Component {

  constructor(props) {
    super(props);
    this.state = {value: ''};

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  static propTypes = {
    children: PropTypes.node,
    onCancel: PropTypes.func,
    cancelText: PropTypes.string,
    cancelButtonType: PropTypes.string,
    doSubmit: PropTypes.func,
    submitText: PropTypes.string,
    disabled: PropTypes.bool,
    submitButtonType: PropTypes.string,
    hideCancel: PropTypes.bool,
    buttonSizeLarge: PropTypes.bool,
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  handleChange(event) {
    this.setState({value: event.target.value});
  }

  handleSubmit(event) {
    const input = this.state.value.toLowerCase()
    console.log('input recieved (with a .ToLower()): ' + input)
    if (input === 'i trust this site completely') {
      doSubmit()
    }
    event.preventDefault();
  }

  render () {
    const {
      children,
      onCancel,
      cancelText,
      onSubmit,
      submitText,
      disabled,
      submitButtonType,
      hideCancel,
      cancelButtonType,
      buttonSizeLarge = false,
    } = this.props

    return (
      <div className="page-container__footer">

        <header>
          <form onSubmit={this.handleSubmit}>
            <label>
              Type 'I trust this site completely':
              <input type="text" value={this.state.value} onChange={this.handleChange} />
            </label>
            <input type="submit" value="Submit" />
          </form>
        </header>

        {children && (
          <footer>
            {children}
          </footer>
        )}

      </div>
    )
  }

}
