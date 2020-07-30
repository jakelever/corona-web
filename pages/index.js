import React, { Component } from 'react';
import Layout from '../components/Layout.js'
import CustomTable from '../components/CustomTable.js'

import Link from 'next/link'
import { Doughnut, Line, Bar } from 'react-chartjs-2';
import pages from '../lib/pages.json'

const db = require('../lib/db')
const escape = require('sql-template-strings')

import { getChartDataByVirusInTopic } from '../lib/db-main'

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

	SELECT * FROM
		(SELECT e_loc.entity_id as location_id, e_loc.name as name, e_virus.name as virus, c.longitude, c.latitude, COUNT(*) as count
		FROM annotations anno_loc, entities e_loc, coordinates c, annotations anno_virus, entities e_virus, entitytypes et_virus
		WHERE anno_loc.entity_id = e_loc.entity_id
		AND e_loc.entity_id = c.entity_id
		AND anno_loc.document_id = anno_virus.document_id
		AND anno_virus.entity_id = e_virus.entity_id
		AND e_virus.entitytype_id = et_virus.entitytype_id
		AND et_virus.name = 'Virus'
		GROUP BY name, virus, c.longitude, c.latitude) as tmp
	WHERE tmp.count > 5

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

	SELECT INSTR(LOWER(d.journal),'rxiv')>0 as preprint, COUNT(*) as count
	FROM documents d, annotations a
	WHERE d.document_id = a.document_id
	AND a.entity_id = ${researchID}
	GROUP BY preprint
    ORDER BY preprint

	`)
	counts = counts.map(r => Object.assign({},r))
	
	return {'peer_reviewed': counts[0].count, 'preprint': counts[1].count}
}

/*async function getChartDataByVirusAllTopics(entitytype,topLimit) {
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
}*/

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
	ORDER BY count
	`)
	
	// anno_topic.document_id < 5000 (for testing purposes only)
	
	counts = counts.map(r => Object.assign({},r))
	
	const topics = [...new Set(counts.map(c => c.topic))].sort();
	const viruses = [...new Set(counts.map(c => c.virus))].sort();
	
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

async function getRecentTrendingDocuments() {
	var documents = await db.query(escape`

	SELECT d.document_id, d.cord_uid, d.pubmed_id, d.title, d.url, d.journal, d.publish_year, d.publish_month, d.publish_day, d.doi, d.altmetric_id, d.altmetric_score, d.altmetric_score_1day, d.altmetric_score_1week, d.altmetric_openaccess, d.altmetric_badgetype
	FROM documents d
	WHERE d.altmetric_score_1day >= 10
		AND d.publish_year != ''
		AND d.publish_month != ''
		AND d.publish_day != ''
		AND DATEDIFF(CURDATE(), CONCAT_WS("-",d.publish_year,d.publish_month,d.publish_day)) < 14
	`)
	documents = documents.map(r => Object.assign({},r))
	
	var documentsByID = db.rowsToObject(documents,'document_id')
	
	var annotations = await db.query(escape`
	SELECT d.document_id, e.name as entity_name, et.name as entitytype_name
	FROM documents d, annotations a, entities e, entitytypes et 
	WHERE d.document_id = a.document_id
		AND d.altmetric_score_1day >= 10
		AND a.entity_id = e.entity_id 
		AND e.entitytype_id = et.entitytype_id
	`)
	annotations = annotations.map(r => Object.assign({},r))
	
	annotations.map(function(anno) {
		if (! (anno.document_id in documentsByID) )
			return false
		
		var doc = documentsByID[anno.document_id]
		const entity_name = anno.entity_name
		const entity_type = anno.entitytype_name
		
		const entity = {name: entity_name, type: entity_type}
		doc.entities.push(entity)
	})
	
	return Object.values(documentsByID)
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
	
	const drugData = await getChartDataByVirusInTopic('Therapeutics','Drug',20)
	const vaccineData = await getChartDataByVirusInTopic('Vaccines','Vaccine Type',20)
	const riskfactorsData = await getChartDataByVirusInTopic('Risk Factors','Risk Factor',20)
	const symptomsData = await getChartDataByVirusInTopic('Symptoms', 'Symptom',20)
	
	const summaryStatistics = await getSummaryStatistics()
	
	const journalCounts = await getJournalCounts(30)
	const preprintCounts = await getPreprintCounts()
	const topicCounts = await getTopicCountsByVirus()
	const popularLocations = await getPopularLocations()
	
	const recentTrending = await getRecentTrendingDocuments()
	
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
			popularLocations,
			recentTrending
		}
	}
}

