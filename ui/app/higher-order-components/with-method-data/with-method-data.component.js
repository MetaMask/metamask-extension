import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { getMethodData } from '../../helpers/confirm-transaction/util'

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
    }

    componentDidMount () {
      this.fetchMethodData()
    }

    async fetchMethodData () {
      const { transaction } = this.props
      const { txParams: { data = '' } = {} } = transaction

      if (data) {
        const methodData = await getMethodData(data)
        this.setState({ methodData })
      }
    }

    render () {
      const { methodData } = this.state

      return (
        <WrappedComponent
          { ...this.props }
          methodData={methodData}
        />
      )
    }
  }
}
