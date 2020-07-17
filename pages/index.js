import Layout from '../components/Layout.js'

import { Doughnut, Line } from 'react-chartjs-2';

//const db = require('../lib/db')
//const escape = require('sql-template-strings')


import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChessKnight } from '@fortawesome/free-solid-svg-icons'
import { faCalendarAlt } from '@fortawesome/free-solid-svg-icons'
import { faBookOpen } from '@fortawesome/free-solid-svg-icons'
import { faBrain } from '@fortawesome/free-solid-svg-icons'
import { faLightbulb } from '@fortawesome/free-solid-svg-icons'

import _ from 'lodash'

// https://stackoverflow.com/questions/2901102/how-to-print-a-number-with-commas-as-thousands-separators-in-javascript
function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/*async function getSummaryStatistics() {
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
	
	var result = await db.query(escape`

	SELECT COUNT(*) as count
	FROM entities e, entitytypes et
	WHERE e.entitytype_id = et.entitytype_id
	AND et.name = 'topic'

	`)
	const topicCount = result[0].count
	
	return {
		allDocCount,
		lastWeekDocCount,
		topicCount
	}
}


async function getVirusByYears() {
	var counts = await db.query(escape`

	SELECT name as entity_name, publish_year, COUNT(*) as count FROM (
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
	GROUP BY entity_name,publish_year

	`)
	counts = counts.map(r => Object.assign({},r))
	
	return Object.values(counts)
}

async function getJournalCounts() {
	var counts = await db.query(escape`

	SELECT journal, COUNT(*) as count
	FROM documents
	GROUP BY journal
	ORDER BY count DESC

	`)
	counts = counts.map(r => Object.assign({},r))
	
	return Object.values(counts)
}

async function getVirusCounts() {
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


function chartifyEntityYearData(data) {
	data = data.filter(d => d.publish_year && d.entity_name )
	const entities = [...new Set(data.map(d => d.entity_name))]
	
	const minYear = Math.min(...data.map(d => d.publish_year))
	const maxYear = Math.max(...data.map(d => d.publish_year))
	
	
	var unrolled = {}
	data.forEach(d => {
		if (! (d.entity_name in unrolled))
			unrolled[d.entity_name] = {}
		unrolled[d.entity_name][d.publish_year] = d.count
	})
	
	const converted = entities.map(e => _.range(minYear,maxYear+1).map(y => (e in unrolled && y in unrolled[e]) ? unrolled[e][y] : 0))
	
	var datasets = converted.map(function (d,i) { return {label:entities[i] ,data:d} })
	
	return { 
		labels: _.range(minYear,maxYear+1), 
		datasets: datasets
		}
}

function setAreaChartColors(data, label, rgb) {
	var index = data.datasets.map(ds => ds.label).indexOf(label)
	var dataset = data.datasets[index]
	
	dataset['backgroundColor'] = "rgba("+rgb+", 0.05)";
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
	/*const virusCounts = await getVirusCounts()
	const virusByYears = await getVirusByYears()
	const journalCounts = await getJournalCounts()
	const summaryStatistics = await getSummaryStatistics()
	
	var virusColors = {}
	virusColors['SARS-CoV-2'] = '102,194,165'
	virusColors['SARS-CoV'] = '252,141,98'
	virusColors['MERS-CoV'] = '141,160,203'
	
	var virusByYearsPlotData = chartifyEntityYearData(virusByYears)
	
	Object.keys(virusColors).forEach(virusName => {
		setAreaChartColors(virusByYearsPlotData, virusName, virusColors[virusName])
	})
	
	reorderDatasets(virusByYearsPlotData, ['SARS-CoV','MERS-CoV','SARS-CoV-2'])
	
	var labels = virusCounts.map(v => v.entity_name)
	var datasets = [{data: virusCounts.map(v => v.count), backgroundColor: virusCounts.map(v => "rgba("+virusColors[v.entity_name]+", 1)") }]
	
	var virusCountsPlotData = { 
		labels: labels,
		datasets: datasets
	}*/
	
	const summaryStatistics = {allDocCount:15, lastWeekDocCount:10, topicCount:1}
	
	return {
		props: {
			/*virusCountsPlotData,
			virusByYearsPlotData,
			journalCounts,*/
			summaryStatistics
		}
	}
}

