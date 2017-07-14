const Component = require('react').Component;
const PropTypes = require('react').PropTypes;
const h = require('react-hyperscript');
const Dropdown = require('./dropdown').Dropdown;
const DropdownMenuItem = require('./dropdown').DropdownMenuItem;

class AccountOptionsMenus extends Component {
  constructor(props) {
    super(props);
    this.state = {
      overflowMenuActive: false,
      switchingMenuActive: false,
    };
    console.log("state:", this.state);
  }

  render() {
    console.log("RENDERING AcountOptionsMenus");
    return h(
      'span',
      {
        style: this.props.style,
      },
      [
        h(
          'i.fa.fa-angle-down',
          {
            onClick: (event) => {
              event.stopPropagation();
              this.setState({ switchingMenuActive: !this.state.switchingMenuActive })
            }
          },
          [
            h(
              Dropdown,
              {
                isOpen: this.state.switchingMenuActive,
                onClickOutside: () => { this.setState({ switchingMenuActive: false})}
              },
              [
                h(DropdownMenuItem, {
                }, 'Settings'),
              ]
            )
          ],
        ),
        h(
          'i.fa.fa-ellipsis-h',
          {
            style: { 'marginLeft': '10px'},
            onClick: (event) => {
              event.stopPropagation();
              this.setState({ overflowMenuActive: !this.state.overflowMenuActive })
            }
          },
          [
            h(
              Dropdown,
              {
                isOpen: this.state.overflowMenuActive,
                onClickOutside: () => { this.setState({ overflowMenuActive: false})}
              },
              [
                h(DropdownMenuItem, {
                }, 'Settings'),
              ]
            )
          ]
        )
      ]
    )
  }
}

module.exports = {
  AccountOptionsMenus,
};