import React, { Component } from 'react';

//import { getChartDataByVirus } from '../../lib/db-main.js'

const db = require('../../lib/db')
const escape = require('sql-template-strings')

/*
// https://stackoverflow.com/questions/5072136/javascript-filter-for-objects
Object.filter = function( obj, predicate) {
    let result = {}, key;

    for (key in obj) {
        if (obj.hasOwnProperty(key) && !predicate(obj[key])) {
            result[key] = obj[key];
        }
    }

    return result;
};*/

/*async function getDocuments() {
	var documents = await db.query(escape`

	SELECT tmp1.entity_name as entity_name,tmp2.entity_name as virus_name,COUNT(*) as count 
	FROM (
		SELECT a.document_id, e.entity_name 
		FROM annotations a, entities e, entitytypes et 
		WHERE a.entity_id = e.entity_id 
		AND e.entitytype_id = et.entitytype_id 
		AND et.entitytype_name = 'drug') as tmp1
	JOIN (
		SELECT a.document_id, e.entity_name 
		FROM annotations a, entities e, entitytypes et 
		WHERE a.entity_id = e.entity_id 
		AND e.entitytype_id = et.entitytype_id 
		AND et.entitytype_name = 'virus'    
	) as tmp2
	ON tmp1.document_id = tmp2.document_id
	WHERE tmp1.document_id IN (
		SELECT a.document_id
		FROM annotations a, entities e, entitytypes et 
		WHERE a.entity_id = e.entity_id 
		AND e.entitytype_id = et.entitytype_id 
		AND et.entitytype_name = 'topic'
		AND e.entity_name = 'Therapeutics'
	)
	GROUP BY tmp1.entity_name,tmp2.entity_name

	`)
	
	documents = documents.map(r => Object.assign({},r))
	
	return documents
}*/

/*async function getChartDataByVirus(topic,entitytype) {
	var counts = await db.query(escape`

	SELECT tmp1.entity_name as entity_name,tmp2.entity_name as virus_name,COUNT(*) as count 
	FROM (
		SELECT a.document_id, e.entity_name 
		FROM annotations a, entities e, entitytypes et 
		WHERE a.entity_id = e.entity_id 
		AND e.entitytype_id = et.entitytype_id 
		AND et.entitytype_name = 'drug') as tmp1
	JOIN (
		SELECT a.document_id, e.entity_name 
		FROM annotations a, entities e, entitytypes et 
		WHERE a.entity_id = e.entity_id 
		AND e.entitytype_id = et.entitytype_id 
		AND et.entitytype_name = 'virus'    
	) as tmp2
	ON tmp1.document_id = tmp2.document_id
	WHERE tmp1.document_id IN (
		SELECT a.document_id
		FROM annotations a, entities e, entitytypes et 
		WHERE a.entity_id = e.entity_id 
		AND e.entitytype_id = et.entitytype_id 
		AND et.entitytype_name = 'topic'
		AND e.entity_name = ${topic}
	)
	GROUP BY tmp1.entity_name,tmp2.entity_name

	`)
	
	counts = counts.map(r => Object.assign({},r))
	
	var countsByEntityAndVirus = {'SARS-CoV-2':[],'MERS-CoV':[],'SARS-CoV':[]}
	counts.forEach(c => { 
		//if (!(c['virus_name'] in countsByEntityAndVirus))
		//	countsByEntityAndVirus[c['virus_name']] = []
		
		countsByEntityAndVirus[c['virus_name']][c['entity_name']] = c['count']
	})
	
	return countsByEntityAndVirus
}*/

async function getChartDataByVirus(topic,entitytype) {
	var counts = await db.query(escape`

	SELECT tmp1.entity_name as entity_name,tmp2.entity_name as virus_name,COUNT(*) as count 
	FROM (
		SELECT a.document_id, e.entity_name 
		FROM annotations a, entities e, entitytypes et 
		WHERE a.entity_id = e.entity_id 
		AND e.entitytype_id = et.entitytype_id 
		AND et.entitytype_name = 'drug') as tmp1
	JOIN (
		SELECT a.document_id, e.entity_name 
		FROM annotations a, entities e, entitytypes et 
		WHERE a.entity_id = e.entity_id 
		AND e.entitytype_id = et.entitytype_id 
		AND et.entitytype_name = 'virus'    
	) as tmp2
	ON tmp1.document_id = tmp2.document_id
	WHERE tmp1.document_id IN (
		SELECT a.document_id
		FROM annotations a, entities e, entitytypes et 
		WHERE a.entity_id = e.entity_id 
		AND e.entitytype_id = et.entitytype_id 
		AND et.entitytype_name = 'topic'
		AND e.entity_name = ${topic}
	)
	GROUP BY tmp1.entity_name,tmp2.entity_name

	`)
	
	counts = counts.map(r => Object.assign({},r))
	
	//const counts_array = counts.map(row => [row.virus_name,row.entity_name,row.count])
	
	const justEntityCounts = counts.reduce(function(p, row) {
		var name = row['entity_name']
		var count = row['count']
		p[name] = (p[name] || 0) + count;
		return p;
	}, {});
	
	const top30 = Object.keys(justEntityCounts).map( k=> [justEntityCounts[k],k] ).sort( (a,b) => b[0]-a[0] ).slice(0,30).map(x => x[1])
	
	console.log(top30)
	
	const viruses2 = [...new Set(counts.map(row => row['virus_name']))]
	//console.log(viruses2)
	
	/*const baa = viruses2.map(v => {
		justEntityCounts.filter( row => (row['virus_name'] == v
	})*/
	
	const top30Counts = counts.filter(row => top30.includes(row['entity_name']))
	const mers = counts.filter(row => row['virus_name'] == 'MERS-CoV')
	//const mers = Object.filter(moo,row => row['virus_name'] == 'MERS-CoV')
	const baa = viruses2.map( v => 
		top30Counts.filter(row => row['virus_name'] == v).reduce(function(prev,curr){prev[curr['entity_name']]=curr['count'];return prev;},{}))
	
	
	const oink = viruses2.map( (v,i) => { return { 'label': v, 'data': top30.map(e => ((e in baa[i]) ? baa[i][e] : 0) ) } } )
		
	const finalData = {labels:top30, datasets: oink}
	
	return finalData
}


export async function getStaticProps({ params }) {	
	const chartdata = await getChartDataByVirus('Therapeutics','drug')
	//const docData = await getDocuments()
	
	return {
		props: {
			chartdata
		}
	}
}

class Page extends Component {
	constructor(props) {
		super(props)
		this.state = {
			viruses: []
			}
	}

	render() {	
		console.log(this.props.chartdata)
		//console.log(this.props.docData[0])
		//console.log(this.props.chartdata)
		
		return <div>Hello</div>
	}
}

export default Page

