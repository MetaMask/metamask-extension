const connect = require('react-redux').connect
const t = require('../i18n-helper').getMessage

const metamaskConnect = (mapStateToProps, mapDispatchToProps) => {
    return connect(
        _higherOrderMapStateToProps(mapStateToProps),
        mapDispatchToProps
    )
}

const _higherOrderMapStateToProps = (mapStateToProps) => {
    return (state, ownProps = {}) => {
        const stateProps = mapStateToProps
            ? mapStateToProps(state, ownProps)
            : ownProps
        console.log(`state.localeMessages`, state.localeMessages);
        stateProps.t = t.bind(null, state.localeMessages)
        return stateProps
    }
}

module.exports = metamaskConnect