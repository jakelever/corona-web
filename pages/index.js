import React, { Component } from 'react';
import Layout from '../components/Layout.js'

import Link from 'next/link'
import { Doughnut, Line, Bar } from 'react-chartjs-2';
import pages from '../lib/pages.json'

const db = require('../lib/db')
const escape = require('sql-template-strings')

import { getEntityID } from '../lib/db-main'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChessKnight } from '@fortawesome/free-solid-svg-icons'
import { faCalendarAlt } from '@fortawesome/free-solid-svg-icons'
import { faBookOpen } from '@fortawesome/free-solid-svg-icons'
import { faBrain } from '@fortawesome/free-solid-svg-icons'
import { faLightbulb } from '@fortawesome/free-solid-svg-icons'
import { faShieldVirus } from '@fortawesome/free-solid-svg-icons'

import _ from 'lodash'

import dynamic from 'next/dynamic'

const DynamicMapComponent = dynamic(
  () => import('../components/Map'),
  { ssr: false }
)


// https://stackoverflow.com/questions/2901102/how-to-print-a-number-with-commas-as-thousands-separators-in-javascript
function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

async function getPopularLocations(limit) {
	var counts = await db.query(escape`

	SELECT *
	FROM (
		SELECT e.name, c.longitude, c.latitude, COUNT(*) as count
		FROM annotations a, entities e, coordinates c
		WHERE a.entity_id = e.entity_id
		AND e.entity_id = c.entity_id
		GROUP BY e.name, c.longitude, c.latitude
	) as tmp1
	WHERE tmp1.count > 5

	`)
	counts = counts.map(r => Object.assign({},r))
	
	return Object.values(counts)
}

async function getJournalCounts(limit) {
	var counts = await db.query(escape`

	SELECT journal as name, COUNT(*) as count
	FROM documents
	WHERE journal != ''
	GROUP BY journal
	ORDER BY count DESC
	LIMIT ${limit}

	`)
	counts = counts.map(r => Object.assign({},r))
	
	return Object.values(counts)
}

async function getPreprintCounts() {
	const researchID = await getEntityID('Research','pubtype')
	
	var counts = await db.query(escape`

	SELECT INSTR('rxiv',LOWER(d.journal)) as preprint, COUNT(*) as count
	FROM documents d, annotations a
	WHERE d.document_id = a.document_id
	AND a.entity_id = ${researchID}
	GROUP BY preprint
    ORDER BY preprint

	`)
	counts = counts.map(r => Object.assign({},r))
	//console.log(researchID)
	//console.log(counts)
	
	return {'peer_reviewed': counts[0].count, 'preprint': counts[1].count}
	//return {'peer_reviewed': 1, 'preprint': 2}
}

async function getChartDataByVirusAllTopics(entitytype,topLimit) {
	var dbResponse = await db.query(escape`

	SELECT tmp1.name as entity_name,tmp2.name as virus_name,COUNT(*) as count 
	FROM (
		SELECT a.document_id, e.name 
		FROM annotations a, entities e, entitytypes et 
		WHERE a.entity_id = e.entity_id 
		AND e.entitytype_id = et.entitytype_id 
		AND et.name = ${entitytype}) as tmp1
	JOIN (
		SELECT a.document_id, e.name 
		FROM annotations a, entities e, entitytypes et 
		WHERE a.entity_id = e.entity_id 
		AND e.entitytype_id = et.entitytype_id 
		AND et.name = 'Virus'
	) as tmp2
	ON tmp1.document_id = tmp2.document_id
	GROUP BY tmp1.name,tmp2.name

	`)
	dbResponse = dbResponse.map(row => Object.assign({},row))
	
	const virusCombinations = ['MERS-CoV','SARS-CoV','SARS-CoV-2','MERS-CoV,SARS-CoV','MERS-CoV,SARS-CoV-2','SARS-CoV,SARS-CoV-2','MERS-CoV,SARS-CoV,SARS-CoV-2']
	
	var dataForAllCombos = {}
	virusCombinations.forEach( virusCombo => {
		
		const viruses = virusCombo.split(',')
	
		const counts = dbResponse.filter(row => viruses.includes(row['virus_name']))
		
		const countsEntityOnly = counts.reduce(function(p, row) {
			var name = row['entity_name']
			var count = row['count']
			p[name] = (p[name] || 0) + count;
			return p;
		}, {});
		
		//const topLimit = 30
		const topEntities = Object.keys(countsEntityOnly).map( k=> [countsEntityOnly[k],k] ).sort( (a,b) => b[0]-a[0] ).slice(0,topLimit).map(x => x[1])
		
		
		const topCounts = counts.filter(row => topEntities.includes(row['entity_name']))
		
		const virusAndEntityMap = viruses.map( v => 
			topCounts.filter(row => row['virus_name'] == v).reduce(function(prev,curr){prev[curr['entity_name']]=curr['count'];return prev;},{}))
		
		const datasets = viruses.map( (v,i) => { return { 'label': v, 'data': topEntities.map(e => ((e in virusAndEntityMap[i]) ? virusAndEntityMap[i][e] : 0) ) } } )
			
		dataForAllCombos[virusCombo] = {labels:topEntities, datasets: datasets}
		
	})
	
	return dataForAllCombos
}

