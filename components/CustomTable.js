import React, { Component } from 'react';
import Link from 'next/link'

import FlagModal from '../components/FlagModal.js'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFlag } from '@fortawesome/free-solid-svg-icons'
import { faSortDown } from '@fortawesome/free-solid-svg-icons'
import { faExclamationCircle, faExclamationTriangle, faExclamation } from '@fortawesome/free-solid-svg-icons'
import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons'

import DataTable from 'react-data-table-component';

// Links to the DataTable component for ease
// https://www.npmjs.com/package/react-data-table-component
// https://github.com/jbetancur/react-data-table-component

function getColumnMetadata(column) {
	var metadata
	if (column.selector.startsWith('entities:')) {
		var entity_type = column.selector.substr('entities:'.length)
		
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
				var entities = row.entities.filter( e => e.type==entity_type ).map( (e,i) => <Link key={'entitylink_'+i} href={"/entity/[...typename]"} as={"/entity/"+e.type+"/"+e.name}><a key={'entity_'+i}>{e.name}</a></Link> )
				
				var combined = entities.length > 0 ? entities.reduce((prev, curr) => [prev, ', ', curr]) : ''
				
				return <div>{combined}</div>
			}
		}
	}
	else {
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
		metadata.cell = row => <Link href={"/doc/[id]"} as={"/doc/"+row.document_id}><a>{row[column.selector]}</a></Link>
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
			}
			
		const renderAltmetricBadge = row => {
			if (row.altmetric_id == -1)
				return ''
			
			const badgeURL = "https://badges.altmetric.com/?size=64&score=" + row.altmetric_score + "&types=" + row.altmetric_badgetype
			const detailsURL = "http://www.altmetric.com/details.php?citation_id=" + row.altmetric_id
			const img = <img src={badgeURL} />
			return <a href={detailsURL} target="_blank">{img}</a>
		}
			
		const altmetricColumn = {
				id: 'altmetric',
				name: 'Altmetric',
				selector: 'altmetric_score',
				cell: renderAltmetricBadge,
				sortable: true,
				allowOverflow: true,
				button: true,
			}

		var columnsWithFormating = this.props.columns.map( column => getColumnMetadata(column) )
		columnsWithFormating.push( altmetricColumn )
		columnsWithFormating.push( flagButtonColumn )
		
		const table = <DataTable
					noHeader
					columns={columnsWithFormating}
					data={this.props.data}
					defaultSortField="altmetric_score"
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
