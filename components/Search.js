import React, { Component } from 'react';
import { AsyncTypeahead, Typeahead, Highlighter } from 'react-bootstrap-typeahead'
import { Badge } from 'react-bootstrap';
//import { useRouter } from 'next/router'
import Router from 'next/router'

export default class Search extends Component {
	constructor(props) {
		super(props)
		this.state = {
			isLoading: false,
			options: []
			}
			
		this.search = this.search.bind(this);
		this.onChange = this.onChange.bind(this);
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
			//const router = useRouter()
			console.log(selected[0])
			
			const entity_name = selected[0].name
			const entity_type = selected[0].type
			
			const url = "/entity/" + entity_type + "/" + entity_name
			Router.push("/entity/[...typename]",url)
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
		<form className="d-none d-sm-inline-block mr-auto ml-md-3 my-2 my-md-0 mw-100 navbar-search">
			<div className="input-group">
			
				<AsyncTypeahead
					isLoading={this.state.isLoading}
					id="basic-typeahead-example"
					renderMenuItemChildren={renderSearchRow}
					labelKey="name"
					onSearch={this.search}
					onChange={this.onChange}
					options={this.state.options}
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

