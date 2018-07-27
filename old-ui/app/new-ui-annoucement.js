const PropTypes = require('prop-types')
const {PureComponent} = require('react')
const h = require('react-hyperscript')
const actions = require('../../ui/app/actions')

module.exports = class NewUiAnnouncement extends PureComponent {
  static propTypes = {
    dispatch: PropTypes.func.isRequired,
  };

  close = async () => {
    await this.props.dispatch(actions.setFeatureFlag('skipAnnounceBetaUI', true))
  }

  switchToNewUi = async () => {
    const flag = 'betaUI'
    const enabled = true
    await this.props.dispatch(actions.setFeatureFlag(
      flag,
      enabled,
    ))
    await this.close()
    global.platform.openExtensionInBrowser()
  }

  render () {
    return (
      h('div.new-ui-announcement', [
        h('section.new-ui-announcement__announcement-header', [
          h('h1', 'Announcement'),
          h('a.close', {
            onClick: this.close,
          }, '×'),
        ]),
        h('section.new-ui-announcement__body', [
          h('h1', 'A New Version of MetaMask'),
          h('p', [
            "We're excited to announce a brand-new version of MetaMask with enhanced features and functionality.",
          ]),
          h('div.updates-list', [
            h('h2', 'Updates include'),
            h('ul', [
              h('li', 'New user interface'),
              h('li', 'Full-screen mode'),
              h('li', 'Better token support'),
              h('li', 'Better gas controls'),
              h('li', 'Advanced features for developers'),
              h('li', 'New confirmation screens'),
              h('li', 'And more!'),
            ]),
          ]),
          h('p', [
            'You can still use the current version of MetaMask. The new version is still in beta, ' +
            'however we encourage you to try it out as we transition into this exciting new update.',
            h('span', {
              dangerouslySetInnerHTML: {
                __html: '&nbsp;',
              },
            }),
            h('a', {
              href: 'https://medium.com/metamask/74dba32cc7f7',
              onClick ({target}) {
                const url = target.href
                global.platform.openWindow({
                  url,
                })
              },
            }, [
              'Learn more.',
            ]),
          ]),
        ]),
        h('section.new-ui-announcement__footer', [
          h('h1', 'Ready to try the new MetaMask?'),
          h('button.positive', {
            onClick: this.switchToNewUi,
          }, 'Try it now'),
          h('button.negative', {
            onClick: this.close,
          }, 'No thanks, maybe later'),
        ]),
      ])
    )
  }
}
