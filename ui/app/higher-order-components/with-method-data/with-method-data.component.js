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
      methodData: {
        data: {},
      },
      isFetching: false,
      error: null,
    }

    componentDidMount () {
      this.fetchMethodData()
    }

    async fetchMethodData () {
      const { transaction } = this.props
      const { txParams: { data = '' } = {} } = transaction

      if (data) {
        this.setState({ isFetching: true })

        try {
          const methodData = await getMethodData(data)
          this.setState({ methodData, isFetching: false })
        } catch (error) {
          this.setState({ isFetching: false, error })
        }
      }
    }

    render () {
      const { methodData, isFetching, error } = this.state

      return (
        <WrappedComponent
          { ...this.props }
          methodData={{ data: methodData, isFetching, error }}
        />
      )
    }
  }
}
