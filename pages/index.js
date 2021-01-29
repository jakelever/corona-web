import React, { Component } from 'react';

import Layout from '../components/Layout.js'
import CustomTable from '../components/CustomTable.js'
import SharePopover from '../components/SharePopover.js'

import { logEvent } from '../lib/analytics.js'

import { disableBodyScroll, enableBodyScroll } from 'body-scroll-lock'

import Toast from 'react-bootstrap/Toast'

import Link from 'next/link'
import { Doughnut, Line, Bar } from 'react-chartjs-2'
import pages from '../lib/pages.json'
import toursteps from '../lib/toursteps.json'
import viruscolors from '../lib/viruscolors.json'

import { getPopularLocations, getJournalCounts, getPreprintCounts } from '../lib/db-index'
import { getCategoryCountsByVirus, getSummaryStatistics, getVirusByDate } from '../lib/db-index'
import { getRecentTrendingDocuments } from '../lib/db-index'
import { getChartDataByVirusInCategory } from '../lib/db-main'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChessKnight } from '@fortawesome/free-solid-svg-icons'
import { faCalendarAlt } from '@fortawesome/free-solid-svg-icons'
import { faBookOpen } from '@fortawesome/free-solid-svg-icons'
import { faBrain } from '@fortawesome/free-solid-svg-icons'
import { faLightbulb } from '@fortawesome/free-solid-svg-icons'
import { faShieldVirus } from '@fortawesome/free-solid-svg-icons'
import { faShareAlt } from '@fortawesome/free-solid-svg-icons'

import _ from 'lodash'

import dynamic from 'next/dynamic'

const DynamicMapComponent = dynamic(
  () => import('../components/Map'),
  { ssr: false }
)

const DynamicTourComponent = dynamic(
  () => import('../components/Tour'),
  { ssr: false }
)

// https://stackoverflow.com/questions/2901102/how-to-print-a-number-with-commas-as-thousands-separators-in-javascript
function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

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

function decideBarchartCountUsingWidth(width) {
	const minNumberToShow = 8, lowerWidthCutoff = 200
	const maxNumberToShow = 30, upperWidthCutoff = 1200
	
	var numberToShow = minNumberToShow
	if (width == null) {
		numberToShow = minNumberToShow
	} /*else if (width < 600) {
		numberToShow = 15
	} else if (width < 768) {
		numberToShow = 20
	} else if (width < 992) {
		numberToShow = 15
	}*/ else if (width < lowerWidthCutoff) {
		numberToShow = minNumberToShow
	} else if (width > upperWidthCutoff) {
		numberToShow = maxNumberToShow
	} else {
		const alpha = (width-lowerWidthCutoff) / (upperWidthCutoff-lowerWidthCutoff)
		numberToShow = Math.round(minNumberToShow + alpha*alpha * (maxNumberToShow-minNumberToShow))
	}
	return numberToShow
}

export async function getStaticProps({ params }) {
	const virusByDate = await getVirusByDate()
	
	
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
	
	const drugData = await getChartDataByVirusInCategory('Therapeutics','Drug',20)
	const vaccineData = await getChartDataByVirusInCategory('Vaccines','Vaccine Type',20)
	const riskfactorsData = await getChartDataByVirusInCategory('Risk Factors','Risk Factor',20)
	const symptomsData = await getChartDataByVirusInCategory('Clinical Reports', 'Symptom',20)
	
	const summaryStatistics = await getSummaryStatistics()
	
	const journalCounts = await getJournalCounts(30)
	
	const preprintCounts = await getPreprintCounts()
	const categoryCounts = await getCategoryCountsByVirus()
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
			categoryCounts,
			popularLocations,
			recentTrending
		}
	}
}

function trimStringToLength(s, max_length) {
	return s.length > max_length ? s.substring(0, max_length - 3) + "..." : s
}