async function getTopicCountsByVirus() {
	var counts = await db.query(escape`

	SELECT e_topic.name as topic, e_virus.name as virus, COUNT(*) as count
	FROM annotations anno_topic, entities e_topic, entitytypes et_topic, annotations anno_virus, entities e_virus, entitytypes et_virus
	WHERE anno_topic.document_id = anno_virus.document_id
	AND anno_topic.entity_id = e_topic.entity_id
	AND e_topic.entitytype_id = et_topic.entitytype_id
	AND et_topic.name = 'topic'
	AND anno_virus.entity_id = e_virus.entity_id
	AND e_virus.entitytype_id = et_virus.entitytype_id
	AND et_virus.name = 'Virus'
	GROUP BY topic, virus

	`)
	
	// anno_topic.document_id < 5000 (for testing purposes only)
	
	counts = counts.map(r => Object.assign({},r))
	//console.log(counts)
	
	const topics = [...new Set(counts.map(c => c.topic))].sort();
	const viruses = [...new Set(counts.map(c => c.virus))].sort();
	//console.log(topics)
	
	var topicMap = {}
	topics.forEach( (t,i) => {topicMap[t] = i} )
	
	var data = {}
	viruses.forEach(v => {
		data[v] = topics.map(t => 0)
	})
	
	counts.forEach( count => {
		data[count.virus][topicMap[count.topic]] = count.count
	})
	
	
	var virusColors = {}
	virusColors['SARS-CoV-2'] = '102,194,165'
	virusColors['SARS-CoV'] = '252,141,98'
	virusColors['MERS-CoV'] = '141,160,203'
	
	
	const barData = { 'labels':topics, 'datasets': viruses.map(v => { return { label:v, data:data[v] } } ) }
	//console.log(finalData)
	
	barData.datasets.forEach(dataset => {
		var rgb = virusColors[dataset.label]
		dataset.backgroundColor = "rgba("+rgb+", 0.9)"
		dataset.borderColor = "rgba("+rgb+", 0.9)"
	})
	
	return barData
}

async function getSummaryStatistics() {
	var result = await db.query(escape`

	SELECT COUNT(*) as count 
	FROM documents

	`)
	const allDocCount = result[0].count
	
	result = await db.query(escape`
	
	SELECT COUNT(*) as count 
	FROM documents
	WHERE publish_year != ''
	AND publish_month != ''
	AND publish_day != ''
	AND ABS(DATEDIFF(CONCAT(publish_year,'-',LPAD(publish_month,2,'00'),'-',LPAD(publish_day,2,'00')), CURDATE())) <= 7
	
	`)
	const lastWeekDocCount = result[0].count
	
	/*var result = await db.query(escape`

	SELECT COUNT(*) as count
	FROM entities e, entitytypes et
	WHERE e.entitytype_id = et.entitytype_id
	AND et.name = 'topic'

	`)
	const topicCount = result[0].count*/
	
	const topicCount = pages.length - 4 // Reviews, Comments & Editorials, Book Chapters & Updates
	
	return {
		allDocCount,
		lastWeekDocCount,
		topicCount
	}
}


