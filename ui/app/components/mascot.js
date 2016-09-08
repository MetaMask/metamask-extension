const inherits = require('util').inherits
const Component = require('react').Component
const h = require('react-hyperscript')
const metamaskLogo = require('metamask-logo')
const debounce = require('debounce')

module.exports = Mascot

inherits(Mascot, Component)
function Mascot () {
  Component.call(this)
  this.logo = metamaskLogo({
    followMouse: true,
    pxNotRatio: true,
    width: 200,
    height: 200,
  })
  if (!this.logo.webGLSupport) return
  this.refollowMouse = debounce(this.logo.setFollowMouse.bind(this.logo, true), 1000)
  this.unfollowMouse = this.logo.setFollowMouse.bind(this.logo, false)
}

Mascot.prototype.render = function () {
  // this is a bit hacky
  // the event emitter is on `this.props`
  // and we dont get that until render
  this.handleAnimationEvents()

  return h('#metamask-mascot-container', {
    style: { zIndex: 2 },
  })
}

Mascot.prototype.componentDidMount = function () {
  var targetDivId = 'metamask-mascot-container'
  var container = document.getElementById(targetDivId)
  container.appendChild(this.logo.container)
}

Mascot.prototype.componentWillUnmount = function () {
  this.animations = this.props.animationEventEmitter
  this.animations.removeAllListeners()
  this.logo.container.remove()
  this.logo.stopAnimation()
}

Mascot.prototype.handleAnimationEvents = function () {
  // only setup listeners once
  if (this.animations) return
  this.animations = this.props.animationEventEmitter
  this.animations.on('point', this.lookAt.bind(this))
  this.animations.on('setFollowMouse', this.logo.setFollowMouse.bind(this.logo))
}

Mascot.prototype.lookAt = function (target) {
  if (!this.logo.webGLSupport) return
  this.unfollowMouse()
  this.logo.lookAt(target)
  this.refollowMouse()
}