export default class Home extends Component {
	constructor(props) {
		super(props)
		this.state = {
			viruses: ['MERS-CoV','SARS-CoV','SARS-CoV-2'],
			windowWidth: null, col6Width: null, col9Width: null, col12Width: null,
			showTour: false,
			showTourToast: true
			}
			
		this.chartifyEntityData = this.chartifyEntityData.bind(this);
		this.updateViruses = this.updateViruses.bind(this);
		this.handleResize = this.handleResize.bind(this);
		this.startTour = this.startTour.bind(this);
		this.closeTour = this.closeTour.bind(this);
		this.closeTourToast = this.closeTourToast.bind(this);
		
		this.disableBody = target => disableBodyScroll(target)
		this.enableBody = target => enableBodyScroll(target)
		
		this.panelCol6 = React.createRef();
		this.panelCol9 = React.createRef();
		
		this.shareDiv = React.createRef();
	}
	
	startTour() {
		this.setState({showTour:true})
		logEvent('tour','started')
	}
	
	closeTourToast() {
		this.setState({showTourToast:false})
	}
	
	closeTour() {
		this.setState({showTour:false})
	}
	
	handleResize(windowWidth) {
		var updatedWidths = {}
		
		if (windowWidth)
			updatedWidths['windowWidth'] = windowWidth
		if (this.panelCol6.current != null && !isNaN(this.panelCol6.current.offsetWidth))
			updatedWidths['col6Width'] = this.panelCol6.current.offsetWidth
		if (this.panelCol9.current != null && !isNaN(this.panelCol9.current.offsetWidth))
			updatedWidths['col9Width'] = this.panelCol9.current.offsetWidth
		
		this.setState(updatedWidths)
	}
	
