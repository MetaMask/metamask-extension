import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { getMethodData } from '../../helpers/transactions.util'

export default function withMethodData (WrappedComponent) {
  return class MethodDataWrappedComponent extends PureComponent {
    static propTypes = {
      transaction: PropTypes.object,
    }

    static defaultProps = {
      transaction: {},
    }

    state = {
      methodData: {},
      done: false,
      error: null,
    }

    componentDidMount () {
      this.fetchMethodData()
    }

    async fetchMethodData () {
      const { transaction } = this.props
      const { txParams: { data = '' } = {} } = transaction

      if (data) {
        try {
          const methodData = await getMethodData(data)
          this.setState({ methodData, done: true })
        } catch (error) {
          this.setState({ done: true, error })
        }
      } else {
        this.setState({ done: true })
      }
    }

    render () {
      const { methodData, done, error } = this.state

      return (
        <WrappedComponent
          { ...this.props }
          methodData={{ data: methodData, done, error }}
        />
      )
    }
  }
}
