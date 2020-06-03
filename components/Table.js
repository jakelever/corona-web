import React, { Component } from 'react';

class Table extends Component {
	constructor(props) {
		super(props) //since we are extending className Table so we have to use super in order to override Component className constructor
		this.state = { //state is by default an object
			page: 0,
			sortCol: null,
			ascending: true
		}
		
		this.perPage = 10
		this.renderPagination = this.renderPagination.bind(this);
		this.renderTableData = this.renderTableData.bind(this);
		this.renderTableRow = this.renderTableRow.bind(this);
		this.renderCell = this.renderCell.bind(this);
		this.changePage = this.changePage.bind(this);
		this.sort = this.sort.bind(this);
	}
		
	changePage(pageno) {
		this.setState({page:pageno})
	}
	
	sort(event,header) {
		var colname = this.props.columns[header]
		
		if (this.state.sortCol == colname) {
			this.setState({ascending:!this.state.ascending,page:0})
		} else {
			this.setState({sortCol:colname,ascending:true,page:0})
		}
		console.log(colname)
		
		event.preventDefault()
	}
	
	renderPagination() {
		var dataCount = this.props.data.length;
		var optionCount = 9;
		var totalPages = Math.ceil(dataCount / this.perPage);
		var startAt = Math.max(this.state.page - Math.floor(optionCount/2),0);
		var endAt = startAt + optionCount;
		
		if (endAt > totalPages) {
			endAt = totalPages;
			startAt = Math.max(endAt-optionCount,0);
		}
		
		var options = [...Array(endAt-startAt).keys()].map(i => i + startAt).map( i => {
			var clickFunc = (e => {e.preventDefault(); this.changePage(i)});
			return <li key={'pagination_'+i} className={i==this.state.page ? 'page-item active' : 'page-item'}>
						<a className="page-link" href="#" onClick={clickFunc}>{i+1}{i==this.state.page && <span className="sr-only">(current)</span>}</a>
					</li>
		});
		
		var prev = this.state.page - 1;
		var next = this.state.page + 1;
		
		var prevFunc = (e => {e.preventDefault(); this.changePage(prev)});
		var nextFunc = (e => {e.preventDefault(); this.changePage(next)});
		
		var pageStart = (this.state.page*this.perPage)+1
		var pageEnd = Math.min(this.props.data.length,(this.state.page+1)*this.perPage)
		
		return <nav aria-label="...">
			<div className="page-item" style={{float:"left",boxSizing: "border-box",lineHeight: "1.25", padding:"0.5rem 0.75rem"}}>{'Showing ' + pageStart + '-' + pageEnd + ' of ' + this.props.data.length}</div>
			<ul className="pagination justify-content-center">
				<li className={prev < 0 ? "page-item disabled" : "page-item"}>
					<a className="page-link" href="#" tabIndex="-1" onClick={prevFunc}>Previous</a>
				</li>
				{options}
				<li className={next >= totalPages ? "page-item disabled" : "page-item"}>
					<a className="page-link" href="#" onClick={nextFunc}>Next</a>
				</li>
			</ul>
		</nav>
	}
	
	renderCell(row,col) {
		var content = "";
		if (col.startsWith('entities:')) {
			//content = 'TODO'
			var entity_type = col.substr('entities:'.length)
			var entity_names = row['entities'].filter(e => e['type'] == entity_type).map((e,i) => <a key={'entity_'+i} href="#">{e['name']}</a>)
			if (entity_names.length >= 1) {
				content = entity_names.reduce((prev, curr) => [prev, ', ', curr])
			}
		} else if (col == 'title' && col in row && 'url' in row) {
			content = <a href={row['url']} target="_blank">{row[col]}</a>;
		} else if (col in row) {
			content = row[col];
		} else {
			content = 'ERROR';
		}
		return <td key={'col_'+col}>{content}</td>
	}
	
