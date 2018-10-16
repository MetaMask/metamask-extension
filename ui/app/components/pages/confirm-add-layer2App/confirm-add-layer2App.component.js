import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { DEFAULT_ROUTE, ADD_LAYER2APP_ROUTE } from '../../../routes'
import Button from '../../button'
import Identicon from '../../identicon'
import Layer2AppBalance from '../../layer2App-balance'

export default class ConfirmAddLayer2App extends Component {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    history: PropTypes.object,
    clearPendingLayer2Apps: PropTypes.func,
    addLayer2Apps: PropTypes.func,
    pendingLayer2Apps: PropTypes.object,
  }

  componentDidMount () {
    const { pendingLayer2Apps = {}, history } = this.props

    if (Object.keys(pendingLayer2Apps).length === 0) {
      history.push(DEFAULT_ROUTE)
    }
  }

  Getlayer2appname (name, symbol) {
    return typeof name === 'undefined'
      ? symbol
      : `${name} (${symbol})`
  }

  render () {
    const { history, addLayer2Apps, clearPendingLayer2Apps, pendingLayer2Apps } = this.props

    return (
      <div className="page-container">
        <div className="page-container__header">
        </div>
      </div>
    )
  }
}
      //     <div className="page-container__title">
      //       { this.context.t('addLayer2Apps') }
      //     </div>
      //     <div className="page-container__subtitle">
      //       { this.context.t('likeToAddLayer2Apps') }
      //     </div>
      //   </div>
      //   <div className="page-container__content">
      //     <div className="confirm-add-layer2App">
      //       <div className="confirm-add-layer2App__header">
      //         <div className="confirm-add-layer2App__layer2App">
      //           { this.context.t('layer2App') }
      //         </div>
      //         <div className="confirm-add-layer2App__balance">
      //           { this.context.t('balance') }
      //         </div>
      //       </div>
      //       <div className="confirm-add-layer2App__layer2App-list">
      //         {
      //           Object.entries(pendingLayer2Apps)
      //             .map(([ address, layer2App ]) => {
      //               const { name, symbol } = layer2App

      //               return (
      //                 <div
      //                   className="confirm-add-layer2App__layer2App-list-item"
      //                   key={address}
      //                 >
      //                   <div className="confirm-add-layer2App__layer2App confirm-add-layer2App__data">
      //                     <Identicon
      //                       className="confirm-add-layer2App__layer2App-icon"
      //                       diameter={48}
      //                       address={address}
      //                     />
      //                     <div className="confirm-add-layer2App__name">
      //                       { this.getLayer2AppName(name, symbol) }
      //                     </div>
      //                   </div>
      //                   <div className="confirm-add-layer2App__balance">
      //                     <Layer2AppBalance layer2App={layer2App} />
      //                   </div>
      //                 </div>
      //               )
      //           })
      //         }
      //       </div>
      //     </div>
      //   </div>
      //   <div className="page-container__footer">
      //     <header>
      //       <Button
      //         type="default"
      //         large
      //         className="page-container__footer-button"
      //         onClick={() => history.push(ADD_LAYER2APP_ROUTE)}
      //       >
      //         { this.context.t('back') }
      //       </Button>
      //       <Button
      //         type="primary"
      //         large
      //         className="page-container__footer-button"
      //         onClick={() => {
      //           addLayer2Apps(pendingLayer2Apps)
      //             .then(() => {
      //               clearPendingLayer2Apps()
      //               history.push(DEFAULT_ROUTE)
      //             })
      //         }}
      //       >
      //         { this.context.t('addLayer2Apps') }
      //       </Button>
      //     </header>
