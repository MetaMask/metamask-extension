import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import SimpleDropdown from '../../../components/app/dropdowns/simple-dropdown'
import routes from '../../../helpers/constants/routes'

const routesOptions = Object.values(routes).sort().map(route => {
  return {
    displayValue: route,
    key: route,
    value: route,
  }
})

export default class ShortCutsTab extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
    metricsEvent: PropTypes.func,
  }

  static propTypes = {
    shortCutRoutes: PropTypes.object,
    setShortCutRoute: PropTypes.func,
    setExtensionShortcuts: PropTypes.func,
    extensionShortcuts: PropTypes.array,
  }

  state = {
    openDropdown: '',
  }

  componentDidMount () {
    const { setExtensionShortcuts } = this.props
    setExtensionShortcuts()
  }

  renderShortCutSelect ({ name, shortcut }) {
    const { t } = this.context
    const { openDropdown } = this.state
    const { shortCutRoutes, setShortCutRoute } = this.props

    return name === openDropdown || openDropdown === ''
      ? (<div className="settings-page__content-row" key={`${name}-select`}>
        <div className="settings-page__content-item--tight">
          <span>{ `${t(name)}: ${shortcut}` }</span>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <SimpleDropdown
              placeholder={'Select Route'}
              options={routesOptions}
              selectedOption={shortCutRoutes[name]}
              onOpen={() => {
                console.log('this.state', this.state)
                this.setState({ openDropdown: name })
              }}
              onClose={() => this.setState({ openDropdown: '' })}
              onSelect={(newRoute) => setShortCutRoute(name, newRoute)}
            />
          </div>
        </div>
      </div>)
      : null
  }

  render () {
    const { extensionShortcuts } = this.props

    return (
      <div className="settings-page__body shortcuts-tab__body">
        { extensionShortcuts && extensionShortcuts.map(extensionShortcut => this.renderShortCutSelect(extensionShortcut)) }
      </div>
    )
  }
}
