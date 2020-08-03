import React, { Component } from 'react';
import Layout from '../components/Layout.js'

export async function getStaticProps({ params }) {
	const dateTime = new Date().toLocaleString();
	
	return {
		props: {
			dateTime
		}
	}
}

export default class Home extends Component {
	render() {
		
		return (
			<Layout title="Build Date" page="/builddate">
				Last Build at {this.props.dateTime}
			</Layout>
		
		)
	}
}