	chartifyEntityData(chartdata,numberToShow) {
		var virus_text = this.state.viruses.join(',')
			
		var chosenData = chartdata[virus_text]
		
		var bardata = {
			labels: chosenData.labels.slice(0,numberToShow),
			datasets: chosenData.datasets.map( dataset => { return {label:dataset.label, data:dataset.data.slice(0,numberToShow)} } )
		}
		
		
		bardata.datasets.forEach(dataset => {
			var rgb = viruscolors[dataset.label]
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
		
		const defaultColumns = ["category","journal","publish_timestamp","title","altmetric_score_1day"]
		const trendingTableTitle = <Link href="/trending" as="/trending"><a>Recent & Trending Articles</a></Link>
		const trendingTable = <CustomTable defaultColumns={defaultColumns} data={this.props.recentTrending} showAltmetric1Day sort="altmetric_score_1day" altmetricHide="md" paginationPerPage={3} paginationRowsPerPageOptions={[3, 10, 15, 20, 25, 30]} title={trendingTableTitle} viruses={this.state.viruses} updateViruses={this.updateViruses} windowWidth={this.state.windowWidth} />
		
		
		
		const viruses = ['SARS-CoV','MERS-CoV','SARS-CoV-2']
		const virusStartDates = { 'SARS-CoV-2': '2019-12', 'MERS-CoV': '2013-04', 'SARS-CoV': '2003-03' }
		const now = new Date(Date.now())
		const nowYearMonth = now.getFullYear().toString() + "-" + (now.getMonth()+1).toString().padStart(2,'0')
		var virusDatePlots = {}
		viruses.forEach( v => {
			
			var color = (this.state.viruses.length == 0 || this.state.viruses.includes(v)) ? "rgba("+viruscolors[v]+",1)" : "#CCCCCC"
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
			
			const virusStartDate = virusStartDates[v]
			//const dataStartIndex = data.findIndex(val => val > 0)
			const dataStartIndex = labels.findIndex(val => val==virusStartDate)
			const dataEndIndex = labels.findIndex(val => val==nowYearMonth)
			
			labels = labels.slice(dataStartIndex,dataEndIndex+1)
			data = data.slice(dataStartIndex,dataEndIndex+1)
			
			
			virusDatePlots[v] = <Bar
					data={{
						labels: labels,
						datasets: [{data:data, backgroundColor:color}]
					}}
					options={lineoptions}
			/>
		})
		
		const numberToShow_col6 = decideBarchartCountUsingWidth(this.state.col6Width)
		const numberToShow_col9 = decideBarchartCountUsingWidth(this.state.col9Width)
		
		const selected_viruses = this.state.viruses.length == 0 ? ['SARS-CoV-2','MERS-CoV','SARS-CoV'] : this.state.viruses
		this.props.categoryCounts.forEach( row => {			
			row['total'] = ( selected_viruses.includes('SARS-CoV-2') ? row['SARS-CoV-2'] : 0 ) +
				( selected_viruses.includes('MERS-CoV') ? row['MERS-CoV'] : 0 ) +
				( selected_viruses.includes('SARS-CoV') ? row['SARS-CoV'] : 0 )
				
		})
		
		const sortedCategoryCounts = this.props.categoryCounts.sort( (a,b) => b['total']-a['total'] )
		
		const categoryPlotDatasets = selected_viruses.map( v => {
			var dataset = {'label':v, 'data':sortedCategoryCounts.map( c => c[v] )}
			var rgb = viruscolors[v]
			dataset.backgroundColor = "rgba("+rgb+", 0.9)"
			dataset.borderColor = "rgba("+rgb+", 0.9)"
			return dataset
		} )
		
		const categoryPlotData = {
							  labels:sortedCategoryCounts.map( c => c['category'] ),
							  datasets:categoryPlotDatasets
						  }
		
		const journalChartData = {
				labels:this.props.journalCounts.map(c => c.name).slice(0,numberToShow_col9),
				datasets:[{data:this.props.journalCounts.map(c => c.count).slice(0,numberToShow_col9),backgroundColor:'#fbb4ae'}]
				}
				
		const drugChart = this.chartifyEntityData(this.props.drugData,numberToShow_col6)
		const vaccineChart = this.chartifyEntityData(this.props.vaccineData,numberToShow_col6)
		const riskfactorsChart = this.chartifyEntityData(this.props.riskfactorsData,numberToShow_col6)
		const symptomsChart = this.chartifyEntityData(this.props.symptomsData,numberToShow_col6)
		
		var locationsToShowByID = {}
		this.props.popularLocations.filter( loc => this.state.viruses.length == 0 || this.state.viruses.includes(loc.virus)).forEach( loc => {
			locationsToShowByID[loc.location_id] = loc
		})
		const locationsToShow = Object.values(locationsToShowByID)

		
		const tour = <DynamicTourComponent steps={toursteps} isOpen={this.state.showTour} onRequestClose={this.closeTour} onAfterOpen={this.disableBody} onBeforeClose={this.enableBody} scrollDuration={500} />
		
		const tourToast = <Toast show={this.state.showTourToast} onClose={this.closeTourToast}>
							<Toast.Header>
							  <strong className="mr-auto">Welcome</strong>
							</Toast.Header>
							<Toast.Body><a href="" onClick={event => {this.closeTourToast(); this.startTour(); event.preventDefault()}}>First time here? Click here for a tour</a></Toast.Body>
						  </Toast>
		
		
				/*<div style={{position: "relative"}} >
					<div style={{position: "absolute", top: "100%", right: "0%", zIndex: 10}}>
						{tourToast}
					</div>
				</div>*/
			
		
		return (
			<Layout title="Dashboard" page="/" viruses={this.state.viruses} updateViruses={this.updateViruses} showVirusSelector handleResize={this.handleResize} tourMode={this.state.showTour} toastInBottomRight={tourToast}>
		
				
				{tour}

				{/* Page Heading */}
				<div className="flex align-items-center justify-content-between mb-4 titlepadding" ref={this.shareDiv} style={{position:"relative"}}>
					<h1 className="h3 mb-0 text-gray-800">CoronaCentral Dashboard</h1>
					<SharePopover title="Check out the portal to the entire coronavirus research literature!" url="https://coronacentral.ai" container={this.shareDiv}>
						<a href="#" onClick={event => event.preventDefault()} className="inline-block btn btn-sm btn-info shadow-sm" target="_blank">
							<span className="text-white-50"><FontAwesomeIcon icon={faShareAlt} size="sm" /></span> Share
						</a>
					</SharePopover>
				</div>
				<div className="d-sm-flex align-items-center justify-content-between mb-4">
					<h3 className="h6 mb-0 text-gray-800"></h3>
				</div>
				
								
				<div className="row tour-beginning">
					<div className="quarter_then_half_then_full_col mb-4">

					  <div className="card shadow mb-4 h-100">
						<div className="card-header py-3">
						  <h6 className="m-0 font-weight-bold text-primary">Overview</h6>
						</div>
						<div className="card-body">
						  <p>
						  
							This resource surveys published papers and preprints for <b>SARS-CoV-2</b>, <b>MERS-CoV</b> and <b>SARS-CoV</b>. Select a <b>category</b> from the left, or <b>search</b> above.
						  </p>
						  <p>
							<a href="" onClick={event => {this.closeTourToast(); this.startTour(); event.preventDefault()}}>Take a tour!</a> We are constantly making improvements and value <Link href="/feedback" as="/feedback"><a>feedback</a></Link>. To get a daily update on the coronavirus literature, <a href="https://twitter.com/coronacentralai" target="_blank">follow us on Twitter!</a>
						  </p>
						  <p>
							Read the <a href="https://doi.org/10.1101/2020.12.21.423860" target="_blank">Preprint!</a> Supported by:
						  </p>
						  <div style={{maxWidth:"250px"}}>
							<a href="https://www.czbiohub.org/" target="_blank"><img width="100%" src="/CZBiohub.jpg" alt="Chan Zuckerberg Biohub" /></a>
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
					
				</div>

				<div className="tour-table">
					{trendingTable}
				</div>
				
				<div className="row">

					
					<div className="tour-categories col-md-12">
						<div className="card shadow mb-4" style={{minHeight:"400px"}}>
							<div className="card-header py-3 d-flex flex-row align-items-center justify-content-between">
								<h6 className="m-0 font-weight-bold text-primary">
									Categories
								</h6>
								
							</div>
							<div className="card-body">

								<Bar
						  data={categoryPlotData}
						  options={{ 
						    maintainAspectRatio: true,
							legend: { display: true }, 
							scales: { 
								xAxes: [{ stacked:true, ticks: { autoSkip: false }}],
								yAxes: [{ stacked:true, scaleLabel: { display: true, labelString: '# of papers' } }] 
								} 
							}}
						/>
							
							</div>
						</div>
					</div>
					
					
				</div>
				
								
				<div className="tour-locations card shadow mb-4">
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
										<div className="text-xs font-weight-bold text-warning text-uppercase mb-1">Categories Curated</div>
										<div className="h5 mb-0 font-weight-bold text-gray-800">{this.props.summaryStatistics.categoryCount}</div>
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
				
								
				<div className="row tour-sources">

					

					<div className="col-md-9">
						<div className="card shadow mb-4" style={{minHeight:"400px"}} ref={this.panelCol9}>
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
												xAxes: [
													{ ticks: { 
														autoSkip: false ,
														callback: function(value) {
															return trimStringToLength(value,40)
														}
													}}],
												yAxes: [{ scaleLabel: { display: true, labelString: '# of papers' } }] 
											} 
										}}
										
									/>
								
							
							</div>
						</div>
					</div>
					
					<div className="col-md-3">
						<div className="card shadow mb-4" style={{minHeight:"400px"}}>
							<div className="card-header py-3 d-flex flex-row align-items-center justify-content-between">
								<h6 className="m-0 font-weight-bold text-primary">Research Source</h6>
								
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
				
				<div className="tour-entities">
				<div className="row">

					

					<div className="col-md-6">
						<div className="card shadow mb-4" style={{minHeight:"400px"}} ref={this.panelCol6}>
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
									<Link href="/[id]" as="/clinicalreports">
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
				</div>

			</Layout>
		
		)
	}
}
