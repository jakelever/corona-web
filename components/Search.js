import React, { Component, Fragment } from 'react';
import { AsyncTypeahead, Typeahead, Highlighter, Menu, MenuItem, Hint, TypeaheadInputSingle } from 'react-bootstrap-typeahead'
import { Badge } from 'react-bootstrap';
import Router from 'next/router'

import { groupBy } from 'lodash';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSearch } from '@fortawesome/free-solid-svg-icons'

import pages from '../lib/pages.json'

export default class Search extends Component {
	constructor(props) {
		super(props)
		this.state = {
			input: '',
			isLoading: false,
			options: []
			}
			
		this.showGeneralSearch = false
			
		this.search = this.search.bind(this);
		this.onChange = this.onChange.bind(this);
		
		this.pageMapping = {}
		pages.forEach(p => {this.pageMapping[p.name] = p.page})
	}
	
	search(query) {
		this.setState({isLoading: true});
		fetch(`/api/search?q=${query}`)
		  .then(resp => resp.json())
		  .then(json => {
			  this.setState({isLoading: false,options: json})
			  });
	}
	
	onChange(selected) {
		if (selected.length == 1) {			
			const entity_name = selected[0].name
			const entity_type = selected[0].type
			
			if (entity_type == 'search') {
				url = "/search?q=" + this.state.input
				Router.push("/search",url)
			} else if (entity_type == 'category' && entity_name in this.pageMapping) {
				const url = "/" + this.pageMapping[entity_name]
				Router.push("/[id]",url)
			} else if (entity_type == 'Paper') {
				var url = null
				if (selected[0].doi)
					url = "/doc/doi/" + selected[0].doi
				else if (selected[0].pubmed_id)
					url = "/doc/pubmed_id/" + selected[0].pubmed_id
				else if (selected[0].cord_uid)
					url = "/doc/cord_uid/" + selected[0].cord_uid
				else if (selected[0].url)
					url = "/doc/url/" + encodeURIComponent(selected[0].url)
				
				if (url)
					Router.push("/doc/[...identifiers]",url)
			} else {
				const url = "/entity/" + entity_type + "/" + entity_name
				Router.push("/entity/[...typename]",url)
			}
		}
		//console.log('change!')
	}
	
	render() {
		
		const renderSearchRow = (option, props, index) => {
			return [
			<Highlighter key="name" search={props.text}>
				{option.name}
			</Highlighter>,
			option.type == 'search' ? '' : <div key="type" style={{float:"right"}}>
				<Badge variant="secondary">
					{option.type}
				</Badge>
			</div>,
			];
		}
		  
		/*const optionsWithGeneralSearch = [
		{'name':'Search for papers containing "Glasgow"', 'type':'Moo'},
		...this.state.options
		]*/
		
		/*const renderMenu = (results, menuProps, state) => {
			let index = 0;
			const types = groupBy(results, 'type');
			const items = Object.keys(types).sort().map((type) => (
				<Fragment key={type}>
					{index !== 0 && <Menu.Divider />}
					<Menu.Header>{type}</Menu.Header>
					{types[type].map((i) => {
						const item =
						<MenuItem key={index} option={i} position={index}>
							<Highlighter search={state.text}>
							{i.name}
							</Highlighter>
						</MenuItem>;

						index += 1;
						return item;
					})}
				</Fragment>
			))
			
			return <Menu {...menuProps}>{items}</Menu>
		}*/
		
		const optionsWithGeneralSearch = [
		{'name':'Search for papers containing "'+this.state.input+'"', 'type':'search'},
		...this.state.options
		]
		
		const renderMenu = (results, menuProps, state) => {
			const positionOffset = this.showGeneralSearch ? 1 : 0
			
			const generalSearchOption = {'name':state.text, 'type':'search'}
			const generalSearch = <MenuItem key={'menuitem_'+0} option={generalSearchOption} position={0}>Search for papers containing {'"'+state.text+'"'}</MenuItem>
			
			const renderedResults = results.map( (option,i) => <MenuItem key={'menuitem_'+(i+positionOffset)} option={option} position={i+positionOffset}>{renderSearchRow(option,state,i)}</MenuItem> )
			
			if (this.showGeneralSearch)
				return <Menu {...menuProps}>{generalSearch}{renderedResults}</Menu>
			else
				return <Menu {...menuProps}>{renderedResults}</Menu>
		}
		
		// renderMenu={renderMenu}
		// options={optionsWithGeneralSearch}
		// onKeyDown={event => console.log(event.key)}
		return (
		<div>
			<div className="input-group" style={{zIndex: "1000 !important"}}>
			
				<AsyncTypeahead
					autoFocus
					isLoading={this.state.isLoading}
					id="typeahead"
					labelKey={() =>
						// Return the input text to suppress hinting and displaying the labelKey in the input.
						this.state.input
					  }
					onSearch={this.search}
					onChange={this.onChange}
					renderMenu={renderMenu}
					onInputChange={(txt,event) => this.setState({input:txt})}
					options={optionsWithGeneralSearch}
					placeholder="Search for a drug, gene, location, paper, etc"
					onKeyDown={event => {
						if (event.key == 'Enter' && this.state.input) {
							//console.log(this.state.input)
							
							const url = "/search?q=" + this.state.input
							Router.push("/search",url)
						}
					}}
					
				  />
				
				<div className="input-group-append">
					<button className="btn btn-primary" type="button" onClick={ event => {
						if (this.state.input) {
							const url = "/search?q=" + this.state.input
							Router.push("/search",url)
						}
					}}>
						<FontAwesomeIcon icon={faSearch} />
					</button>
				</div>
			</div>
		</div>
		)
	}
}