async function getVirusByDate() {
	var counts = await db.query(escape`

	SELECT name as entity_name, publish_year, publish_month, COUNT(*) as count FROM (
	SELECT * FROM
		(SELECT a.document_id as document_id1,e.name 
		FROM annotations a, entities e, entitytypes et 
		WHERE a.entity_id = e.entity_id 
			AND e.entitytype_id = et.entitytype_id 
			AND et.name = 'virus') as tmp1 
		JOIN 
			(SELECT d.document_id as document_id2, d.publish_year, d.publish_month
			FROM documents d) as tmp2 
		ON tmp1.document_id1 = tmp2.document_id2) as tmp3 
	GROUP BY entity_name,publish_year,publish_month

	`)
	counts = counts.map(r => Object.assign({},r))
	
	return Object.values(counts)
}

/*async function getVirusCounts() {
	var counts = await db.query(escape`

	SELECT name as entity_name, COUNT(*) as count FROM (
	SELECT * FROM
		(SELECT a.document_id as document_id1,e.name 
		FROM annotations a, entities e, entitytypes et 
		WHERE a.entity_id = e.entity_id 
			AND e.entitytype_id = et.entitytype_id 
			AND et.name = 'virus') as tmp1 
		JOIN 
			(SELECT d.document_id as document_id2, d.publish_year 
			FROM documents d) as tmp2 
		ON tmp1.document_id1 = tmp2.document_id2) as tmp3 
	GROUP BY entity_name

	`)
	counts = counts.map(r => Object.assign({},r))
	
	return Object.values(counts)
}*/


function chartifyEntityDateData(data) {
	data = data.filter(d => d.publish_year && d.entity_name )
	const entities = [...new Set(data.map(d => d.entity_name))]
	
	const minYear = Math.min(...data.map(d => d.publish_year))
	const maxYear = Math.max(...data.map(d => d.publish_year))
	
	var labels = []
	_.range(minYear,maxYear+1).forEach(y => {
		_.range(1,13).forEach(m => {
			var label = y.toString() + '-' + m.toString().padStart(2,'0')
			labels.push(label)
		})
	})
	
	var labelMapping = {}
	labels.forEach( (l,i) => {labelMapping[l] = i} )
	
	
	var datasets = {}
	entities.forEach( e => {
		datasets[e] = labels.map( l => 0 )
	})
	
	
	data.forEach(d => {
		if (d.publish_year && d.publish_month) {
			var label = d.publish_year.toString() + '-' + d.publish_month.toString().padStart(2,'0')
			datasets[d.entity_name][labelMapping[label]] = d.count
		}
	})

	return {
		labels: labels, 
		datasets: datasets
		}
}

function setAreaChartColors(data, label, rgb) {
	var index = data.datasets.map(ds => ds.label).indexOf(label)
	var dataset = data.datasets[index]
	
	dataset['backgroundColor'] = "rgba("+rgb+", 1)";
	dataset['borderColor'] = "rgba("+rgb+", 1)";
	dataset['pointRadius'] = 3;
	dataset['pointBackgroundColor'] = "rgba("+rgb+", 1)";
	dataset['pointBorderColor'] = "rgba("+rgb+", 1)";
	dataset['pointHoverRadius'] = 3;
	dataset['pointHoverBackgroundColor'] = "rgba("+rgb+", 1)";
	dataset['pointHoverBorderColor'] = "rgba("+rgb+", 1)";
	dataset['pointHitRadius'] = 10;
	dataset['pointBorderWidth'] = 2;
}

function setDoughnutColors(data, label, rgb) {
	var index = data.labels.indexOf(label)
	var dataset = data.datasets[index]
	
	dataset['backgroundColor'] = "rgba("+rgb+", 1)";
}

function reorderDatasets(data, reordering) {
	var new_datasets = []
	reordering.forEach( l => {
		var index = data.datasets.map(ds => ds.label).indexOf(l)
		new_datasets.push(data.datasets[index])
	})
	data.datasets = new_datasets
}


