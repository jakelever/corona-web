
function filterForVirus(row, viruses) {
	var row_viruses = row['entities'].filter(e => e['type'] == 'Virus').map(e => e['name']);
	var overlap = viruses.filter(v => row_viruses.includes(v))
	return overlap.length > 0
}

export function filterData(data, filters, ranges, viruses) {
	var filteredData = data;
	
	if (viruses.length > 0 && viruses.length < 3) {
		filteredData = filteredData.filter( doc => filterForVirus(doc, viruses) )
	}
		
	Object.keys(filters).forEach( column => {
		const values = filters[column]
		if (values.length == 0)
			return
		
		const isAttribute = data.length > 0 && (column in data[0])
		if (isAttribute)
			filteredData = filteredData.filter( doc => values.includes(doc[column]) )
		else
			filteredData = filteredData.filter( doc => {
				const docEntitiesOfType = doc.entities.filter( e => e.type==column).map( e => e.name )
				const overlap = values.filter( v => docEntitiesOfType.includes(v) )
				return overlap.length > 0
			})
	})
	
	Object.keys(ranges).forEach( name => {
		const [ minVal, maxVal ] = ranges[name]
		filteredData = filteredData.filter( doc => doc[name] >= minVal && doc[name] <= maxVal )
	})
	
	return filteredData
}
