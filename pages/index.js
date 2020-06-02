import Head from 'next/head'
import Sidebar from '../components/Sidebar.js'
import Topbar from '../components/Topbar.js'

import { Doughnut, Line } from 'react-chartjs-2';

const db = require('../lib/db')
const escape = require('sql-template-strings')


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
	
	var result = await db.query(escape`

	SELECT COUNT(*) as count
	FROM entities e, entitytypes et
	WHERE e.entitytype_id = et.entitytype_id
	AND et.entitytype_name = 'topic'

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

	SELECT entity_name, publish_year, COUNT(*) as count FROM (
	SELECT * FROM
		(SELECT a.document_id as document_id1,e.entity_name 
		FROM annotations a, entities e, entitytypes et 
		WHERE a.entity_id = e.entity_id 
			AND e.entitytype_id = et.entitytype_id 
			AND et.entitytype_name = 'virus') as tmp1 
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

	SELECT entity_name, COUNT(*) as count FROM (
	SELECT * FROM
		(SELECT a.document_id as document_id1,e.entity_name 
		FROM annotations a, entities e, entitytypes et 
		WHERE a.entity_id = e.entity_id 
			AND e.entitytype_id = et.entitytype_id 
			AND et.entitytype_name = 'virus') as tmp1 
		JOIN 
			(SELECT d.document_id as document_id2, d.publish_year 
			FROM documents d) as tmp2 
		ON tmp1.document_id1 = tmp2.document_id2) as tmp3 
	GROUP BY entity_name

	`)
	counts = counts.map(r => Object.assign({},r))
	
	return Object.values(counts)
}