export default function Home(props) {
	
	const lineoptions = { 
		maintainAspectRatio: false, 
		scales: {		
			yAxes: [{
				type: 'logarithmic'
			}]
		} 
	}
	
	return (
		<Layout title="Dashboard" page="/" showVirusSelector>

			{/* Page Heading */}
			<div className="d-sm-flex align-items-center justify-content-between mb-4">
				<h1 className="h3 mb-0 text-gray-800">Dashboard</h1>
			</div>
			<div className="d-sm-flex align-items-center justify-content-between mb-4">
				<h3 className="h6 mb-0 text-gray-800"></h3>
			</div>
			
			<div className="row">
				<div className="col-lg-4 mb-4">

				  <div className="card shadow mb-4 h-100">
					<div className="card-header py-3">
					  <h6 className="m-0 font-weight-bold text-primary">Overview</h6>
					</div>
					<div className="card-body">
					  <p>
						This resource surveys research papers for <a href="#">SARS-CoV-2</a>, <a href="#">MERS-CoV</a> and <a href="#">SARS-CoV</a>. Select a <a href="#">topic</a> from the left, or <a href="#">search</a> for subjects of interest above.
					  </p>
					  <p>
					    If you <a href="#">spot a mistake</a>, please flag it using the flag icon beside it.
				      </p>
					  <p>
					    For more information, use the <a href="#">Help</a> option, the <a href="#">Frequently Asked Questions</a> or the <a href="#">About</a> page.
					  </p>
					</div>
				  </div>
				</div>
				
				{/* Area Chart */}
				<div className="col-lg-8 mb-4">
					<div className="card shadow mb-4  h-100">
						{/* Card Header - Dropdown */}
						<div className="card-header py-3 d-flex flex-row align-items-center justify-content-between">
							<h6 className="m-0 font-weight-bold text-primary">Coronavirus Research</h6>
							<div className="dropdown no-arrow">
								<a className="dropdown-toggle" href="#" role="button" id="dropdownMenuLink" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
									<i className="fas fa-ellipsis-v fa-sm fa-fw text-gray-400"></i>
								</a>
								<div className="dropdown-menu dropdown-menu-right shadow animated--fade-in" aria-labelledby="dropdownMenuLink">
									<div className="dropdown-header">Dropdown Header:</div>
									<a className="dropdown-item" href="#">Action</a>
									<a className="dropdown-item" href="#">Another action</a>
									<div className="dropdown-divider"></div>
									<a className="dropdown-item" href="#">Something else here</a>
								</div>
							</div>
						</div>
						{/* Card Body */}
						<div className="card-body">
							<div className="chart-area">
							{/*<Line
									data={{
										labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
										datasets: [{
											label: '# of Votes',
											data: [12, 19, 3, 5, 2, 3],
										}]
									}}
									options={{ maintainAspectRatio: false, legend: false }}
							/>*/}
							
							{/*<Line
									data={{
										labels: props.virusByYearsPlotData.labels,
										datasets: props.virusByYearsPlotData.datasets
									}}
									options={lineoptions}
							/>*/}
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
									<div className="h5 mb-0 font-weight-bold text-gray-800">{numberWithCommas(props.summaryStatistics.allDocCount)}</div>
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
									<div className="h5 mb-0 font-weight-bold text-gray-800">{numberWithCommas(props.summaryStatistics.lastWeekDocCount)}</div>
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
									<div className="h5 mb-0 font-weight-bold text-gray-800">{props.summaryStatistics.topicCount}</div>
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
									<div className="text-xs font-weight-bold text-info text-uppercase mb-1">Machine Learning Accuracy</div>
									<div className="row no-gutters align-items-center">
										<div className="col-auto">
											<div className="h5 mb-0 mr-3 font-weight-bold text-gray-800">?</div>
										</div>
										<div className="col">
											<div className="progress progress-sm mr-2">
												<div className="progress-bar bg-info" role="progressbar" style={{width: "50%"}} aria-valuenow="50" aria-valuemin="0" aria-valuemax="100"></div>
											</div>
										</div>
									</div>
								
									
								</div>
								<div className="col-auto text-gray-300	">
									<FontAwesomeIcon icon={faBrain} size="2x"  />
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Content Row */}

			<div className="row">

				

				{/* Pie Chart */}
				<div className="col-xl-4 col-lg-5">
					<div className="card shadow mb-4">
						{/* Card Header - Dropdown */}
						<div className="card-header py-3 d-flex flex-row align-items-center justify-content-between">
							<h6 className="m-0 font-weight-bold text-primary">Virus Focus</h6>
							<div className="dropdown no-arrow">
								<a className="dropdown-toggle" href="#" role="button" id="dropdownMenuLink" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
									<i className="fas fa-ellipsis-v fa-sm fa-fw text-gray-400"></i>
								</a>
								<div className="dropdown-menu dropdown-menu-right shadow animated--fade-in" aria-labelledby="dropdownMenuLink">
									<div className="dropdown-header">Dropdown Header:</div>
									<a className="dropdown-item" href="#">Action</a>
									<a className="dropdown-item" href="#">Another action</a>
									<div className="dropdown-divider"></div>
									<a className="dropdown-item" href="#">Something else here</a>
								</div>
							</div>
						</div>
						{/* Card Body */}
						<div className="card-body">
							<div className="chart-pie pt-4 pb-2">
								
								{/*<Doughnut
									data={{
										labels: props.virusCountsPlotData.labels,
										datasets: props.virusCountsPlotData.datasets
									}}
									options={{ maintainAspectRatio: false, legend: false, cutoutPercentage: 70 }}
								/>*/}
							</div>
						</div>
					</div>
				</div>
			</div>

		</Layout>
	
	)
}