	renderTableRow(row,rowindex) {
		/*var drug_names = row['entities'].filter(e => e['type'] == 'drug').map(e => e['name']);
		var virus_names = row['entities'].filter(e => e['type'] == 'virus').map(e => e['name']);
		var stages = row['entities'].filter(e => e['type'] == 'stage').map(e => e['name']);*/
		
		var theseColumns = Object.values(this.props.columns).map(col => this.renderCell(row,col));
		
		return <tr key={'row_'+rowindex}>
			{theseColumns}
			<td className="flag">
				<svg className="bi bi-flag-fill" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
				  <path fillRule="evenodd" d="M3.5 1a.5.5 0 01.5.5v13a.5.5 0 01-1 0v-13a.5.5 0 01.5-.5z" clipRule="evenodd"/>
				  <path fillRule="evenodd" d="M3.762 2.558C4.735 1.909 5.348 1.5 6.5 1.5c.653 0 1.139.325 1.495.562l.032.022c.391.26.646.416.973.416.168 0 .356-.042.587-.126a8.89 8.89 0 00.593-.25c.058-.027.117-.053.18-.08.57-.255 1.278-.544 2.14-.544a.5.5 0 01.5.5v6a.5.5 0 01-.5.5c-.638 0-1.18.21-1.734.457l-.159.07c-.22.1-.453.205-.678.287A2.719 2.719 0 019 9.5c-.653 0-1.139-.325-1.495-.562l-.032-.022c-.391-.26-.646-.416-.973-.416-.833 0-1.218.246-2.223.916A.5.5 0 013.5 9V3a.5.5 0 01.223-.416l.04-.026z" clipRule="evenodd"/>
				</svg>
			</td>
		</tr>
	}
	
	renderTableData() {
		//return <div>argh</div>
		
		var records = this.props.data;
	
		function compare(a,b,column,ascending) {
			if (!(column in a) || !(column in b))
				return 0;
			
			var valA = a[column]
			var valB = b[column]
			
			if (typeof valA === 'string')
				valA = valA.toUpperCase().trim()
			if (typeof valB === 'string')
				valB = valB.toUpperCase().trim()

			let comparison = 0;
			if (valA > valB) {
				comparison = 1;
			} else if (valA < valB) {
				comparison = -1;
			}
			
			if (ascending)
				return comparison;
			else
				return -1*comparison;
		}
		
		function compareEntities(a,b,entity,ascending) {
			var a_entity_names = a['entities'].filter(e => e['type'] == entity_type).map((e,i) => e['name']).join(', ')
			var b_entity_names = b['entities'].filter(e => e['type'] == entity_type).map((e,i) => e['name']).join(', ')
			
			a_entity_names = a_entity_names.toUpperCase().trim();
			b_entity_names = b_entity_names.toUpperCase().trim();

			let comparison = 0;
			if (a_entity_names > b_entity_names) {
				comparison = 1;
			} else if (a_entity_names < b_entity_names) {
				comparison = -1;
			}
			
			if (ascending)
				return comparison;
			else
				return -1*comparison;
		}
	
		if (this.state.sortCol !== null) {
			if (this.state.sortCol.startsWith('entities:')) {
				var entity_type = this.state.sortCol.substr('entities:'.length)
				records.sort( (a,b) => compareEntities(a,b,entity_type,this.state.ascending) )
			} else {
				records.sort( (a,b) => compare(a,b,this.state.sortCol,this.state.ascending) )
			}
			
		}
		
		var selectedData = records.slice(this.state.page*this.perPage,Math.min((this.state.page+1)*this.perPage,records.length))
		
		return selectedData.map((row,i) => this.renderTableRow(row,i));
	}
	
	renderHeaders() {
		//var headers = ['Virus','Drug','Stage','Journal','Date','Title',''];
		return Object.keys(this.props.columns).map((header,i) => <th key={'header_'+i}><a href="#" onClick={event => this.sort(event,header)}>{header}</a> {this.state.sortCol == this.props.columns[header] ? ( this.state.ascending ? <i className="fas fa-sort-up"></i> : <i className="fas fa-sort-down"></i>) : ''}</th>)
	}
	
	render() {
		if (!this.props.data)
			return <div></div>
		
		if (this.props.loading)
			//return <div style={{width:"100%", textAlign:"center"}}><b>LOADING</b></div>
			return <div style={{width:"100%"}}><div style={{margin: "0 auto", width:"80px"}}><div style={{width:"100%"}}><div style={{margin: "0 auto"}} className="lds-ellipsis"><div></div><div></div><div></div><div></div></div></div></div></div>
		if (this.props.error)
			return <div style={{width:"100%", textAlign:"center"}}><b>ERROR: {this.props.error}</b></div>
		
		var headers = this.renderHeaders()
	
		var table = <table cellPadding="0" cellSpacing="0" border="0" className="table table-striped table-bordered" width="100%">
				<tbody>
					<tr>
					    {headers}
						<th></th>
					</tr>
					{this.renderTableData()}
				</tbody>
			</table>
						
				
		return <div>{table}{this.renderPagination()}</div>
	}
}

export default Table;
