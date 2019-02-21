import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Loading from '../../loading-screen'
import { DEFAULT_ROUTE } from '../../../routes'

export default class Lock extends PureComponent {
  static propTypes = {
    history: PropTypes.object,
    isUnlocked: PropTypes.bool,
    lockMetamask: PropTypes.func,
  }

  componentDidMount () {
    const { lockMetamask, isUnlocked, history } = this.props

    if (isUnlocked) {
      lockMetamask().then(() => history.push(DEFAULT_ROUTE))
    } else {
      history.replace(DEFAULT_ROUTE)
    }
  }

  render () {
    return <Loading />
  }
}