export async function getStaticProps({ params }) {
	const virusByDate = await getVirusByDate()
	
	
	var virusColors = {}
	virusColors['SARS-CoV-2'] = '102,194,165'
	virusColors['SARS-CoV'] = '252,141,98'
	virusColors['MERS-CoV'] = '141,160,203'
	
	var virusDatePlotData = chartifyEntityDateData(virusByDate)
	
	/*Object.keys(virusColors).forEach(virusName => {
		setAreaChartColors(virusDatePlotData, virusName, virusColors[virusName])
	})
	
	reorderDatasets(virusDatePlotData, ['SARS-CoV','MERS-CoV','SARS-CoV-2'])*/
	
	/*const virusCounts = await getVirusCounts()
	var labels = virusCounts.map(v => v.entity_name)
	var datasets = [{data: virusCounts.map(v => v.count), backgroundColor: virusCounts.map(v => "rgba("+virusColors[v.entity_name]+", 1)") }]
	
	var virusCountsPlotData = { 
		labels: labels,
		datasets: datasets
	}*/
	
	const drugData = await getChartDataByVirusAllTopics('Drug',20)
	const vaccineData = await getChartDataByVirusAllTopics('Vaccine Type',20)
	const riskfactorsData = await getChartDataByVirusAllTopics('Risk Factor',20)
	const symptomsData = await getChartDataByVirusAllTopics('Symptom',20)
	
	const summaryStatistics = await getSummaryStatistics()
	
	const journalCounts = await getJournalCounts(30)
	const preprintCounts = await getPreprintCounts()
	const topicCounts = await getTopicCountsByVirus()
	const popularLocations = await getPopularLocations()
	
	return {
		props: {
			virusDatePlotData,
			journalCounts,
			summaryStatistics,
			drugData,
			vaccineData,
			riskfactorsData,
			symptomsData,
			preprintCounts,
			topicCounts,
			popularLocations
		}
	}
}

export default class Home extends Component {
	constructor(props) {
		super(props)
		this.state = {
			viruses: ['MERS-CoV','SARS-CoV','SARS-CoV-2']
			}
			
		this.chartifyEntityData = this.chartifyEntityData.bind(this);
		this.updateViruses = this.updateViruses.bind(this);
	}
	
	chartifyEntityData(chartdata) {
		var virus_text = this.state.viruses.join(',')
			
		var chosenData = chartdata[virus_text]
		
		var bardata = {
			labels: chosenData.labels.slice(),
			datasets: chosenData.datasets.map( dataset => { return {label:dataset.label, data:dataset.data.slice()} } )
		}
		
		var virusColors = {}
		virusColors['SARS-CoV-2'] = '102,194,165'
		virusColors['SARS-CoV'] = '252,141,98'
		virusColors['MERS-CoV'] = '141,160,203'
		
		bardata.datasets.forEach(dataset => {
			var rgb = virusColors[dataset.label]
			//dataset.backgroundColor = "rgba("+rgb+", 0.9)"
			//dataset.borderColor = "rgba("+rgb+", 0.9)"
			dataset.backgroundColor = "rgba("+rgb+", 0.9)"
			dataset.borderColor = "rgba("+rgb+", 0.9)"
		})
		
		var baroptions = {
			//maintainAspectRatio: false, 
			
			scales: {
				xAxes: [{
					stacked: true,
					ticks: {
						autoSkip: false
					}
				}],
				yAxes: [{
					stacked: true,
					scaleLabel: { display: true, labelString: '# of papers' }
				}]
			}
			
		}
		
		var barChart = (
					<Bar
					  data={bardata}
					  width={100}
					  height={50}
					  options={baroptions}
					/>)
				
		return barChart
	}
	
	updateViruses(viruses) {
		this.setState({viruses: viruses})
	}
	
