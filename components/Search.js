import React, { Component } from 'react';
import { AsyncTypeahead, Typeahead, Highlighter } from 'react-bootstrap-typeahead'
import { Badge } from 'react-bootstrap';
import Router from 'next/router'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSearch } from '@fortawesome/free-solid-svg-icons'

import pages from '../lib/pages.json'

export default class Search extends Component {
	constructor(props) {
		super(props)
		this.state = {
			isLoading: false,
			options: []
			}
			
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
			
			if (entity_type == 'topic' && entity_name in this.pageMapping) {
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
				
				if (url)
					Router.push("/doc/[...identifiers]",url)
			} else {
				const url = "/entity/" + entity_type + "/" + entity_name
				Router.push("/entity/[...typename]",url)
			}
		}
	}
	
	render() {
		
		var data = [
		{name:'remdesivir',type:'drug'},
		{name:'lopinavir',type:'drug'},
		{name:'darunavir',type:'drug'},
		{name:'Spain',type:'place'},
		];
		
		const renderSearchRow = (option, props, index) => {
			return [
			  <Highlighter key="name" search={props.text}>
				{option.name}
			  </Highlighter>,
			  <div key="type" style={{float:"right"}}>
				<Badge variant="secondary">
				  {option.type}
				</Badge>
			  </div>,
			];
		  }
		  
		  
		/* 
		
					  
					  onSearch={query => this.setState({options: [{name:'moomoo',type:'drug'}]})}
					  
					  */
		
		return (
		<div>
			<div className="input-group">
			
				<AsyncTypeahead
					isLoading={this.state.isLoading}
					id="basic-typeahead-example"
					renderMenuItemChildren={renderSearchRow}
					labelKey="name"
					onSearch={this.search}
					onChange={this.onChange}
					options={this.state.options}
					placeholder="Search for a drug, gene, location, paper, etc"
				  />
				
				<div className="input-group-append">
					<button className="btn btn-primary" type="button">
						<FontAwesomeIcon icon={faSearch} />
					</button>
				</div>
			</div>
		</div>
		)
	}
}

