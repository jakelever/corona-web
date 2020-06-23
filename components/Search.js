import React, { Component } from 'react';
import { Typeahead, Highlighter } from 'react-bootstrap-typeahead'
import { Badge } from 'react-bootstrap';

export default class Search extends Component {
	constructor(props) {
		super(props)
		this.state = {
			viruses: []
			}
	}
	
	render() {
		
		var data = [
		{name:'remdesivir',type:'drug'},
		{name:'lopinavir',type:'drug'},
		{name:'ribavirin',type:'drug'},
		{name:'darunavir',type:'drug'},
		{name:'Spain',type:'place'},
		];
		
		var _renderMenuItemChildren = (option, props, index) => {
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
		
		return (
		<form className="d-none d-sm-inline-block mr-auto ml-md-3 my-2 my-md-0 mw-100 navbar-search">
			<div className="input-group">
			
				<Typeahead
					id="basic-typeahead-example"
					renderMenuItemChildren={_renderMenuItemChildren}
					labelKey="name"
					options={data}
					placeholder="Search by a drug, gene, place or for a specific paper"
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

