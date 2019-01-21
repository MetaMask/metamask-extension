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
		default:
		return ''
	}
}

const fetchABI = (addr, network) => {
	return new Promise((resolve, reject) => {
		const networkName = getBlockscoutApiNetworkSuffix(network)
		const bloscoutApiLink = `https://blockscout.com/poa/${networkName}/api`
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
		.catch(e => {
			reject(e)
		})
	})
}

module.exports = {
	nestedJsonObjToArray,
	getFullABI,
}
