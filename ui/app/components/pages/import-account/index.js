const Component = require('react').Component
const h = require('react-hyperscript')
const PropTypes = require('prop-types')
import Select from 'react-select'

// Subviews
const JsonImportView = require('./json.js')
const PrivateKeyImportView = require('./private-key.js')

const PRIVATE_KEY_MENU_ITEM = 'Private Key'
const JSON_FILE_MENU_ITEM = 'JSON File'

class ImportAccount extends Component {
  constructor (props) {
    super(props)

    this.state = {
      current: PRIVATE_KEY_MENU_ITEM,
      menuItems: [ PRIVATE_KEY_MENU_ITEM, JSON_FILE_MENU_ITEM ],
    }
  }

  renderImportView () {
    const { current } = this.state

    switch (current) {
      case 'Private Key':
        return h(PrivateKeyImportView)
      case 'JSON File':
        return h(JsonImportView)
      default:
        return h(JsonImportView)
    }
  }

  render () {
    const { history } = this.props
    const { current, menuItems } = this.state

    return (
      h('div.flex-center', {
        style: {
          flexDirection: 'column',
          marginTop: '32px',
        },
      }, [
        h('.section-title.flex-row.flex-center', [
          h('i.fa.fa-arrow-left.fa-lg.cursor-pointer', {
            onClick: history.goBack,
          }),
          h('h2.page-subtitle', 'Import Accounts'),
        ]),
        h('div', {
          style: {
            padding: '10px 0',
            width: '260px',
            color: 'rgb(174, 174, 174)',
          },
        }, [

          h('h3', { style: { padding: '3px' } }, 'SELECT TYPE'),

          h('style', `
            .has-value.Select--single > .Select-control .Select-value .Select-value-label, .Select-value-label {
              color: rgb(174,174,174);
            }
          `),

          h(Select, {
            name: 'import-type-select',
            clearable: false,
            value: current,
            options: menuItems.map(type => {
              return {
                value: type,
                label: type,
              }
            }),
            onChange: opt => {
              this.setState({ current: opt.value })
            },
          }),
        ]),

        this.renderImportView(),
      ])
    )
  }
}

ImportAccount.propTypes = {
  history: PropTypes.object,
}

module.exports = ImportAccount
