import React, { Component } from 'react';
import { Typeahead, Highlighter } from 'react-bootstrap-typeahead'

class Search extends Component {
	constructor(props) {
		super(props)
		this.state = {
			viruses: []
			}
	}
	
	// <input type="text" className="form-control bg-light border-0 small" placeholder="Search for..." aria-label="Search" aria-describedby="basic-addon2" />
	
	render() {
		
		var data = [
		{name:'UK',population:66.65*1000000},
		{name:'France',population:66.99*1000000},
		{name:'Italy',population:60.36*1000000},
		{name:'Germany',population:83.02*1000000},
		{name:'Spain',population:46.94*1000000},
		];
		
		var _renderMenuItemChildren = (option, props, index) => {
			return [
			  <Highlighter key="name" search={props.text}>
				{option.name}
			  </Highlighter>,
			  <div key="population">
				<small>
				  Population: {option.population.toLocaleString()}
				</small>
			  </div>,
			];
		  }
		
		return (
		<form className="d-none d-sm-inline-block mr-auto ml-md-3 my-2 my-md-0 mw-100 navbar-search">
			<div className="input-group">
			
				<Typeahead
					id="basic-typeahead-example"
					renderMenuItemChildren={_renderMenuItemChildren}
					labelKey="name"
					options={data}
					placeholder="Choose a state..."
				  />
				
				<div className="input-group-append">
					<button className="btn btn-primary" type="button">
						<i className="fas fa-search fa-sm"></i>
					</button>
				</div>
			</div>
		</form>
		)
	}
}

export default Search
