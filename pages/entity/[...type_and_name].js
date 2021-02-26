import React, { Component } from 'react';
import Link from 'next/link'

import Layout from '../../components/Layout.js'
import CustomTable from '../../components/CustomTable.js'
import DataTable from 'react-data-table-component';

import DropdownButton from 'react-bootstrap/DropdownButton'
import Dropdown from 'react-bootstrap/Dropdown'

import entitypages from '../../lib/entitypages.json'

//import { getAllEntities } from '../../lib/db-entity.js'
import { getEntity, getPapersWithEntity, getEntityCountsByVirus } from '../../lib/db-entity.js'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDownload } from '@fortawesome/free-solid-svg-icons'
import { faSortDown } from '@fortawesome/free-solid-svg-icons'
import { Bar } from 'react-chartjs-2';
import viruscolors from '../../lib/viruscolors.json'

import dynamic from 'next/dynamic'

const DynamicMapComponent = dynamic(
  () => import('../../components/Map'),
  { ssr: false }
)

export async function getStaticPaths() {
	// A workaround for NextJS error (below) with fallback: true
	// Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client
	/*const isDevelopment = (process.env.NODE_ENV == 'development')
	const entities = isDevelopment ? await getAllEntities() : []
	
	const paths = entities.map( e => {
		return {params: {type_and_name: [e.entity_type,e.entity_name]}}
	} )*/
	
	const paths = []
	
	return {
		paths,
		fallback: true
	}
}

export async function getStaticProps({ params }) {	
	const entity_type = params.type_and_name[0]
	const entity_name = params.type_and_name.length > 1 ? params.type_and_name.slice(1).join('/') : 'all'
	
	var page_info = null
	var entity = null
	var tabledata = null
	if (entity_name == 'all') {
		const page_infos = entitypages.filter( p => p.entity_type == entity_type )
		page_info = page_infos.length == 1 ? page_infos[0] : null
		tabledata = page_info ? await getEntityCountsByVirus(entity_type) : null
	} else {
		entity = await getEntity(entity_type, entity_name)
		tabledata = entity ? await getPapersWithEntity(entity.entity_id) : null
	}
	
	const page_name = "/entity/" + entity_type + "/" + entity_name
	
	return {
		props: {
			fallback_complete: true,
			entity_type,
			entity_name,
			page_name,
			page_info,
			entity,
			tabledata
		}
	}
}

function trimStringToLength(s, max_length) {
	return s.length > max_length ? s.substring(0, max_length - 3) + "..." : s
}

export default class EntityPage extends Component {
	constructor(props) {
		super(props)
		this.state = {
			viruses: ['MERS-CoV','SARS-CoV','SARS-CoV-2'],
			windowWidth: null
			}
			
		this.handleResize = this.handleResize.bind(this);
		this.updateViruses = this.updateViruses.bind(this);
		
		this.renderAllPage = this.renderAllPage.bind(this);
		this.renderSinglePage = this.renderSinglePage.bind(this);
		
		this.exportData = this.exportData.bind(this);
	}
	
	handleResize(windowWidth) {
		this.setState({windowWidth:windowWidth})
	}
	
	updateViruses(viruses) {
		this.setState({viruses: viruses})
	}
	
	
	// https://codepen.io/Jacqueline34/pen/pyVoWr
	exportData(event, data, format) {
		
		const allowedCols = ['doi','pubmed_id','cord_uid','title','journal','is_preprint','publish_year','publish_month','publish_day','url','entities']
		
		var filename, dataDump
		if (format == 'csv') {
			var headers = [ "name" ,"SARS-CoV-2","MERS-CoV","SARS-CoV","total" ]
			
			const csvified = data.map( row => {
				const rowData = headers.map( e => row[e] )
				
				const asCSV = rowData.map(f => (typeof f == 'string' ? '"'+f.replaceAll('"','""')+'"' : f)).join(',')
				
				return asCSV
			})
			
			headers[0] = this.props.entity_type
			
			const headersAsCSV = headers.map( h => '"'+h+'"' ).join(',')
			
			const dataWithHeaders = [headersAsCSV].concat(csvified)
			
			filename = 'coronacentral_data.csv'
			dataDump = dataWithHeaders.join('\n')
			dataDump = `data:text/csv;charset=utf-8,${dataDump}`
			
		} else {
			filename = 'coronacentral_data.json'
			dataDump = JSON.stringify(data)
			dataDump = `data:text/json;charset=utf-8,${dataDump}`
		}

		const link = document.createElement('a')
		link.setAttribute('href', encodeURI(dataDump))
		link.setAttribute('download', filename)
		link.click()
		
		event.preventDefault()
	}
	
