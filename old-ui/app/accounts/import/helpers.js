import log from 'loglevel'
import { importTypes } from './enums'

const nestedJsonObjToArray = (jsonObj) => {
	return jsonObjToArray(jsonObj)
}

const jsonObjToArray = (jsonObj) => {
	return Object.keys(jsonObj).reduce((arr, key) => {
		if (jsonObj[key].constructor === Object || jsonObj[key].constructor === Array) {
			arr = arr.concat(jsonObjToArray(jsonObj[key]))
		} else if (jsonObj[key].constructor === String) {
			arr.push(jsonObj[key])
		}
		return arr
	}, [])
}

const getBlockscoutApiNetworkPrefix = (network) => {
	switch (Number(network)) {
		case 1:
		case 42:
		case 3:
		case 4:
		return 'eth'
		case 99:
		case 77:
		case 100:
		return 'poa'
		case NaN:
		return 'etc'
		default:
		return ''
	}
}

const getBlockscoutApiNetworkSuffix = (network) => {
	switch (Number(network)) {
		case 1:
		return 'mainnet'
		case 99:
		return 'core'
		case 77:
		return 'sokol'
		case 100:
		return 'dai'
		case 42:
		return 'kovan'
		case 3:
		return 'ropsten'
		case 4:
		return 'rinkeby'
		case NaN:
		return 'mainnet'
		default:
		return ''
	}
}

const fetchABI = (addr, network) => {
	return new Promise((resolve, reject) => {
		const networkParent = getBlockscoutApiNetworkPrefix(network)
		const networkName = getBlockscoutApiNetworkSuffix(network)
		const bloscoutApiLink = `https://blockscout.com/${networkParent}/${networkName}/api`
		const bloscoutApiContractPath = '?module=contract'
		const blockscoutApiGetAbiPath = `&action=getabi&address=${addr}`
		const apiLink = `${bloscoutApiLink}${bloscoutApiContractPath}${blockscoutApiGetAbiPath}`
		fetch(apiLink)
		.then(response => {
			return response.json()
		})
		.then(responseJson => {
			resolve(responseJson && responseJson.result)
		})
		.catch((e) => {
			log.debug(e)
			resolve()
		})
	})
}

const getFullABI = (eth, contractAddr, network, type) => {
	return new Promise((resolve, reject) => {
		fetchABI(contractAddr, network)
		.then((targetABI) => {
			targetABI = targetABI && JSON.parse(targetABI)
			let finalABI = targetABI
			if (type === importTypes.CONTRACT.PROXY) {
				if (!eth.contract(targetABI).at(contractAddr).implementation) {
					const e = {
						message: 'This is not a valid Delegate Proxy contract',
					}
					reject(e)
				}
				try {
					eth.contract(targetABI).at(contractAddr).implementation.call((err, implAddr) => {
						fetchABI(implAddr, network)
						.then((implABI) => {
							implABI = implABI && JSON.parse(implABI)
							finalABI = implABI ? targetABI.concat(implABI) : targetABI
							resolve(finalABI)
						})
						.catch(e => reject(e))
					})
				} catch (e) {
					reject(e)
				}
			} else {
				resolve(finalABI)
			}
		})
		.catch(e => { reject(e) })
	})
}

module.exports = {
	nestedJsonObjToArray,
	getFullABI,
}
