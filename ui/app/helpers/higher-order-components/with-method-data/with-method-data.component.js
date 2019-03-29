import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { getMethodData, getFourBytePrefix } from '../../utils/transactions.util'

export default function withMethodData (WrappedComponent) {
  return class MethodDataWrappedComponent extends PureComponent {
    static propTypes = {
      transaction: PropTypes.object,
      knownMethodData: PropTypes.object,
      addKnownMethodData: PropTypes.func,
    }

    static defaultProps = {
      transaction: {},
      knownMethodData: {},
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
      const { transaction, knownMethodData, addKnownMethodData } = this.props
      const { txParams: { data = '' } = {} } = transaction

      if (data) {
        try {
          let methodData
          const fourBytePrefix = getFourBytePrefix(data)
          if (fourBytePrefix in knownMethodData) {
            methodData = knownMethodData[fourBytePrefix]
          } else {
            methodData = await getMethodData(data)
            if (!Object.entries(methodData).length === 0) {
              addKnownMethodData(fourBytePrefix, methodData)
            }
          }

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