	renderAllPage() {
		
		

		const customStyles = {
			headRow: {
				style: {
					border: 'none',
				},
			},
			headCells: {
				style: {
					color: '#202124',
					fontSize: '18px',
				},
			},
			pagination: {
				style: {
					border: 'none',
				},
			},
		}
		
		const columns = [
			{
				name: this.props.entity_type,
				selector: 'name',
				sortable: true,
				style: {
				  fontSize: '16px',
				  paddingLeft: '8px',
				  paddingRight: '8px',
				  paddingTop: '16px',
				  paddingBottom: '16px'
				},
				cell: (row => <Link href={"/entity/[...type_and_name]"} as={"/entity/"+this.props.entity_type+"/"+row.name} prefetch={false}><a>{row['name']}</a></Link>)
			},
			{
				name: '# of papers',
				selector: 'total',
				sortable: true,
				right: true,
				style: {
				  fontSize: '16px',
				  paddingLeft: '8px',
				  paddingRight: '8px',
				  paddingTop: '16px',
				  paddingBottom: '16px'
				}
			},
		];
		
		var filteredData = this.props.tabledata.slice()
		
		const viruses = this.state.viruses.length == 0 ? ['SARS-CoV-2','MERS-CoV','SARS-CoV'] : this.state.viruses
		
		this.props.tabledata.forEach( row => {			
			row['total'] = ( viruses.includes('SARS-CoV-2') ? row['SARS-CoV-2'] : 0 ) +
				( viruses.includes('MERS-CoV') ? row['MERS-CoV'] : 0 ) +
				( viruses.includes('SARS-CoV') ? row['SARS-CoV'] : 0 )
				
		})
		
		
		filteredData = filteredData.sort( (a,b) => b['total']-a['total'] ).filter( row => row['total'] > 0 )
		
		var chartLabels = []
		var chartDatasets = viruses.map( v => { return {'label':v,data: []} } )
		
		chartDatasets.forEach(dataset => {
				var rgb = viruscolors[dataset.label]
				dataset.backgroundColor = "rgba("+rgb+", 0.9)"
				dataset.borderColor = "rgba("+rgb+", 0.9)"
			})
		
		const minNumberToShow = 10, lowerWidthCutoff = 500
		const maxNumberToShow = 30, upperWidthCutoff = 1000
		
		var numberToShow = minNumberToShow
		if (this.state.windowWidth == null) {
			numberToShow = minNumberToShow
		} else if (this.state.windowWidth < lowerWidthCutoff) {
			numberToShow = minNumberToShow
		} else if (this.state.windowWidth > upperWidthCutoff) {
			numberToShow = maxNumberToShow
		} else {
			const alpha = (this.state.windowWidth-lowerWidthCutoff) / (upperWidthCutoff-lowerWidthCutoff)
			numberToShow = Math.round(minNumberToShow + alpha * (maxNumberToShow-minNumberToShow))
		} 
		
		filteredData.slice(0,numberToShow).forEach(row => {
			chartLabels.push(row['name'])
			viruses.forEach( (v,i) => {
				chartDatasets[i]['data'].push(row[v])
			})
		})
				
		const chartData = { 'labels': chartLabels, 'datasets':chartDatasets }
		
		const disableDownload = (filteredData.length == 0)
		
		const downloadButton = <Dropdown>
			<Dropdown.Toggle variant="oldprimary" id="dropdown-basic" size="sm" disabled={disableDownload}>
				<span className="text-white-50"><FontAwesomeIcon icon={faDownload} size="sm" width="0" /></span> <span className="d-none d-sm-inline-block">Export</span>
			</Dropdown.Toggle>

			<Dropdown.Menu>
				<Dropdown.Item href="#" onClick={e => this.exportData(e,filteredData,'csv')}>as CSV</Dropdown.Item>
				<Dropdown.Item href="#" onClick={e => this.exportData(e,filteredData,'json')}>as JSON</Dropdown.Item>
			</Dropdown.Menu>
		</Dropdown>
		
		const table = <DataTable
					noHeader
					columns={columns}
					data={filteredData}
					defaultSortAsc={false}
					customStyles={customStyles}
					keyField="name"
					pagination
					highlightOnHover
					responsive
					sortIcon={<FontAwesomeIcon icon={faSortDown} width="0" />}
				/>
		
		return (
			<Layout title={this.props.entity_type} page={this.props.page_name} viruses={this.state.viruses} updateViruses={this.updateViruses} showVirusSelector handleResize={this.handleResize}>
			
		
				<div className="d-sm-flex align-items-center justify-content-between mb-4 titlepadding">
					<h3 className="h3 mb-0 text-gray-800">{this.props.page_info.name}</h3>
				</div>
				
				<div style={{position: 'relative', width:'100%', minHeight:'300px'}}>
					<Bar
						data={chartData}
						options={{ 
								maintainAspectRatio: false,
								legend: { display: false }, 
								scales: {
									xAxes: [{
										stacked: true,
										ticks: {
											autoSkip: false
										}
									}],
									yAxes: [{
										stacked: true
									}]
								}
							}}
							
						/>
				</div>
				
				<div className="card shadow mb-4">
					<div className="card-header py-3">
						<div style={{display: "flex", justifyContent: "flex-end"}}>
						<div style={{flexGrow: 0}}>
							{downloadButton}
						</div>
						</div>
					</div>
					<div className="card-body-table" ref={this.anchorDiv} style={{position:"relative"}}>
						{table}
					</div>
				</div>
				
			</Layout>
		)
	}

