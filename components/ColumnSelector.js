import React, { Component } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form'

import Slider from '../components/Slider.js'

import { filterData } from '../lib/filterdata.js'

import niceNames from '../lib/nicenames.json'

import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'

import Card from 'react-bootstrap/Card'
import ListGroup from 'react-bootstrap/ListGroup'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronRight } from '@fortawesome/free-solid-svg-icons'

import _ from 'lodash'

export default class ColumnSelector extends Component {
	constructor (props) {
		super(props)
		
		this.entityTypes = [...new Set(this.props.data.map( doc => doc.entities.map( e => e.type) ).flat())].sort()
		
		this.topChoices = ['Virus','articletype','topic','journal','publish_timestamp','altmetric_score_1day','altmetric_score']
		this.otherChoices = this.entityTypes.filter(et => !this.topChoices.includes(et))
		
		this.state = {
			sliderValues: [30],
			rightPanel: this.topChoices[0]
		}
		
		this.toggleColumn = this.toggleColumn.bind(this)
		this.toggleFilter = this.toggleFilter.bind(this)
		this.changeRightPanel = this.changeRightPanel.bind(this)
		this.updateRange = this.updateRange.bind(this)
		this.clearFiltersAndRanges = this.clearFiltersAndRanges.bind(this)
	}
	
	updateRange(name,values) {
		var newRanges = Object.assign({}, this.props.ranges)
		
		if (name == 'publish_timestamp') {
			// Clean up timestamps to be at the beginning of the day
			var a = new Date(values[0]);
			const newTimestampA = (new Date(a.getFullYear(), a.getMonth(), a.getDate())).valueOf()
			var b = new Date(values[1]);
			const newTimestampB = (new Date(b.getFullYear(), b.getMonth(), b.getDate())).valueOf()
			const tidiedValues = [ newTimestampA, newTimestampB ]
			
			newRanges[name] = tidiedValues
		} else {
			newRanges[name] = values
		}
		
		this.props.updateRanges(newRanges)
	}
	
	clearFiltersAndRanges() {
		this.props.updateRanges({})
		this.props.updateFilters({})
		this.props.updateViruses(['MERS-CoV','SARS-CoV','SARS-CoV-2'])
	}
	
	toggleColumn(column,is_checked) {
		var newSelectedColumns = this.props.selectedColumns.filter( c => c!=column)
		if (is_checked) {
			newSelectedColumns.push(column)
		}
		this.props.updateSelectedColumns(column,newSelectedColumns)
	}
	
	toggleFilter(column,value,is_checked) {
		if (column == 'Virus') {
			var newViruses = this.props.viruses.filter( v => v!=value )
			if (is_checked)
				newViruses.push(value)
			newViruses = newViruses.sort()
			this.props.updateViruses(newViruses)
		} else {
			//var newFilters = Object.assign({}, this.props.filter);
			var newFilters = {}
			Object.keys(this.props.filters).forEach( k => {
				newFilters[k] = this.props.filters[k].slice()
			})
			
			//var newColumnFilter = []
			if ( column in newFilters ) {
				var newColumnFilter = newFilters[column].filter( v => v!=value)
				if (is_checked) {
					newColumnFilter.push(value)
				}
				
				if (newColumnFilter.length == 0)
					delete newFilters[column]
				else
					newFilters[column] = newColumnFilter
			} else if (is_checked) {
				newFilters[column] = [value]
			}
			this.props.updateFilters(newFilters)
		}
	}
	
	changeRightPanel(column) {
		this.setState({rightPanel: column})
	}

