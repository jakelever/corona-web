import React, { Component } from 'react';
import Link from 'next/link'

import FlagModal from '../components/FlagModal.js'

import pages from '../lib/pages.json'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFlag } from '@fortawesome/free-solid-svg-icons'
import { faSortDown } from '@fortawesome/free-solid-svg-icons'
import { faExclamationCircle, faExclamationTriangle, faExclamation } from '@fortawesome/free-solid-svg-icons'
import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons'

import DataTable from 'react-data-table-component';

// Links to the DataTable component for ease
// https://www.npmjs.com/package/react-data-table-component
// https://github.com/jbetancur/react-data-table-component

const shortMonths = ["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

function getColumnMetadata(column) {
	var metadata
	if (column.selector.startsWith('entities:')) {
		var entity_type = column.selector.substr('entities:'.length)
		
		var pageMapping = {}
		if (entity_type == 'topic') {
			pages.forEach(p => {pageMapping[p.name] = p.page})
		}
		
		metadata = {
			id: entity_type,
			name: column.header,
			sortable: false,
			width: '10%',
			style: {
			  fontSize: '16px',
			  padding: '14px'
			},
			wrap: true,
			cell: row => {
				var entities; 
				if (entity_type == 'topic') {
					entities = row.entities.filter( e => e.type==entity_type ).map( (e,i) => <Link key={'entitylink_'+i} href="/[id]" as={`/${pageMapping[e.name]}`}><a key={'entity_'+i}>{e.name}</a></Link> )
				} if (entity_type == 'Virus' || entity_type == 'pubtype') {
					entities = row.entities.filter( e => e.type==entity_type ).map( (e,i) => e.name )
				} else {
					entities = row.entities.filter( e => e.type==entity_type ).map( (e,i) => <Link key={'entitylink_'+i} href={"/entity/[...typename]"} as={"/entity/"+e.type+"/"+e.name}><a key={'entity_'+i}>{e.name}</a></Link> )
				}
				
				
				var combined = entities.length > 0 ? entities.reduce((prev, curr) => [prev, ', ', curr]) : ''
				
				return <div>{combined}</div>
			}
		}
	} else if (column.selector == 'publish_date') {
		metadata = {
			id: column.selector,
			name: column.header,
			selector: "publish_year",
			sortable: true,
			style: {
			  fontSize: '16px',
			  padding: '14px'
			},
			wrap: false, 
			sortFunction: (rowA, rowB) => {
				const dateA = (rowA.publish_year ? rowA.publish_year.toString().padStart(4,'0') : '0000') + (rowA.publish_month ? rowA.publish_month.toString().padStart(2,'0') : '00') + (rowA.publish_day ? rowA.publish_day.toString().padStart(2,'0') : '00')
				const dateB = (rowB.publish_year ? rowB.publish_year.toString().padStart(4,'0') : '0000') + (rowB.publish_month ? rowB.publish_month.toString().padStart(2,'0') : '00') + (rowB.publish_day ? rowB.publish_day.toString().padStart(2,'0') : '00')
				
				//console.log(dateA + " " + dateB)
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
			id: column.selector,
			name: column.header,
			selector: column.selector,
			sortable: true,
			style: {
			  fontSize: '16px',
			  padding: '14px'
			},
			wrap: true
		}
	}
	
	if (column.width) {
		metadata.width = column.width
	}
	
	if (column.linkExternal) {
		metadata.cell = row => <a href={row.url} target="_blank">{row[column.selector]}</a>
	}
	
	if (column.linkInternal) {
		metadata.cell = row => <Link href={"/doc/[id]"} as={"/doc/"+row.document_id} prefetch={false}><a>{row[column.selector]}</a></Link>
	}
	
	return metadata
}

export default class CustomTable extends Component {
	constructor(props) {
		super(props)
		this.state = {
			showFlagModal: false,
			modalKey: 0,
			flagModalDoc: null
			}
		
		this.closeFlagModal = this.closeFlagModal.bind(this);
		this.showFlagModal = this.showFlagModal.bind(this);
	}
	
	closeFlagModal() {
		this.setState({showFlagModal: false})
	}
	
	showFlagModal(doc) {
		this.setState({showFlagModal: true, flagModalDoc:doc, modalKey:this.state.modalKey+1 })
	}

	render() {
	
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
		
		const renderButtonColumn = row => {
			const flag = <a className="flagtime" href="#" onClick={event => {this.showFlagModal(row); event.preventDefault()}}><FontAwesomeIcon icon={faExclamationTriangle} size="lg" /></a>
			const linkDoc = <a className="flagtime" href={row.url} target="_blank"><FontAwesomeIcon icon={faExternalLinkAlt} size="lg" /></a>
			
			return <div><p>{linkDoc}</p><p>{flag}</p></div>
		}
		
		const flagButtonColumn = {
				id: 'buttonthing',
				cell: renderButtonColumn,
				ignoreRowClick: true,
				allowOverflow: true,
				button: true,
				style: {
				  padding: '14px'
				}
			}
			
			
		const renderAltmetricScore1Day = row => {
			if (row.altmetric_id == -1)
				return ''
			
			const badgeURL = "https://badges.altmetric.com/?size=64&score=" + row.altmetric_score_1day + "&types=" + row.altmetric_badgetype
			const detailsURL = "http://www.altmetric.com/details.php?citation_id=" + row.altmetric_id
			const img = <img src={badgeURL} />
			return <a href={detailsURL} target="_blank" alt={"Altmetric 1 day score of " + row.altmetric_score_1day}>{img}</a>
		}
		
		const altmetric1DayColumn = {
				id: 'altmetric_1day',
				name: 'Altmetric 1 Day',
				selector: 'altmetric_score_1day',
				cell: renderAltmetricScore1Day,
				sortable: true,
				allowOverflow: true,
				button: true,
			}
			
		const renderAltmetricBadge = row => {
			if (row.altmetric_id == -1)
				return ''
			
			const badgeURL = "https://badges.altmetric.com/?size=80&score=" + row.altmetric_score + "&types=" + row.altmetric_badgetype
			const detailsURL = "http://www.altmetric.com/details.php?citation_id=" + row.altmetric_id
			const img = <img src={badgeURL} />
			return <a href={detailsURL} target="_blank" alt={"Altmetric score of " + row.altmetric_score}>{img}</a>
		}
			
		const altmetricScoreColumn = {
				id: 'altmetric_score',
				name: 'Altmetric',
				selector: 'altmetric_score',
				cell: renderAltmetricBadge,
				sortable: true,
				allowOverflow: true,
				button: true,
			}

		var columnsWithFormating = this.props.columns.map( column => getColumnMetadata(column) )
		if (this.props.showAltmetric1Day)
			columnsWithFormating.push( altmetric1DayColumn )
		columnsWithFormating.push( altmetricScoreColumn )
		columnsWithFormating.push( flagButtonColumn )
		
		const table = <DataTable
					noHeader
					columns={columnsWithFormating}
					data={this.props.data}
					defaultSortField={this.props.sort ? this.props.sort : "altmetric_score"}
					defaultSortAsc={false}
					customStyles={customStyles}
					keyField="document_id"
					pagination
					highlightOnHover
					sortIcon={<FontAwesomeIcon icon={faSortDown} />}
				/>
				
		const modal = <FlagModal key={'flagmodal_'+this.state.modalKey} doc={this.state.flagModalDoc} show={this.state.showFlagModal} closeFunc={this.closeFlagModal} />
		
		return <div>{table}{modal}</div>
					
	}
}
