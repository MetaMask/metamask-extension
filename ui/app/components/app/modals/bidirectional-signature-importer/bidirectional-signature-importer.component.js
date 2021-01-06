import React, { Component } from 'react'
import PropTypes from 'prop-types'
import log from 'loglevel'
import { decodeUR, extractSingleWorkload } from '@cvbb/bc-ur'
import QrReader from 'react-qr-reader'
import { getEnvironmentType } from '../../../../../../app/scripts/lib/util'
import { ENVIRONMENT_TYPE_FULLSCREEN } from '../../../../../../app/scripts/lib/enums'
import Spinner from '../../../ui/spinner'
import WebcamUtils from '../../../../../lib/webcam-utils'
import PageContainerFooter from '../../../ui/page-container/page-container-footer/page-container-footer.component'

const READY_STATE = {
  ACCESSING_CAMERA: 'ACCESSING_CAMERA',
  NEED_TO_ALLOW_ACCESS: 'NEED_TO_ALLOW_ACCESS',
  READY: 'READY',
}

function onlyUnique(value, index, arr) {
  return arr.indexOf(value) === index
}

export default class BidirectionalSignatureImporter extends Component {
  static propTypes = {
    hideModal: PropTypes.func.isRequired,
    qrCodeDetected: PropTypes.func.isRequired,
    submitSignature: PropTypes.func.isRequired,
    cancelTransaction: PropTypes.func.isRequired,
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  constructor(props) {
    super(props)

    this.state = this.getInitialState()
    this.codeReader = null
    this.permissionChecker = null
    this.mounted = false

    // Clear pre-existing qr code data before scanning
    this.props.qrCodeDetected(null)
  }

  componentDidMount() {
    this.mounted = true
    this.checkEnvironment()
  }

  componentDidUpdate(_, prevState) {
    const { ready } = this.state

    if (prevState.ready !== ready) {
      if (ready === READY_STATE.READY) {
        this.initCamera()
      } else if (ready === READY_STATE.NEED_TO_ALLOW_ACCESS) {
        this.checkPermissions()
      }
    }
  }

  getInitialState() {
    return {
      ready: READY_STATE.ACCESSING_CAMERA,
      error: null,
      urs: [],
      urInfo: {
        current: 0,
        total: 0,
      },
    }
  }

  checkEnvironment = async () => {
    try {
      const { environmentReady } = await WebcamUtils.checkStatus()
      if (
        !environmentReady &&
        getEnvironmentType() !== ENVIRONMENT_TYPE_FULLSCREEN
      ) {
        const currentUrl = new URL(window.location.href)
        const currentHash = currentUrl.hash
        const currentRoute = currentHash ? currentHash.substring(1) : null
        global.platform.openExtensionInBrowser(currentRoute)
      }
    } catch (error) {
      if (this.mounted) {
        this.setState({ error })
      }
    }
    // initial attempt is required to trigger permission prompt
    this.initCamera()
  }

  checkPermissions = async () => {
    try {
      const { permissions } = await WebcamUtils.checkStatus()
      if (permissions) {
        if (!this.mounted) {
          return
        }
        this.setState({ ready: READY_STATE.READY })
      } else if (this.mounted) {
        // Keep checking for permissions
        this.permissionChecker = setTimeout(this.checkPermissions, 1000)
      }
    } catch (error) {
      if (this.mounted) {
        this.setState({ error })
      }
    }
  }

  componentWillUnmount() {
    this.mounted = false
    clearTimeout(this.permissionChecker)
  }

  initCamera = async () => {
    try {
      await this.checkPermissions()
    } catch (error) {
      if (!this.mounted) {
        return
      }
      if (error.name === 'NotAllowedError') {
        log.info(`Permission denied: '${error}'`)
        this.setState({ ready: READY_STATE.NEED_TO_ALLOW_ACCESS })
      } else {
        this.setState({ error })
      }
    }
  }

  stopAndClose = () => {
    this.props.hideModal()
  }

  tryAgain = () => {
    clearTimeout(this.permissionChecker)
    this.setState(this.getInitialState(), () => {
      this.checkEnvironment()
    })
  }

  renderError() {
    const { t } = this.context
    const { error } = this.state

    let title, msg
    if (error.type === 'NO_WEBCAM_FOUND') {
      title = t('noWebcamFoundTitle')
      msg = t('noWebcamFound')
    } else if (error.message === t('unknownQrCode')) {
      msg = t('unknownQrCode')
    } else {
      title = t('unknownCameraErrorTitle')
      msg = t('unknownCameraError')
    }

    return (
      <>
        <div className="qr-scanner__image">
          <img src="images/webcam.svg" width="70" height="70" alt="" />
        </div>
        {title ? <div className="qr-scanner__title">{title}</div> : null}
        <div className="qr-scanner__error">{msg}</div>
        <PageContainerFooter
          onCancel={this.stopAndClose}
          onSubmit={this.tryAgain}
          cancelText={t('cancel')}
          submitText={t('tryAgain')}
          submitButtonType="confirm"
        />
      </>
    )
  }

  handleError(error) {
    this.setState({ error })
  }

  handleScan(data) {
    try {
      if (!data) {
        return
      }
      // eslint-disable-next-line no-unused-vars
      const [_, total] = extractSingleWorkload(data)
      if (this.state.urInfo.total) {
        if (this.state.urInfo.total !== total) {
          throw new Error('Invalid UR')
        }
        if (this.state.urInfo.total === total) {
          const newUrs = [...this.state.urs, data].filter(onlyUnique)
          if (newUrs.length === this.state.urInfo.total) {
            const result = JSON.parse(
              Buffer.from(decodeUR(this.state.urs), 'hex').toString('utf-8'),
            )
            this.props.submitSignature(result)
            this.stopAndClose()
          } else {
            this.setState({
              urs: newUrs,
              urInfo: {
                ...this.state.urInfo,
                current: newUrs.length,
              },
            })
          }
        }
      } else {
        this.setState({
          urs: [data],
          urInfo: {
            current: 1,
            total,
          },
        })
      }
    } catch (error) {
      this.setState({ error })
    }
  }

  renderVideo() {
    const { t } = this.context
    const { ready } = this.state

    let message
    if (ready === READY_STATE.ACCESSING_CAMERA) {
      message = t('accessingYourCamera')
    } else if (ready === READY_STATE.READY) {
      message = t('scanInstructions')
    } else if (ready === READY_STATE.NEED_TO_ALLOW_ACCESS) {
      message = t('youNeedToAllowCameraAccess')
    }

    return (
      <>
        <div className="qr-scanner__title">{`${t('scanQrCode')}`}</div>
        <div className="qr-scanner__content">
          <div className="qr-scanner__content__video-wrapper">
            {ready === READY_STATE.READY ? (
              <QrReader
                delay={300}
                onError={(error) => {
                  this.handleError(error)
                }}
                onScan={(data) => {
                  this.handleScan(data)
                }}
                style={{ width: '100%' }}
              />
            ) : (
              <Spinner color="#F7C06C" />
            )}
          </div>
        </div>
        <div className="qr-scanner__status">{message}</div>
      </>
    )
  }

  render() {
    const { error } = this.state
    const { cancelTransaction } = this.props
    return (
      <div className="qr-scanner">
        <div
          className="qr-scanner__close"
          onClick={() => {
            this.stopAndClose()
            cancelTransaction()
          }}
        />
        {error ? this.renderError() : this.renderVideo()}
      </div>
    )
  }
}
