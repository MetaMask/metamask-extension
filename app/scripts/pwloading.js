const extension = require('extensionizer')
function UrlSearch () {
	var strUrl = location.search
	var getPara, ParaVal
	var aryPara = []
	if (strUrl.indexOf('?') !== -1) {
		var getSearch = strUrl.split('?')
		getPara = getSearch[1].split('&')
		for (var i = 0; i < getPara.length; i++) {
				ParaVal = getPara[i].split('=')
				aryPara.push(ParaVal[0])
				aryPara[ParaVal[0]] = ParaVal[1]
		}
	}
	return aryPara
}
const tabid = UrlSearch()['tabid']
if (tabid === 'undefined') {
    extension.tabs.update(tabid, { url: '404.html' })
} else {
    setTimeout(() => {
        extension.tabs.update(tabid, { url: '404.html' })
    }, 60000)
}