export default class Home extends Component {
	constructor(props) {
		super(props)
		this.state = {
			viruses: ['MERS-CoV','SARS-CoV','SARS-CoV-2'],
			windowWidth: null
			}
			
		this.chartifyEntityData = this.chartifyEntityData.bind(this);
		this.updateViruses = this.updateViruses.bind(this);
		this.handleResize = this.handleResize.bind(this);
	}
	
	handleResize(windowWidth) {
		this.setState({windowWidth:windowWidth})
	}
	
	chartifyEntityData(chartdata,numberToShow) {
		var virus_text = this.state.viruses.join(',')
			
		var chosenData = chartdata[virus_text]
		
		var bardata = {
			labels: chosenData.labels.slice(0,numberToShow),
			datasets: chosenData.datasets.map( dataset => { return {label:dataset.label, data:dataset.data.slice(0,numberToShow)} } )
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
			maintainAspectRatio: false, 
			
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
						options={baroptions}
						responsive
					/>)
				
		return barChart
	}
	
	updateViruses(viruses) {
		this.setState({viruses: viruses})
	}
	
	render() {
		
		const trendingTableColumns = [
				{ "header":"Virus", "selector":"entities:Virus", "hide":"md", grow:1 },
				//{ "header":"Topics", "selector":"entities:topic", grow:2 },
				{ "header":"Journal", "selector":"journal", "hide":"md", grow:1 },
				{ "header":"Date", "selector":"publish_date", "hide":"md", grow:1 },
				{ "header":"Title", "selector":"title", linkInternal: true, grow:4 }
			]
			
		const trendingTable = <CustomTable columns={trendingTableColumns} data={this.props.recentTrending} showAltmetric1Day sort="altmetric_score_1day" altmetricHide="md" paginationPerPage={3} paginationRowsPerPageOptions={[3, 10, 15, 20, 25, 30]} />
		
		const minNumberToShow = 8, lowerWidthCutoff = 1200
		const maxNumberToShow = 30, upperWidthCutoff = 1600
		
		var numberToShow = minNumberToShow
		if (this.state.windowWidth == null) {
			numberToShow = minNumberToShow
		} else if (this.state.windowWidth < 600) {
			numberToShow = 15
		} else if (this.state.windowWidth < 768) {
			numberToShow = 20
		} else if (this.state.windowWidth < 992) {
			numberToShow = 15
		} else if (this.state.windowWidth < lowerWidthCutoff) {
			numberToShow = 8
		} else if (this.state.windowWidth > upperWidthCutoff) {
			numberToShow = maxNumberToShow
		} else {
			const alpha = (this.state.windowWidth-lowerWidthCutoff) / (upperWidthCutoff-lowerWidthCutoff)
			numberToShow = Math.round(minNumberToShow + alpha * (maxNumberToShow-minNumberToShow))
		}
		//numberToShow = 5
		
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
				labels:this.props.journalCounts.map(c => c.name).slice(0,numberToShow),
				datasets:[{data:this.props.journalCounts.map(c => c.count).slice(0,numberToShow),backgroundColor:'#fbb4ae'}]
				}
				
		const drugChart = this.chartifyEntityData(this.props.drugData,numberToShow)
		const vaccineChart = this.chartifyEntityData(this.props.vaccineData,numberToShow)
		const riskfactorsChart = this.chartifyEntityData(this.props.riskfactorsData,numberToShow)
		const symptomsChart = this.chartifyEntityData(this.props.symptomsData,numberToShow)
		
		var locationsToShowByID = {}
		this.props.popularLocations.filter( loc => this.state.viruses.includes(loc.virus)).forEach( loc => {
			locationsToShowByID[loc.location_id] = loc
		})
		const locationsToShow = Object.values(locationsToShowByID)
		
