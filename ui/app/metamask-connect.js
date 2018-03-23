const connect = require('react-redux').connect
const t = require('../i18n-helper').getMessage

const metamaskConnect = (mapStateToProps, mapDispatchToProps) => {
    return connect(
        _higherOrderMapStateToProps(mapStateToProps),
        mapDispatchToProps
    )
}

const _higherOrderMapStateToProps = (mapStateToProps) => {
    let _t
    let currentLocale
    return (state, ownProps = {}) => {
        const stateProps = mapStateToProps
            ? mapStateToProps(state, ownProps)
            : ownProps
        if (currentLocale !== state.metamask.currentLocale) {
            currentLocale = state.metamask.currentLocale
            _t = t.bind(null, state.localeMessages)
        }
        stateProps.t = _t
        return stateProps
    }
}

module.exports = metamaskConnect