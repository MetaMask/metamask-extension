import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { BrowserQRCodeReader } from '@zxing/library'
import adapter from 'webrtc-adapter' // eslint-disable-line import/no-nodejs-modules, no-unused-vars
import Spinner from '../../spinner'
const { ENVIRONMENT_TYPE_POPUP } = require('../../../../../app/scripts/lib/enums')
const { getEnvironmentType } = require('../../../../../app/scripts/lib/util')
const {
  SEND_ROUTE,
} = require('../../../routes')

export default class QrScanner extends Component {
  static propTypes = {
    hideModal: PropTypes.func.isRequired,
    qrCodeDetected: PropTypes.func,
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  constructor (props, context) {
    super(props)
    this.state = {
      ready: false,
      msg: context.t('accessingYourCamera'),
    }
    this.scanning = false
    this.codeReader = null
    this.notAllowed = false
  }

  componentDidMount () {

    if (!this.scanning) {
      this.scanning = true

      this.initCamera()
    }
  }

  componentWillUnmount () {
    this.codeReader.reset()
  }

  initCamera () {

    this.codeReader = new BrowserQRCodeReader()
    this.codeReader.getVideoInputDevices()
      .then(videoInputDevices => {

        setTimeout(_ => {
          if (!this.notAllowed) {
            this.setState({
              ready: true,
              msg: this.context.t('scanInstructions')})
          }
        }, 2000)


        this.codeReader.decodeFromInputVideoDevice(videoInputDevices[0].deviceId, 'video')
        .then(content => {

          const result = this.parseContent(content.text)
          if (result.type !== 'unknown') {
            this.props.qrCodeDetected(result)
            this.stopAndClose()
          } else {
            this.setState({msg: this.context.t('unknownQrCode')})
          }
        })
        .catch(err => {
          this.notAllowed = true
          if (err && err.name === 'NotAllowedError') {
            if (getEnvironmentType(window.location.href) === ENVIRONMENT_TYPE_POPUP) {
              global.platform.openExtensionInBrowser(`${SEND_ROUTE}`, `scan=true`)
            } else {
              this.setState({msg: this.context.t('youNeedToAllowCameraAccess')})
            }
          }
          console.error('QR-SCANNER: decodeFromInputVideoDevice threw an exception: ', err)
        })
      }).catch(err => {
        console.error('QR-SCANNER: getVideoInputDevices threw an exception: ', err)
      })
  }

  parseContent (content) {
    let type = 'unknown'
    let values = {}

    // Here we could add more cases
    // To parse other type of links
    // For ex. EIP-681 (https://eips.ethereum.org/EIPS/eip-681)

    if (content.split('ethereum:').length > 1) {
      type = 'address'
      values = {'address': content.split('ethereum:')[1] }
    }
    return {type, values}
  }


  stopAndClose = () => {
    this.codeReader.reset()
    this.scanning = false
    this.setState({ ready: false })
    this.props.hideModal()
  }

  render () {
    const { t } = this.context

    return (
      <div className="qr-scanner">
        <div className="qr-scanner__title">
          { `${t('scanQrCode')}?` }
        </div>
        <div className="qr-scanner__content">
          <div className={'qr-scanner__content__video-wrapper'}>
            <video
              id="video"
              style={{
                display: this.state.ready ? 'block' : 'none',
              }}
            />
            { !this.state.ready ? <Spinner color={'#F7C06C'} /> : null}
          </div>
        </div>
        <div className="qr-scanner__status">
          {this.state.msg}
        </div>
      </div>
    )
  }
}
