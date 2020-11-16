import React, { Component } from 'react'
import PropTypes from 'prop-types'
import PageContainerHeader from '../../../components/ui/page-container/page-container-header'

export default class SendHeader extends Component {
  static propTypes = {
    clearSend: PropTypes.func,
    history: PropTypes.object,
    mostRecentOverviewPage: PropTypes.string,
    titleKey: PropTypes.string,
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  onClose() {
    const { clearSend, history, mostRecentOverviewPage } = this.props
    clearSend()
    history.push(mostRecentOverviewPage)
  }

  render() {
    return (
      <PageContainerHeader
        className="send__header"
        onClose={() => this.onClose()}
        title={this.context.t(this.props.titleKey)}
        headerCloseText={this.context.t('cancel')}
      />
    )
  }
}