	render() {
		//onClick={event => this.toggleColumn(c)}
		
		const createListGroup = (c => {
			const name = c in niceNames ? niceNames[c] : c
			//const name = c
			//const isActive = this.state.columnsSelected.includes(c)
			const isActive = c in this.props.filters || c in this.props.ranges || ( c=='Virus' && this.props.viruses.length > 0 && this.props.viruses.length < 3 )
			const isRightPanel = this.state.rightPanel == c
			const isSelected = this.props.selectedColumns.includes(c)
			const isRightPanelClass = isRightPanel ? 'columnselector-selected' : ''
			var styling = {padding:"0.3em"}
			if (isRightPanel) {
				styling['color'] = "#FFFFFF"
				styling['backgroundColor'] = "#aaaaaa"
				styling['borderColor'] = "#aaaaaa"
			}
			// b01515
			// (isRightPanel || isActive) ? "columnchevron-selected" : "columnchevron"
			var chevronClass = "columnchevron"
			if (isRightPanel)
				chevronClass = "columnchevron-selected"
			else if (isActive)
				chevronClass = "columnchevron-active"
			return <ListGroup.Item key={"leftpanel_"+c} style={styling} active={isActive} onClick={event => this.changeRightPanel(c)}>
				<div style={{display:"flex"}}>
					<div style={{flexGrow: 1, flexShrink:1}}>
						<Form.Check 
							type="checkbox"
							id={"check_"+c}
							label={name}
							checked={isSelected}
							onChange={ synth_event => {this.toggleColumn(c,synth_event.target.checked);this.changeRightPanel(c)} }
						/>
					</div>
					<div className={chevronClass} style={{flexGrow: 0, flexShrink:0, flexBasis:'10px'}}>
						<FontAwesomeIcon icon={faChevronRight} size="lg" 
							onClick={event => this.changeRightPanel(c)}
						/>
					</div>
				</div>
			</ListGroup.Item>
		})
		
		const topGroups = this.topChoices.map(createListGroup)
		const otherGroups = this.otherChoices.map(createListGroup)
		
		var tmpFilters = Object.assign({}, this.props.filters)
		if (this.state.rightPanel in tmpFilters)
			delete tmpFilters[this.state.rightPanel]
		var tmpRanges = Object.assign({}, this.props.ranges)
		if (this.state.rightPanel in tmpRanges)
			delete tmpRanges[this.state.rightPanel]
		var tmpViruses = this.state.rightPanel == 'Virus' ? [] : this.props.viruses
		const filteredData = filterData(this.props.data, tmpFilters, tmpRanges, tmpViruses)
		
		const sliderFields = ['publish_timestamp','altmetric_score','altmetric_score_1day']
		var rightPanelChoices
		//if (this.state.rightPanel == 'publish_timestamp') {
		if (sliderFields.includes(this.state.rightPanel)) {
			const fieldName = this.state.rightPanel
			const isPublishTimestamp = (fieldName == 'publish_timestamp')
			//const minDate = + new Date(2010,10,1)
			const minVal = Math.min(... filteredData.map( doc => doc[fieldName] ) )
			
			const rightNow = new Date(Date.now())
			const startOfDay = (new Date(rightNow.getFullYear(), rightNow.getMonth(), rightNow.getDate())).valueOf()
			const maxVal = isPublishTimestamp ? startOfDay : Math.max(... filteredData.map( doc => doc[fieldName] ) )
			
			if (filteredData.length == 0 || minVal == maxVal) {
				rightPanelChoices = <Slider 
										disabled={true}
										min={1}
										max={9}
										values={[5]}
										onChange={values => this.updateRange(fieldName,values)}
										renderLabel={label => "Nothing to filter"}
										/>
			} else {
				//const maxDate = Math.max(... filteredData.map( doc => doc.publish_timestamp ) )
				const renderDate = (timestamp => {
											var a = new Date(timestamp);
											var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
											var year = a.getFullYear();
											var month = months[a.getMonth()];
											var day = a.getDate()
											return day + " " + month + " " + year
										})
				
				rightPanelChoices = <Slider 
										disabled={false}
										min={minVal}
										max={maxVal}
										values={ fieldName in this.props.ranges ? this.props.ranges[fieldName] : [ minVal, maxVal ] }
										onChange={values => this.updateRange(fieldName,values)}
										renderLabel={isPublishTimestamp ? renderDate : ( label => label )}
										/>
			}
		} else if (this.entityTypes.includes(this.state.rightPanel)) {
			const filter = this.state.rightPanel
			const filteredEntities = filteredData.map( doc => doc.entities.filter( e => e.type==filter && e.name ).map(e => e.name ) ).flat()
			const entityCounts = _.countBy(filteredEntities)
			
			var sortedEntityCounts 
			if (this.state.rightPanel == 'Virus') {
				sortedEntityCounts = [ 
					{ 'name':'SARS-CoV-2', 'count': ('SARS-CoV-2' in entityCounts ? entityCounts['SARS-CoV-2'] : 0) },
					{ 'name':'MERS-CoV', 'count': ('MERS-CoV' in entityCounts ? entityCounts['MERS-CoV'] : 0) },
					{ 'name':'SARS-CoV', 'count': ('SARS-CoV' in entityCounts ? entityCounts['SARS-CoV'] : 0) }
					]
				
			} else {
				const unsortedEntityCounts = Object.keys(entityCounts).map( e => { return {'name':e, 'count':entityCounts[e]}})
				
				sortedEntityCounts = unsortedEntityCounts.sort( (a,b) => {
					const aNameLower = a.name.toLowerCase(), bNameLower = b.name.toLowerCase()
					if (a.count < b.count)
						return 1
					if (a.count > b.count)
						return -1
					if (aNameLower < bNameLower)
						return -1
					if (aNameLower > bNameLower)
						return 1
					return 0
				})
			}
			
			var selected_vals = []
			if (this.state.rightPanel == 'Virus')
				selected_vals = this.props.viruses
			else if (this.state.rightPanel in this.props.filters)
				selected_vals = this.props.filters[this.state.rightPanel]
			
			if (sortedEntityCounts.length == 0) {
				rightPanelChoices = "Nothing to filter. Try clearing the filters (below) to see more articles."
			} else {
				rightPanelChoices = sortedEntityCounts.map( (ec,i) => {
					const label = ec.name + " (" + ec.count + ")"
					return <Form.Check 
						type="checkbox"
						key={"entity_"+i}
						id={"entity_"+i}
						label={label}
						checked={selected_vals.includes(ec.name)}
						onChange={ synth_event => this.toggleFilter(this.state.rightPanel,ec.name,synth_event.target.checked) }
					/>
				})
			}
		} else {
			const filter = this.state.rightPanel
			const attributes = filteredData.map( doc => doc[filter] ).filter( f => f )
			
			const attributeCounts = _.countBy(attributes)
			
			const unsortedAttributeCounts = Object.keys(attributeCounts).map( e => { return {'name':e, 'count':attributeCounts[e]}})
			
			const sortedAttributeCounts = unsortedAttributeCounts.sort( (a,b) => {
				const aNameLower = a.name.toLowerCase(), bNameLower = b.name.toLowerCase()
				if (a.count < b.count)
					return 1
				if (a.count > b.count)
					return -1
				if (aNameLower < bNameLower)
					return -1
				if (aNameLower > bNameLower)
					return 1
				return 0
			})
			
			const selected_vals = this.state.rightPanel in this.props.filters ? this.props.filters[this.state.rightPanel] : []
			
			if (sortedAttributeCounts.length == 0) {
				rightPanelChoices = "Nothing to filter. Try clearing the filters (below) to see more articles."
			} else {
				rightPanelChoices = sortedAttributeCounts.map( (ec,i) => {
					const label = ec.name + " (" + ec.count + ")"
					return <Form.Check 
						type="checkbox"
						key={"entity_"+i}
						id={"entity_"+i}
						label={label}
						checked={selected_vals.includes(ec.name)}
						onChange={ synth_event => this.toggleFilter(this.state.rightPanel,ec.name,synth_event.target.checked) }
					/>
				})
			}
		}
		
		const rightPanelName = this.state.rightPanel in niceNames ? niceNames[this.state.rightPanel] : this.state.rightPanel
		//const rightPanelName = this.state.rightPanel
		//const rightPanel = 
		//<ListGroup.Item active>Journal</ListGroup.Item>
		
		const allowFilterClear = Object.keys(this.props.filters).length > 0 || Object.keys(this.props.ranges).length > 0 || ( this.props.viruses.length > 0 && this.props.viruses.length < 3 )
		// minHeight:"200px", maxHeight:"400px", 
		return <Modal show={this.props.show} onHide={this.props.closeFunc} dialogClassName="modal-90w" centered>
				
		
				<Modal.Header closeButton>
					<Modal.Title>
						Select and Filter Columns
					</Modal.Title>
				</Modal.Header>
				<Modal.Body>
				<p>
					Select the columns to show using the checkboxes by the column names. Click the arrow, next to the column name, to see options for filtering on the right.
				</p>
					<Container>
          <Row style={{maxHeight:"400px"}}>
            <Col xs={5} style={{padding:0, border:"1px solid #DDDDDD"}}>
				<div style={{maxHeight:"400px", overflowY:"auto", padding:"0.5em", marginLeft:"0.1em", marginRight:"0.1em"}}>
				  <ListGroup variant="flush">
					{topGroups}
					<hr />
					{otherGroups}
				  </ListGroup>
				</div>
            </Col>
            <Col xs={7} style={{border:"1px solid #DDDDDD"}}>
				<div style={{minHeight:"200px", maxHeight:"400px", paddingTop:"0.5em", paddingBottom:"0.5em", overflowX:"hidden", overflowY:"auto", marginLeft:"0.1em"}}>
					
					<div style={{paddingBottom:"0.5em"}}><h5>{rightPanelName}</h5></div>
					{rightPanelChoices}
				</div>
            </Col>
          </Row>
        </Container>
				
				</Modal.Body>
				<Modal.Footer>
					<a href="#" onClick={event => {this.clearFiltersAndRanges(); event.preventDefault()}} className={"btn btn-sm btn-secondary shadow-sm " + ( allowFilterClear ? "" : "disabled") }>
							Clear Filters
						</a>
						<a href="#" onClick={event => {this.props.closeFunc(); event.preventDefault()}} className="btn btn-sm btn-oldprimary shadow-sm">
							View Papers
						</a>
				</Modal.Footer>

			</Modal>
	}
}