const inherits = require('util').inherits
const Component = require('react').Component
const h = require('react-hyperscript')
const connect = require('react-redux').connect
const actions = require('./actions')

module.exports = connect(mapStateToProps)(InfoScreen)

function mapStateToProps(state) {
  return {}
}

inherits(InfoScreen, Component)
function InfoScreen() {
  Component.call(this)
}

InfoScreen.prototype.render = function() {
  var state = this.props
  var rpc = state.rpc

  return (
    h('.flex-column.flex-grow', [

      // subtitle and nav
      h('.section-title.flex-row.flex-center', [
        h('i.fa.fa-arrow-left.fa-lg.cursor-pointer', {
          onClick: (event) => {
            state.dispatch(actions.goHome())
          }
        }),
        h('h2.page-subtitle', 'Info'),
      ]),

      // main view
      h('.flex-column.flex-justify-center.flex-grow.select-none', [
        h('.flex-space-around', {
          style: {
            padding: '20px',
          }
        }, [

          h('div', [
            h('a', {
              href: 'https://consensys.slack.com/archives/team-metamask',
              target: '_blank',
              onClick(event) { this.navigateTo(event.target.href) },
            }, 'Join the conversation on Slack'),
          ]),

          h('div', [
            h('a', {
              href: 'https://metamask.io/',
              target: '_blank',
              onClick(event) { this.navigateTo(event.target.href) },
            }, 'Visit our web site'),
          ]),

          h('div', [
            h('a', {
              href: 'https://twitter.com/metamask_io',
              target: '_blank',
              onClick(event) { this.navigateTo(event.target.href) },
            }, 'Follow us on Twitter'),
          ]),

          h('div', [
            h('a', {
              href: 'mailto:hello@metamask.io?subject=Feedback',
              target: '_blank',
            }, 'Email us any questions or comments!'),
          ]),

          h('div', [
            h('a', {
              href: 'https://github.com/metamask/talk/issues',
              target: '_blank',
              onClick(event) { this.navigateTo(event.target.href) },
            }, 'Start a thread on Github'),
          ]),

        ]),
      ]),
    ])
  )
}

InfoScreen.prototype.navigateTo = function(url) {
  chrome.tabs.create({ url });
}