		return (
			<Layout title="Dashboard" page="/" updateViruses={this.updateViruses} showVirusSelector handleResize={this.handleResize}>

				{/* Page Heading */}
				<div className="d-sm-flex align-items-center justify-content-between mb-4">
					<h1 className="h3 mb-0 text-gray-800">CoronaCentral Dashboard</h1>
				</div>
				<div className="d-sm-flex align-items-center justify-content-between mb-4">
					<h3 className="h6 mb-0 text-gray-800"></h3>
				</div>
				
				<div className="row">
					<div className="quarter_then_half_then_full_col mb-4">

					  <div className="card shadow mb-4 h-100">
						<div className="card-header py-3">
						  <h6 className="m-0 font-weight-bold text-primary">Overview</h6>
						</div>
						<div className="card-body">
						  <p>
							This resource surveys published papers and preprints for <b>SARS-CoV-2</b>, <b>MERS-CoV</b> and <b>SARS-CoV</b>. Select a <b>topic</b> from the left, or <b>search</b> for subjects of interest above. You can narrow in on a specific virus using the selector in the top-right.
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
					
					<div className="quarter_then_half_then_full_col mb-4">
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
					
					<div className="quarter_then_half_then_full_col mb-4">
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
					
					<div className="quarter_then_half_then_full_col mb-4">
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


					
				<div className="card shadow mb-4">
					<div className="card-header py-3">
						<h6 className="m-0 font-weight-bold text-primary">Recent & Trending Papers</h6>
					</div>
					<div className="card-body">
						{trendingTable}
					</div>
				</div>
				
				
				<div className="card shadow mb-4" style={{minHeight:"400px"}}>
					<div className="card-header py-3">
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
						    maintainAspectRatio: false,
							legend: { display: true }, 
							scales: { 
								xAxes: [{ stacked:true, ticks: { autoSkip: false }}],
								yAxes: [{ scaleLabel: { display: true, labelString: '# of papers' } }] 
								} 
							}}
						/>
					</div>
				</div>
				
								
				<div className="card shadow mb-4">
					<div className="card-header py-3">
						<h6 className="m-0 font-weight-bold text-primary">Locations</h6>
					</div>
					<div className="card-body">
						<div style={{width:"100%",height:"400px",backgroundColor:"#DDFFDD"}}>
							<DynamicMapComponent links={true} locations={locationsToShow} />
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

					

					<div className="col-md-6">
						<div className="card shadow mb-4" style={{minHeight:"400px"}}>
							<div className="card-header py-3 d-flex flex-row align-items-center justify-content-between">
								<h6 className="m-0 font-weight-bold text-primary">Journals / Preprint Servers</h6>
								
							</div>
							<div className="card-body">

								<Bar
									data={journalChartData}
									options={{ 
											maintainAspectRatio: false,
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
					
					<div className="col-md-6">
						<div className="card shadow mb-4" style={{minHeight:"400px"}}>
							<div className="card-header py-3 d-flex flex-row align-items-center justify-content-between">
								<h6 className="m-0 font-weight-bold text-primary">Peer-Reviewed Research</h6>
								
							</div>
							<div className="card-body">
								<Doughnut
									data={{
										labels: ["Peer Reviewed","Preprint"],
										datasets: [{
											data:[this.props.preprintCounts['peer_reviewed'],this.props.preprintCounts['preprint']],
											backgroundColor: ["#b3cde3","#ccebc5"]
											}]
										
									}}
									options={{ 
										maintainAspectRatio: false,
										legend: { fontSize: 10}, 
										cutoutPercentage: 70,  
										}}
								/>
							
							</div>
						</div>
					</div>
					
					
				</div>
				
				<div className="row">

					

					<div className="col-md-6">
						<div className="card shadow mb-4" style={{minHeight:"400px"}}>
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
					
					<div className="col-md-6">
						<div className="card shadow mb-4" style={{minHeight:"400px"}}>
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

					

					<div className="col-md-6">
						<div className="card shadow mb-4" style={{minHeight:"400px"}}>
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
					
					<div className="col-md-6">
						<div className="card shadow mb-4" style={{minHeight:"400px"}}>
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
