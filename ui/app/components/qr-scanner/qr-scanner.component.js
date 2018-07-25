import React, { Component } from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import { hideQrScanner, qrCodeDetected} from '../../actions'
import Instascan from 'instascan'

class QrScanner extends Component {
  static propTypes = {
    visible: PropTypes.bool,
    hideQrScanner: PropTypes.func,
    qrCodeDetected: PropTypes.func,
  }
  constructor (props) {
    super(props)
    this.state = {
      msg: 'Place the QR code in front of your camera so we can read it...',
    }
    this.scanning = false
  }

  parseContent (content) {
    let type = 'unknown'
    let values = {}

    // Here we could add more cases
    // To parse other codes (transactions for ex.)

    if (content.split('ethereum:').length > 1) {
      type = 'address'
      values = {'address': content.split('ethereum:')[1] }
    }
    return {type, values}
  }

  componentDidUpdate () {
    if (this.props.visible && this.camera && !this.scanning) {
      const scanner = new Instascan.Scanner({
        video: this.camera,
        backgroundScan: false,
        continuous: true,
      })
      scanner.addListener('scan', (content) => {
        scanner.stop().then(_ => {
          const result = this.parseContent(content)
          if (result.type !== 'unknown') {
            console.log('QR-SCANNER: CODE DETECTED', result)
            this.props.qrCodeDetected(result)
            this.props.hideQrScanner()
          } else {
            this.setState({msg: 'Error: We couldn\'t identify that QR code'})
          }
        })
      })
      Instascan.Camera.getCameras().then((cameras) => {
        if (cameras.length > 0) {
          scanner.start(cameras[0])
          console.log('QR-SCANNER: started scanning with camera', cameras[0])
        } else {
          console.log('QR-SCANNER: no cameras found')
        }
      }).catch(function (e) {
        console.error(e)
      })
      this.scanning = true
    }
  }

  render () {
    const { visible } = this.props

    if (!visible) {
     return null
    }

    return (
      <div className={'qr-code-modal-wrapper'}>
        <div className={'qr-scanner'}
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            zIndex: 1050,
            minWidth: '320px',
            minHeight: '400px',
            maxWidth: '300px',
            maxHeight: '300px',
            transform: 'translate(-50%, -50%)',
            backgroundColor: '#ffffff',
            padding: '15px',
          }}
        >
          <h3 style={{
            textAlign: 'center',
            marginBottom: '20px',
          }}>
            Scan QR code
          </h3>
            <div
              className={'qr-code-video-wrapper'}
              style={{
                overflow: 'hidden',
                width: '100%',
                height: '275px',
              }}>
              <video
                style={{
                  width: 'auto',
                  height: '275px',
                  marginLeft: '-15%',
                }}
                ref={(cam) => {
                  this.camera = cam
                }}
              />
            </div>
          <div className={'qr-code-help'} style={{textAlign: 'center', fontSize: '12px', padding: '15px'}}>
            {this.state.msg}
          </div>
        </div>
        <div
          className={'qr-code-modal-overlay'}
          style={{
            position: 'fixed',
            top: '0',
            right: '0',
            bottom: '0',
            left: '0',
            zIndex: '1040',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            animationFillMode: 'forwards',
            animationDuration: '0.3s',
            animationName: 'anim_171532470906313',
            animationTimingFunction: 'ease-out',
          }}
          onClick={_ => this.props.hideQrScanner() }
        />
      </div>
    )
  }
}

function mapDispatchToProps (dispatch) {
  return {
    hideQrScanner: () => dispatch(hideQrScanner()),
    qrCodeDetected: (data) => dispatch(qrCodeDetected(data)),
  }
}
function mapStateToProps (state) {
  return {}
}

export default connect(mapStateToProps, mapDispatchToProps)(QrScanner)