function chartifyEntityYearData(data) {
	data = data.filter(d => d.publish_year && d.entity_name )
	const entities = [...new Set(data.map(d => d.entity_name))]
	//console.log(entities)
	const minYear = Math.min(...data.map(d => d.publish_year))
	const maxYear = Math.max(...data.map(d => d.publish_year))
	
	var unrolled = {}
	data.forEach(d => {
		//console.log(d)
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
	//console.log(index) 
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
	//console.log(index) 
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
	const virusCounts = await getVirusCounts()
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
	//setAreaChartColors(virusByYearsPlotData, 'SARS-CoV-2', '102,194,165')
	//setAreaChartColors(virusByYearsPlotData, 'SARS-CoV', '252,141,98')
	//setAreaChartColors(virusByYearsPlotData, 'MERS-CoV', '141,160,203')
	reorderDatasets(virusByYearsPlotData, ['SARS-CoV','MERS-CoV','SARS-CoV-2'])
	//console.log(virusByYearsPlotData)
	
	var labels = virusCounts.map(v => v.entity_name)
	var datasets = [{data: virusCounts.map(v => v.count), backgroundColor: virusCounts.map(v => "rgba("+virusColors[v.entity_name]+", 1)") }]
	
	var virusCountsPlotData = { 
		labels: labels,
		datasets: datasets
	}
	
	//console.log(datasets)
	
	//setDoughnutColors(virusCountsPlotData, 'SARS-CoV-2', '102,194,165')
	//setDoughnutColors(virusCountsPlotData, 'SARS-CoV', '102,194,165')
	//setDoughnutColors(virusCountsPlotData, 'MERS-CoV', '102,194,165')
	
	
	return {
		props: {
			virusCountsPlotData,
			virusByYearsPlotData,
			journalCounts,
			summaryStatistics
		}
	}
}

//$colors['SARS-CoV-2'] = "102,194,165";
//$colors['SARS-CoV'] = "252,141,98";
//$colors['MERS-CoV'] = "141,160,203";

export default function Home(props) {
	
	//console.log(props.journalCounts.length)
	
	
	return (
		<div id="wrapper">
			{/* Page Wrapper */}
			<Head>
				<title>CoronaHub</title>
			</Head>

			<Sidebar page="/" />

			{/* Content Wrapper */}
			<div id="content-wrapper" className="d-flex flex-column">

				{/* Main Content */}
				<div id="content">

					<Topbar />

					{/* Begin Page Content */}
					<div className="container-fluid">

						{/* Page Heading */}
						<div className="d-sm-flex align-items-center justify-content-between mb-4">
							<h1 className="h3 mb-0 text-gray-800">Dashboard</h1>
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

							{/* Area Chart */}
							<div className="col-xl-8 col-lg-7">
								<div className="card shadow mb-4">
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
										
											<Line
												data={{
													labels: props.virusByYearsPlotData.labels,
													datasets: props.virusByYearsPlotData.datasets
												}}
												options={{ maintainAspectRatio: false }}
											/>
										</div>
									</div>
								</div>
							</div>

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
											
											<Doughnut
												data={{
													labels: props.virusCountsPlotData.labels,
													datasets: props.virusCountsPlotData.datasets
												}}
												options={{ maintainAspectRatio: false, legend: false }}
											/>
										</div>
									</div>
								</div>
							</div>
						</div>

						{/* Content Row */}
						<div className="row">

							{/* Content Column */}
							<div className="col-lg-6 mb-4">

								{/* Project Card Example */}
								<div className="card shadow mb-4">
									<div className="card-header py-3">
										<h6 className="m-0 font-weight-bold text-primary">Projects</h6>
									</div>
									<div className="card-body">
										<h4 className="small font-weight-bold">Server Migration <span className="float-right">20%</span></h4>
										<div className="progress mb-4">
											<div className="progress-bar bg-danger" role="progressbar" style={{width: "20%"}} aria-valuenow="20" aria-valuemin="0" aria-valuemax="100"></div>
										</div>
										<h4 className="small font-weight-bold">Sales Tracking <span className="float-right">40%</span></h4>
										<div className="progress mb-4">
											<div className="progress-bar bg-warning" role="progressbar" style={{width: "40%"}} aria-valuenow="40" aria-valuemin="0" aria-valuemax="100"></div>
										</div>
										<h4 className="small font-weight-bold">Customer Database <span className="float-right">60%</span></h4>
										<div className="progress mb-4">
											<div className="progress-bar" role="progressbar" style={{width: "60%"}} aria-valuenow="60" aria-valuemin="0" aria-valuemax="100"></div>
										</div>
										<h4 className="small font-weight-bold">Payout Details <span className="float-right">80%</span></h4>
										<div className="progress mb-4">
											<div className="progress-bar bg-info" role="progressbar" style={{width: "80%"}} aria-valuenow="80" aria-valuemin="0" aria-valuemax="100"></div>
										</div>
										<h4 className="small font-weight-bold">Account Setup <span className="float-right">Complete!</span></h4>
										<div className="progress">
											<div className="progress-bar bg-success" role="progressbar" style={{width: "100%"}} aria-valuenow="100" aria-valuemin="0" aria-valuemax="100"></div>
										</div>
									</div>
								</div>

								{/* Color System */}
								<div className="row">
									<div className="col-lg-6 mb-4">
										<div className="card bg-primary text-white shadow">
											<div className="card-body">
												Primary
												<div className="text-white-50 small">#4e73df</div>
											</div>
										</div>
									</div>
									<div className="col-lg-6 mb-4">
										<div className="card bg-success text-white shadow">
											<div className="card-body">
												Success
												<div className="text-white-50 small">#1cc88a</div>
											</div>
										</div>
									</div>
									<div className="col-lg-6 mb-4">
										<div className="card bg-info text-white shadow">
											<div className="card-body">
												Info
												<div className="text-white-50 small">#36b9cc</div>
											</div>
										</div>
									</div>
									<div className="col-lg-6 mb-4">
										<div className="card bg-warning text-white shadow">
											<div className="card-body">
												Warning
												<div className="text-white-50 small">#f6c23e</div>
											</div>
										</div>
									</div>
									<div className="col-lg-6 mb-4">
										<div className="card bg-danger text-white shadow">
											<div className="card-body">
												Danger
												<div className="text-white-50 small">#e74a3b</div>
											</div>
										</div>
									</div>
									<div className="col-lg-6 mb-4">
										<div className="card bg-secondary text-white shadow">
											<div className="card-body">
												Secondary
												<div className="text-white-50 small">#858796</div>
											</div>
										</div>
									</div>
								</div>

							</div>

							<div className="col-lg-6 mb-4">

								{/* Illustrations */}
								<div className="card shadow mb-4">
									<div className="card-header py-3">
										<h6 className="m-0 font-weight-bold text-primary">Illustrations</h6>
									</div>
									<div className="card-body">
										<div className="text-center">
											<img className="img-fluid px-3 px-sm-4 mt-3 mb-4" style={{width: "25rem"}} src="img/undraw_posting_photo.svg" alt="" />
										</div>
										<p>Add some quality, svg illustrations to your project courtesy of <a target="_blank" rel="nofollow" href="https://undraw.co/">unDraw</a>, a constantly updated collection of beautiful svg images that you can use completely free and without attribution!</p>
										<a target="_blank" rel="nofollow" href="https://undraw.co/">Browse Illustrations on unDraw &rarr;</a>
									</div>
								</div>

								{/* Approach */}
								<div className="card shadow mb-4">
									<div className="card-header py-3">
										<h6 className="m-0 font-weight-bold text-primary">Development Approach</h6>
									</div>
									<div className="card-body">
										<p>SB Admin 2 makes extensive use of Bootstrap 4 utility classes in order to reduce CSS bloat and poor page performance. Custom CSS classes are used to create custom components and custom utility classes.</p>
										<p className="mb-0">Before working with this theme, you should become familiar with the Bootstrap framework, especially the utility classes.</p>
									</div>
								</div>

							</div>
						</div>

					</div>
					{/* /.container-fluid */}

				</div>
				{/* End of Main Content */}

				{/* Footer */}
				<footer className="sticky-footer bg-white">
					<div className="container my-auto">
						<div className="copyright text-center my-auto">
							<span>Copyright &copy; Your Website 2019</span>
						</div>
					</div>
				</footer>
				{/* End of Footer */}

			</div>
			{/* End of Content Wrapper */}

		</div>
	)
}
