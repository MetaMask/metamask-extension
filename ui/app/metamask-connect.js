const connect = require('react-redux').connect

const metamaskConnect = (mapStateToProps, mapDispatchToProps) => {
    return connect(
        _higherOrderMapStateToProps(mapStateToProps),
        mapDispatchToProps
    )
}

const _higherOrderMapStateToProps = (mapStateToProps) => {
    return (state, ownProps) => {
        const stateProps = mapStateToProps(state, ownProps)
        stateProps.localeMessages = state.localeMessages || {}
        return stateProps
    }
}

module.exports = metamaskConnect