import React, { Component } from 'react'
import PropTypes from 'prop-types'
import deepEqual from 'fast-deep-equal'
import Button from '../../../../components/ui/button'

export default class PluginsList extends Component {

  static propTypes = {
    plugins: PropTypes.object.isRequired,
    removePlugins: PropTypes.func.isRequired,
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  constructor (props) {
    super(props)
    this.state = {
      plugins: {
        ...this.getPluginsState(props),
        // [pluginName]: {
        //   selected: boolean,
        // },
      },
    }
  }

  componentDidUpdate () {
    const newPluginState = this.getPluginsState(this.props)
    // if plugins have been added or removed, reset state
    // TODO:review is this unnecessary given React's state management?
    // Like, will React not re-render anyway if state isn't different?
    if (!deepEqual(
      Object.keys(this.state.plugins), Object.keys(newPluginState))
    ) {
      this.setState({ plugins: newPluginState })
    }
  }

  getPluginsState (props) {
    const { plugins } = props
    return Object.keys(plugins).reduce((acc, pluginName) => {
      acc[pluginName] = {
        selected: true,
      }
      return acc
    }, {})
  }

  // think of this as creating an event handling function
  // bound to the given plugin id
  onPluginToggle = (id) => () => {
    const perm = { ...this.state.plugins[id] }
    perm.selected = !perm.selected
    this.setState({
      plugins: {
        ...this.state.plugins,
        [id]: perm,
      },
    })
  }

  updatePlugins () {
    this.props.removePlugins(
      Object.keys(this.state.plugins)
        .filter(pluginName => !this.state.plugins[pluginName].selected)
    )
  }

  renderPluginsList () {
    const { plugins } = this.props
    return (
      <ul>
        {
          Object.keys(plugins).sort().map(pluginName => {

            if (
              Object.keys(plugins).length === 0 ||
              !this.state.plugins[pluginName] // state may lag behind props slightly
            ) {
              return null
            }

            // TODO: these elements look like trash and their CSS is placeholder only
            return (
              <li key={pluginName}>
                <details className="settings-page__content-list-details">
                  <summary>
                    <input
                      type="checkbox"
                      checked={this.state.plugins[pluginName].selected}
                      onChange={this.onPluginToggle(pluginName)}
                      className="settings-page__content-list-checkbox"
                    />
                    {
                      <i className="settings-page__content-list-indenticon--default">
                        {pluginName}
                      </i>
                    }
                    {pluginName}
                    <i className="caret"></i>
                  </summary>
                  <ul>
                    {
                      this.renderPluginsListItem(pluginName, plugins[pluginName])
                    }
                  </ul>
                </details>
              </li>
            )
          })
        }
      </ul>
    )
  }

  renderPluginsListItem (pluginName, pluginData) {
    return Object.keys(pluginData).map(key => {
      if (key !== 'sourceCode') {
        return (
          <li key={`${pluginName}:${key}`} className="settings-page__content-list-item">
            {`${key}: ${JSON.stringify(pluginData[key])}`}
          </li>
        )
      }
    })
  }

  render () {
    const { t } = this.context
    const hasPlugins = Object.keys(this.props.plugins).length > 0
    return (
      <div className="settings-page__content-row">
        <div className="settings-page__content-item">
          <span>{ t('pluginsSettings') }</span>
          <span className="settings-page__content-description">
            { t('pluginsDescription') }
          </span>
        </div>
        <div className="settings-page__content-item">
          {
            hasPlugins
              ? this.renderPluginsList()
              : t('pluginsEmpty')
          }
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <Button
              type="warning"
              large
              className="settings-tab__button--orange"
              disabled={!hasPlugins}
              onClick={event => {
                event.preventDefault()
                this.updatePlugins()
              }}
            >
              { t('updatePlugins') }
            </Button>
          </div>
        </div>
      </div>
    )
  }
}
