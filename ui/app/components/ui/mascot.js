import PropTypes from 'prop-types'
import React, { createRef, Component } from 'react'
import metamaskLogo from 'metamask-logo'
import { debounce } from 'lodash'

export default class Mascot extends Component {
  static propTypes = {
    animationEventEmitter: PropTypes.object.isRequired,
    width: PropTypes.string,
    height: PropTypes.string,
  }

  constructor (props) {
    super(props)

    const { width = '200', height = '200' } = props

    this.logo = metamaskLogo({
      followMouse: true,
      pxNotRatio: true,
      width,
      height,
    })

    this.mascotContainer = createRef()

    this.refollowMouse = debounce(this.logo.setFollowMouse.bind(this.logo, true), 1000)
    this.unfollowMouse = this.logo.setFollowMouse.bind(this.logo, false)
  }

  handleAnimationEvents () {
    // only setup listeners once
    if (this.animations) {
      return
    }
    this.animations = this.props.animationEventEmitter
    this.animations.on('point', this.lookAt.bind(this))
    this.animations.on('setFollowMouse', this.logo.setFollowMouse.bind(this.logo))
  }

  lookAt (target) {
    this.unfollowMouse()
    this.logo.lookAt(target)
    this.refollowMouse()
  }

  componentDidMount () {
    this.mascotContainer.current.appendChild(this.logo.container)
  }

  componentWillUnmount () {
    this.animations = this.props.animationEventEmitter
    this.animations.removeAllListeners()
    this.logo.container.remove()
    this.logo.stopAnimation()
  }

  render () {
    // this is a bit hacky
    // the event emitter is on `this.props`
    // and we dont get that until render
    this.handleAnimationEvents()
    return (
      <div
        ref={this.mascotContainer}
        style={{ zIndex: 0 }}
      />
    )
  }
}
