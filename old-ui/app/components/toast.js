const inherits = require('util').inherits
const Component = require('react').Component
const h = require('react-hyperscript')
const connect = require('react-redux').connect

inherits(ToastIndicator, Component)
module.exports = connect(mapStateToProps)(ToastIndicator)

function mapStateToProps (state) {
    return {
        isShowMsg:state.metamask.isShowMsg,
        toastMsg:state.metamask.toastMsg
    }
}

function ToastIndicator() {
    Component.call(this)
}

let baseIndex = 12

ToastIndicator.prototype.render = function () {
    const { isShowMsg, toastMsg, toastTime } = this.props

    console.log("当前",this.props);
    return h('div', {
         style:{
            left: '0px',
            zIndex: 10,
            position: 'absolute',
            flexDirection: 'column',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            width: '100%',
            background: 'rgba(255, 255, 255, 0.8)',
         }
       },[
        h('div',"toastMsg")
       ]
    )
}