	renderSinglePage() {					
		const defaultColumns = ["Virus","articletype","topic","journal","publish_timestamp","title","altmetric_score"]
			
		const table = <CustomTable defaultColumns={defaultColumns} data={this.props.tabledata} viruses={this.state.viruses} updateViruses={this.updateViruses} windowWidth={this.state.windowWidth} />
		
		var imgOrMap = ''
		if (this.props.entity.entity_type == 'Location') {
			
			const position = [ this.props.entity.latitude, this.props.entity.longitude ]
			imgOrMap = <div style={{width:"100%",height:"200px"}}>
								<DynamicMapComponent links={false} zoom={3} position={position} height="200px" locations={[{'name':this.props.entity.entity_name,'latitude':position[0],'longitude':position[1]}]} />
							</div>
		}
		
		const externalIDIsLikelyWikidata = this.props.entity.external_id.length >= 2 && this.props.entity.external_id.slice(0,1) == 'Q' && !isNaN(this.props.entity.external_id.slice(1,2))

		const wikidataLink = externalIDIsLikelyWikidata ? <div className="d-sm-flex align-items-center justify-content-between mb-4">
					<h6 className="h6 mb-0 text-gray-800">Wikidata: <a href={"https://www.wikidata.org/wiki/"+this.props.entity.external_id} target="_blank">{this.props.entity.external_id}</a></h6>
				</div> : ''

		return (
			<Layout title={this.props.entity.entity_name} page={null} viruses={this.state.viruses} updateViruses={this.updateViruses} showVirusSelector handleResize={this.handleResize}>
		
				{imgOrMap}
		
				<div className="d-sm-flex align-items-center justify-content-between mb-4 titlepadding">
					<h3 className="h3 mb-0 text-gray-800">{this.props.entity.entity_name} [<Link href={"/entity/[...type_and_name]"} as={"/entity/"+this.props.entity_type+"/all"} prefetch={false}><a>{this.props.entity.entity_type}</a></Link>]</h3>
				</div>
							
				<div className="titlepadding">
					{wikidataLink}
				</div>
				
				{table}
				
			</Layout>
		)
	}
	
	render() {
		if(!this.props.fallback_complete)
			return <Layout loading={true} handleResize={this.handleResize}></Layout>
		if (!this.props.tabledata)
			return <Layout error404={true} handleResize={this.handleResize}></Layout>
			
		if (this.props.entity_name == 'all')
			return this.renderAllPage()
		else
			return this.renderSinglePage()
	}
}

