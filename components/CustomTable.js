import React, { Component } from 'react';
import Link from 'next/link'

import FlagModal from '../components/FlagModal.js'
import ColumnSelector from '../components/ColumnSelector.js'
import SharePopover from '../components/SharePopover.js'

import { filterData } from '../lib/filterdata.js'

import pages from '../lib/pages.json'
import niceNames from '../lib/nicenames.json'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFlag } from '@fortawesome/free-solid-svg-icons'
import { faFilter } from '@fortawesome/free-solid-svg-icons'
import { faSortDown } from '@fortawesome/free-solid-svg-icons'
import { faExclamationCircle, faExclamationTriangle, faExclamation } from '@fortawesome/free-solid-svg-icons'
import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons'
import { faShareAlt } from '@fortawesome/free-solid-svg-icons'

import DataTable from 'react-data-table-component';


// Links to the DataTable component for ease
// https://www.npmjs.com/package/react-data-table-component
// https://github.com/jbetancur/react-data-table-component

const shortMonths = ["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]





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

export default class CustomTable extends Component {
	constructor(props) {
		super(props)
		
		const defaultColumns = 'defaultColumns' in this.props ? this.props.defaultColumns : ["Virus","journal","publish_timestamp","title","altmetric_score"]
		
		this.state = {
			showFlagModal: false,
			modalKey: 0,
			flagModalDoc: null,
			showColumnSelector: false,
			selectedColumns: defaultColumns,
			columnsToHideWhenSmall: ['Virus','journal','publish_timestamp'],
			filters: {},
			ranges: {}
			}
		
		this.anchorDiv = React.createRef();
		
		this.closeFlagModal = this.closeFlagModal.bind(this);
		this.showFlagModal = this.showFlagModal.bind(this);
		this.closeColumnSelector = this.closeColumnSelector.bind(this);
		this.openColumnSelector = this.openColumnSelector.bind(this);
		this.updateSelectedColumns = this.updateSelectedColumns.bind(this)
		this.stopHidingColumn = this.stopHidingColumn.bind(this)
		this.updateFilters = this.updateFilters.bind(this)
		this.updateRanges = this.updateRanges.bind(this)
		this.getColumnMetadata = this.getColumnMetadata.bind(this)
	}
	
	closeFlagModal() {
		this.setState({showFlagModal: false})
	}
	
	showFlagModal(doc) {
		this.setState({showFlagModal: true, flagModalDoc:doc, modalKey:this.state.modalKey+1 })
	}
	
	closeColumnSelector() {
		this.setState({showColumnSelector: false})
	}
	
	openColumnSelector(doc) {
		this.setState({showColumnSelector: true })
	}
	
	updateSelectedColumns(columnChanged, columns) {
		var columnsToHideWhenSmall = this.state.columnsToHideWhenSmall.slice()
		if (columnsToHideWhenSmall.includes(columnChanged))
			columnsToHideWhenSmall = columnsToHideWhenSmall.filter( c => c!=columnChanged )
		
		this.setState({selectedColumns:columns, columnsToHideWhenSmall:columnsToHideWhenSmall})
	}
	
	stopHidingColumn(columnToNotHide) {
		
	}
	
	updateFilters(filters) {
		this.setState({filters:filters})
		
		if ('Virus' in filters)
			this.props.updateViruses(filters.Virus)
		else
			this.props.updateViruses([])
	}
	
	updateRanges(ranges) {
		this.setState({ranges:ranges})
	}
	
	getColumnMetadata(column) {
		var metadata
		
		const nonEntities = ['journal','title','publish_timestamp','flagandlink','altmetric_score_1day','altmetric_score']
		
		const isEntity = !nonEntities.includes(column)
		
		if (column == 'flagandlink') {
			const renderButtonColumn = row => {
				const flag = <a className="flagtime" href="#" onClick={event => {this.showFlagModal(row); event.preventDefault()}}><FontAwesomeIcon icon={faExclamationTriangle} size="lg" /></a>
				
				// Preferentially use the DOI for the link
				const url = row.doi ? ('https://doi.org/' + row.doi) : row.url
				
				const linkDoc = <a className="flagtime" href={url} target="_blank"><FontAwesomeIcon icon={faExternalLinkAlt} size="lg" /></a>
								
				var urlToPage = 'https://coronacentral.ai'
				if (row.doi) {
					urlToPage += "/doc/doi/"+row.doi
				} else if (row.pubmed_id) {
					urlToPage += "/doc/pubmed_id/"+row.pubmed_id
				} else if (row.cord_uid) {
					urlToPage += "/doc/cord_uid/"+row.cord_uid
				}
								
				
				const share = <SharePopover title={row.title} url={urlToPage} container={this.anchorDiv}><a className="flagtime" href="#" onClick={event => event.preventDefault()}><FontAwesomeIcon icon={faShareAlt} size="lg" /></a></SharePopover>
				
				return <div className="tour-tablebuttons"><p>{linkDoc}</p><p>{flag}</p><p>{share}</p></div>
			}
			
			metadata = {
					id: 'flagandlink',
					cell: renderButtonColumn,
					ignoreRowClick: true,
					allowOverflow: true,
					button: true,
					hide: "sm",
					style: {
					  paddingTop: '14px',
					  paddingBottom: '14px'
					},
					grow: 1
			}
		} else if (column == 'altmetric_score') {
			const renderAltmetricBadge = row => {
				if (row.altmetric_id == -1)
					return ''
				
				const badgeURL = "https://badges.altmetric.com/?size=80&score=" + row.altmetric_score + "&types=" + row.altmetric_badgetype
				const detailsURL = "http://www.altmetric.com/details.php?citation_id=" + row.altmetric_id
				const img = <img src={badgeURL} />
				return <a className="tour-altmetric" href={detailsURL} target="_blank" alt={"Altmetric score of " + row.altmetric_score}>{img}</a>
			}
				
			metadata = {
					id: 'altmetric',
					name: 'Altmetric',
					selector: 'altmetric_score',
					cell: renderAltmetricBadge,
					sortable: true,
					allowOverflow: true,
					button: true,
					grow: 1
				}
		} else if (column == 'altmetric_score_1day') {
			const renderAltmetricScore1Day = row => {
				if (row.altmetric_id == -1)
					return ''
				
				const badgeURL = "https://badges.altmetric.com/?size=64&score=" + row.altmetric_score_1day + "&types=" + row.altmetric_badgetype
				const detailsURL = "http://www.altmetric.com/details.php?citation_id=" + row.altmetric_id
				const img = <img src={badgeURL} />
				return <a href={detailsURL} target="_blank" alt={"Altmetric 1 day score of " + row.altmetric_score_1day}>{img}</a>
			}
			
			metadata = {
					id: 'altmetric_1day',
					name: 'Altmetric 1 Day',
					selector: 'altmetric_score_1day',
					cell: renderAltmetricScore1Day,
					sortable: true,
					allowOverflow: true,
					button: true,
					grow: 1
				}
		} else if (isEntity) {
			var entity_type = column
			
			var pageMapping = {}
			if (entity_type == 'category') {
				pages.forEach(p => {pageMapping[p.name] = p.page})
			}
			
			metadata = {
				id: entity_type,
				name: column in niceNames ? niceNames[column] : column,
				sortable: false,
				//width: '10%',
				style: {
				  fontSize: '16px',
				  paddingLeft: '8px',
				  paddingRight: '8px',
				  paddingTop: '16px',
				  paddingBottom: '16px'
				},
				wrap: true,
				cell: row => {
					var entities; 
					if (entity_type == 'category') {
						entities = row.entities.filter( e => e.type==entity_type ).map( (e,i) => <Link key={'entitylink_'+i} href="/[id]" as={`/${pageMapping[e.name]}`}><a key={'entity_'+i}>{e.name}</a></Link> )
					} else if (entity_type == 'Virus') {
						entities = row.entities.filter( e => e.type==entity_type ).map( (e,i) => e.name )
					} else {
						entities = row.entities.filter( e => e.type==entity_type ).map( (e,i) => <Link key={'entitylink_'+i} href={"/entity/[...typename]"} as={"/entity/"+e.type+"/"+e.name}><a key={'entity_'+i}>{e.name}</a></Link> )
					}
					
					
					var combined = entities.length > 0 ? entities.reduce((prev, curr) => [prev, ', ', curr]) : ''
					
					return <div>{combined}</div>
				},
				grow: 2
			}
		} else if (column == 'publish_timestamp') {
			metadata = {
				id: column,
				name: 'Date',
				selector: "publish_year",
				sortable: true,
				style: {
				  fontSize: '16px',
				  paddingLeft: '8px',
				  paddingRight: '8px',
				  paddingTop: '16px',
				  paddingBottom: '16px'
				},
				wrap: false, 
				sortFunction: (rowA, rowB) => {
					const dateA = (rowA.publish_year ? rowA.publish_year.toString().padStart(4,'0') : '0000') + (rowA.publish_month ? rowA.publish_month.toString().padStart(2,'0') : '00') + (rowA.publish_day ? rowA.publish_day.toString().padStart(2,'0') : '00')
					const dateB = (rowB.publish_year ? rowB.publish_year.toString().padStart(4,'0') : '0000') + (rowB.publish_month ? rowB.publish_month.toString().padStart(2,'0') : '00') + (rowB.publish_day ? rowB.publish_day.toString().padStart(2,'0') : '00')
					
					return parseInt(dateA) - parseInt(dateB)
				},
				cell: row => { 
					/*if (row.publish_year && row.publish_month && row.publish_day) {
						return row.publish_year.toString() + "-" + row.publish_month.toString().padStart(2,'0') + "-" + row.publish_day.toString().padStart(2,'0')
					} else if (row.publish_year && row.publish_month) {
						return row.publish_year.toString() + "-" + row.publish_month.toString().padStart(2,'0')
					} else if (row.publish_year) {
						return row.publish_year.toString()
					} else {
						return ""
					}*/
					
					if (row.publish_year && row.publish_month && row.publish_day) {
						return row.publish_day.toString() + ' ' + shortMonths[row.publish_month] + ' ' + row.publish_year.toString()
					} else if (row.publish_year && row.publish_month) {
						return shortMonths[row.publish_month] + ' ' + row.publish_year.toString()
					} else if (row.publish_year) {
						return row.publish_year.toString()
					} else {
						return ""
					}
				}
			}
		} else {
			metadata = {
				id: column,
				name: column in niceNames ? niceNames[column] : column,
				selector: column,
				sortable: true,
				style: {
				  fontSize: '16px',
				  paddingLeft: '8px',
				  paddingRight: '8px',
				  paddingTop: '16px',
				  paddingBottom: '16px'
				},
				wrap: true,
				grow: 1
			}
		}
		
		/*if (column.grow) {
			metadata.grow = column.grow
		}
		if (column.minWidth) {
			metadata.minWidth = column.minWidth
		}
		if (column.maxWidth) {
			metadata.maxWidth = column.maxWidth
		}
		if (column.width) {
			metadata.width = column.width
		}
		
		if (column.hide) {
			metadata.hide = column.hide
		}
		
		if (column.linkExternal) {
			metadata.cell = row => <a href={row.url} target="_blank">{row[column.selector]}</a>
		}*/
		
		if (column == 'title') {
			const linkFunction = row => {
				if (row.doi) {
					return <Link href={"/doc/[...identifiers]"} as={"/doc/doi/"+row.doi} prefetch={false}><a>{row[column]}</a></Link>
				} else if (row.pubmed_id) {
					return <Link href={"/doc/[...identifiers]"} as={"/doc/pubmed_id/"+row.pubmed_id} prefetch={false}><a>{row[column]}</a></Link>
				} else if (row.cord_uid) {
					return <Link href={"/doc/[...identifiers]"} as={"/doc/cord_uid/"+row.cord_uid} prefetch={false}><a>{row[column]}</a></Link>
				} else {
					return row[column]
				}
			}
			
			metadata.cell = linkFunction
			metadata.grow = 4
		}
		
		if (column == 'Virus') {
			metadata.grow = 1
			//metadata.hide = "md"
		}
		
		if (column == 'journal' || column == 'publish_timestamp') {
			//metadata.hide = "md"
		}
		
		return metadata
	}
	
	/*componentDidUpdate(prevProps) {
		var newFilters = {}
		Object.keys(this.state.filters).forEach( k => {
			newFilters[k] = this.state.filters[k].slice()
		})
		
		newFilters['Virus'] = this.props.viruses
		this.updateFilters(newFilters)
	}*/

	render() {				
		var selectedColumns = this.state.selectedColumns.slice()
		if (!this.props.windowWidth || this.props.windowWidth < 992)
			selectedColumns = selectedColumns.filter( c => !this.state.columnsToHideWhenSmall.includes(c) )
		
		/*if (this.props.showAltmetric1Day)
			columnsToShow.push("altmetric_score_1day")
		if (!('altmetricHide' in this.props))
			columnsToShow.push("altmetric_score")*/
		
		var columnsToShow = selectedColumns.slice()
		columnsToShow.push("flagandlink")
		
		const orderRemapping = {
			'Virus':'!start 1',
			'date':'~end 1',
			'journal':'~end 2',
			'title':'~end 3',
			'altmetric_score_1day':'~end 4',
			'altmetric_score':'~end 5',
			'flagandlink': '~end 6'
		}
		
		columnsToShow = columnsToShow.sort( (a,b) => {
			const remapA = a in orderRemapping ? orderRemapping[a] : a
			const remapB = b in orderRemapping ? orderRemapping[b] : b
			
			if (remapA < remapB)
				return -1
			if (remapA > remapB)
				return 1
			return 0
		})
		
		

		var columnsWithFormating = columnsToShow.map( column => this.getColumnMetadata(column) )
		
		const optionalProps = ['paginationPerPage','paginationRowsPerPageOptions']
		var extraProps = {}
		
		optionalProps.forEach( p => {
			if (p in this.props)
				extraProps[p] = this.props[p]
		})
		
		const filteredData = filterData(this.props.data, this.state.filters, this.state.ranges, this.props.viruses)
		
		const table = <DataTable
					noHeader
					columns={columnsWithFormating}
					data={filteredData}
					defaultSortField={this.props.sort ? this.props.sort : "altmetric_score"}
					defaultSortAsc={false}
					customStyles={customStyles}
					keyField="document_id"
					pagination
					highlightOnHover
					responsive
					sortIcon={<FontAwesomeIcon icon={faSortDown} />}
					{...extraProps}
				/>
				
		const modal = <FlagModal key={'flagmodal_'+this.state.modalKey} doc={this.state.flagModalDoc} show={this.state.showFlagModal} closeFunc={this.closeFlagModal} />
		
		const title = 'title' in this.props ? this.props.title : "Published and Preprint Papers"
		
		const columnSelector = <ColumnSelector 
									show={this.state.showColumnSelector} 
									closeFunc={this.closeColumnSelector} 
									data={this.props.data} 
									selectedColumns={selectedColumns}
									updateSelectedColumns={this.updateSelectedColumns} 
									filters={this.state.filters} 
									updateFilters={this.updateFilters} 
									ranges={this.state.ranges}
									updateRanges={this.updateRanges}
									viruses={this.props.viruses}
									updateViruses={this.props.updateViruses}
									/>
									
		const columnSelectorButton = <a href="#" onClick={event => {this.openColumnSelector(); event.preventDefault()}} className="btn btn-sm btn-oldprimary shadow-sm">
							<span className="text-white-50"><FontAwesomeIcon icon={faFilter} size="sm" /></span> <span className="d-none d-sm-inline-block">Filter</span>
						</a>
						
		//const columnSelectorButton = ""
						
		// d-none d-lg-inline-block
		// Select/Filter Columns
				
		return <div className="card shadow mb-4">
					<div className="card-header py-3">
						<div style={{display: "flex"}}>
							<div style={{flexGrow: 8, paddingRight: "1em", paddingTop: "5px"}}>
								<h6 className="m-0 font-weight-bold text-primary">{title}</h6>
							</div>
							<div style={{flexGrow: 0}}>
								{columnSelectorButton}
							</div>
						</div>
					</div>
					<div className="card-body-table" ref={this.anchorDiv} style={{position:"relative"}}>
						{table}
						{modal}
						{columnSelector}
					</div>
				</div>
					
	}
}