	render() {
		
		var virusColors = {}
		virusColors['SARS-CoV-2'] = '102,194,165'
		virusColors['SARS-CoV'] = '252,141,98'
		virusColors['MERS-CoV'] = '141,160,203'
		
		const viruses = ['SARS-CoV','MERS-CoV','SARS-CoV-2']
		var virusDatePlots = {}
		viruses.forEach( v => {
			
			var color = this.state.viruses.includes(v) ? "rgba("+virusColors[v]+",1)" : "#CCCCCC"
			//var color = "black"
			
			const lineoptions = { 
				maintainAspectRatio: false,
				legend: false,
				scales: {
					xAxes: [{
						gridLines: {
							//zeroLineColor: color
						}
					}],
					yAxes: [{
						scaleLabel: { 
							display: true, 
							labelString: '# of papers per month',
							//fontColor: color
						},
						ticks: {
							//fontColor: color,
							fontSize: 14
						}
						
						//type: 'logarithmic',
						/*position: 'left',
						gridLines: {display: true, borderDash:[100,1000,10000,100000]},
						ticks: {
							// Include a dollar sign in the ticks
							stepSize: 1000,
							min: 0,
							max: 10000,
							callback: function(value, index, values) {
								return numberWithCommas(value);
							}
						}*/
					}]
				} 
			}
			
			
			var labels = this.props.virusDatePlotData.labels
			var data = this.props.virusDatePlotData.datasets[v]
			
			const dataStartIndex = data.findIndex(val => val > 0)
			labels = labels.slice(dataStartIndex)
			data = data.slice(dataStartIndex)
			
			
			virusDatePlots[v] = <Bar
					data={{
						labels: labels,
						datasets: [{data:data, backgroundColor:color}]
					}}
					options={lineoptions}
			/>
		})
		
		const journalChartData = {
				labels:this.props.journalCounts.map(c => c.name).slice(),
				datasets:[{data:this.props.journalCounts.map(c => c.count).slice(),backgroundColor:'#fbb4ae'}]
				}
				
		//const drugChart = ''
		const drugChart = this.chartifyEntityData(this.props.drugData)
		const vaccineChart = this.chartifyEntityData(this.props.vaccineData)
		const riskfactorsChart = this.chartifyEntityData(this.props.riskfactorsData)
		const symptomsChart = this.chartifyEntityData(this.props.symptomsData)
		//console.log(journalChartData)
		
		return (
			<Layout title="Dashboard" page="/" updateViruses={this.updateViruses} showVirusSelector>

				{/* Page Heading */}
				<div className="d-sm-flex align-items-center justify-content-between mb-4">
					<h1 className="h3 mb-0 text-gray-800">Dashboard</h1>
				</div>
				<div className="d-sm-flex align-items-center justify-content-between mb-4">
					<h3 className="h6 mb-0 text-gray-800"></h3>
				</div>
				
				<div className="row">
					<div className="col-lg-3 mb-4">

					  <div className="card shadow mb-4 h-100">
						<div className="card-header py-3">
						  <h6 className="m-0 font-weight-bold text-primary">Overview</h6>
						</div>
						<div className="card-body">
						  <p>
							This resource surveys research papers for <b>SARS-CoV-2</b>, <b>MERS-CoV</b> and <b>SARS-CoV</b>. Select a <b>topic</b> from the left, or <b>search</b> for subjects of interest above.
						  </p>
						  <p>
							If you <b>spot a mistake</b>, please flag it using the flag icon beside each paper, or use the <Link href="/feedback" as="/feedback"><a>Feedback form</a></Link>.
						  </p>
						  <p>
							For more information, see the <Link href="/faqs" as="/faqs"><a>Frequently Asked Questions</a></Link> page.
						  </p>
						</div>
					  </div>
					</div>
					
					<div className="col-lg-3 mb-4">
						<div className="card shadow mb-4  h-100">
							{/* Card Header - Dropdown */}
							<div className="card-header py-3 d-flex flex-row align-items-center justify-content-between">
								<h6 className="m-0 font-weight-bold text-primary">SARS-CoV</h6>
							</div>
							{/* Card Body */}
							<div className="card-body">
								<div className="chart-area">
									{virusDatePlots['SARS-CoV']}
								</div>
							</div>
						</div>
					</div>
					
					<div className="col-lg-3 mb-4">
						<div className="card shadow mb-4  h-100">
							{/* Card Header - Dropdown */}
							<div className="card-header py-3 d-flex flex-row align-items-center justify-content-between">
								<h6 className="m-0 font-weight-bold text-primary">MERS-CoV</h6>
							</div>
							{/* Card Body */}
							<div className="card-body">
								<div className="chart-area">
									{virusDatePlots['MERS-CoV']}
								</div>
							</div>
						</div>
					</div>
					
					<div className="col-lg-3 mb-4">
						<div className="card shadow mb-4  h-100">
							{/* Card Header - Dropdown */}
							<div className="card-header py-3 d-flex flex-row align-items-center justify-content-between">
								<h6 className="m-0 font-weight-bold text-primary">SARS-CoV-2</h6>
							</div>
							{/* Card Body */}
							<div className="card-body">
								<div className="chart-area">
									{virusDatePlots['SARS-CoV-2']}
								</div>
							</div>
						</div>
					</div>
					
					
				</div>


				<div className="row">

					<div className="col-xl-12 col-lg-5">
						<div className="card shadow mb-4">
							<div className="card-header py-3 d-flex flex-row align-items-center justify-content-between">
								<h6 className="m-0 font-weight-bold text-primary">Topics</h6>
							</div>
							<div className="card-body">
									
								<Bar
								  data={{
									  labels:this.props.topicCounts.labels,
									  datasets:this.props.topicCounts.datasets.filter(ds => this.state.viruses.includes(ds.label))
								  }}
								  width={100}
								  height={30}
								  options={{ 
									legend: { display: true }, 
									scales: { 
										xAxes: [{ stacked:true, ticks: { autoSkip: false }}],
										yAxes: [{ scaleLabel: { display: true, labelString: '# of papers' } }] 
										} 
									}}
								/>
									
							</div>
						</div>
					</div>
					
				</div>
				
				
				
				<div className="row">

					<div className="col-xl-12 col-lg-5">
						<div className="card shadow mb-4">
							<div className="card-header py-3 d-flex flex-row align-items-center justify-content-between">
								<h6 className="m-0 font-weight-bold text-primary">Locations</h6>
							</div>
							<div className="card-body">
									
								<div style={{width:"100%",height:"400px",backgroundColor:"#DDFFDD"}}>
									<DynamicMapComponent links={true} locations={this.props.popularLocations} />
								</div>
									
							</div>
						</div>
					</div>
					
				</div>
				
				
				{/* Content Row */}
				<div className="row">

					{/* Earnings (Monthly) Card Example */}
					<div className="col-xl-3 col-md-6 mb-4">
						<div className="card border-left-primary shadow h-100 py-2">
							<div className="card-body">
								<div className="row no-gutters align-items-center">
									<div className="col mr-2">
										<div className="text-xs font-weight-bold text-primary text-uppercase mb-1">Coronavirus Papers (Total)</div>
										<div className="h5 mb-0 font-weight-bold text-gray-800">{numberWithCommas(this.props.summaryStatistics.allDocCount)}</div>
									</div>
									<div className="col-auto text-gray-300">
										<FontAwesomeIcon icon={faBookOpen} size="2x"  />
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Earnings (Monthly) Card Example */}
					<div className="col-xl-3 col-md-6 mb-4">
						<div className="card border-left-success shadow h-100 py-2">
							<div className="card-body">
								<div className="row no-gutters align-items-center">
									<div className="col mr-2">
										<div className="text-xs font-weight-bold text-success text-uppercase mb-1">Coronavirus Papers (Last 7 Days)</div>
										<div className="h5 mb-0 font-weight-bold text-gray-800">{numberWithCommas(this.props.summaryStatistics.lastWeekDocCount)}</div>
									</div>
									<div className="col-auto text-gray-300">
										<FontAwesomeIcon icon={faCalendarAlt} size="2x"  />
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Earnings (Monthly) Card Example */}
					<div className="col-xl-3 col-md-6 mb-4">
						<div className="card border-left-warning shadow h-100 py-2">
							<div className="card-body">
								<div className="row no-gutters align-items-center">
									<div className="col mr-2">
										<div className="text-xs font-weight-bold text-warning text-uppercase mb-1">Topics Curated</div>
										<div className="h5 mb-0 font-weight-bold text-gray-800">{this.props.summaryStatistics.topicCount}</div>
									</div>
									<div className="col-auto text-gray-300">
										<FontAwesomeIcon icon={faLightbulb} size="2x"  />
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Pending Requests Card Example */}
					<div className="col-xl-3 col-md-6 mb-4">
						<div className="card border-left-info shadow h-100 py-2">
							<div className="card-body">
								<div className="row no-gutters align-items-center">
									<div className="col mr-2">
										<div className="text-xs font-weight-bold text-info text-uppercase mb-1"># of Coronaviruses</div>
										<div className="h5 mb-0 font-weight-bold text-gray-800">3</div>
									</div>
									<div className="col-auto text-gray-300">
										<FontAwesomeIcon icon={faShieldVirus} size="2x"  />
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				
				<div className="row">

					

					<div className="col-xl-8 col-lg-5">
						<div className="card shadow mb-4">
							<div className="card-header py-3 d-flex flex-row align-items-center justify-content-between">
								<h6 className="m-0 font-weight-bold text-primary">Journals / Preprint Servers</h6>
								
							</div>
							<div className="card-body">

								<Bar
								  data={journalChartData}
								  width={100}
								  height={50}
								  options={{ 
									legend: { display: false }, 
									scales: { 
										xAxes: [{ticks: { autoSkip: false }}],
										yAxes: [{ scaleLabel: { display: true, labelString: '# of papers' } }] 
										} 
									}}
								/>
							
							</div>
						</div>
					</div>
					
					<div className="col-xl-4 col-lg-5">
						<div className="card shadow mb-4" style={{height:"95%"}}>
							<div className="card-header py-3 d-flex flex-row align-items-center justify-content-between">
								<h6 className="m-0 font-weight-bold text-primary">Peer-Reviewed Research</h6>
								
							</div>
							<div className="card-body">
								<Doughnut
									width={100}
									height={100}
									data={{
										labels: ["Peer Reviewed","Preprint"],
										datasets: [{
											data:[this.props.preprintCounts['peer_reviewed'],this.props.preprintCounts['preprint']],
											backgroundColor: ["#b3cde3","#ccebc5"]
											}]
										
									}}
									options={{ legend: { fontSize: 10}, cutoutPercentage: 70,  }}
								/>
							
							</div>
						</div>
					</div>
					
					
				</div>
				
				<div className="row">

					

					<div className="col-xl-6 col-lg-5">
						<div className="card shadow mb-4">
							<div className="card-header py-3 d-flex flex-row align-items-center justify-content-between">
								<h6 className="m-0 font-weight-bold text-primary">
									<Link href="/[id]" as="/therapeutics">
										<a>Therapeutics</a>
									</Link>
								</h6>
								
							</div>
							<div className="card-body">

								{drugChart}
							
							</div>
						</div>
					</div>
					
					<div className="col-xl-6 col-lg-5">
						<div className="card shadow mb-4">
							<div className="card-header py-3 d-flex flex-row align-items-center justify-content-between">
								<h6 className="m-0 font-weight-bold text-primary">
									<Link href="/[id]" as="/vaccines">
										<a>Vaccine Types</a>
									</Link>
								</h6>
								
							</div>
							<div className="card-body">

								{vaccineChart}
							
							</div>
						</div>
					</div>
					
					
				</div>
				
				
				
				
				<div className="row">

					

					<div className="col-xl-6 col-lg-5">
						<div className="card shadow mb-4">
							<div className="card-header py-3 d-flex flex-row align-items-center justify-content-between">
								<h6 className="m-0 font-weight-bold text-primary">
									<Link href="/[id]" as="/riskfactors">
										<a>Risk Factors</a>
									</Link>
								</h6>
								
							</div>
							<div className="card-body">

								{riskfactorsChart}
							
							</div>
						</div>
					</div>
					
					<div className="col-xl-6 col-lg-5">
						<div className="card shadow mb-4">
							<div className="card-header py-3 d-flex flex-row align-items-center justify-content-between">
								<h6 className="m-0 font-weight-bold text-primary">
									<Link href="/[id]" as="/symptoms">
										<a>Symptoms</a>
									</Link>
								</h6>
								
							</div>
							<div className="card-body">

								{symptomsChart}
							
							</div>
						</div>
					</div>
					
					
				</div>

			</Layout>
		
		)
	}
}
