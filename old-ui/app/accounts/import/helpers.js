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

module.exports = {
	nestedJsonObjToArray,
}
