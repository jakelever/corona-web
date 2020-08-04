import React, { Component } from 'react';
import Layout from '../components/Layout.js'

export async function getStaticProps({ params }) {
	const buildDatetime = Date.now();
	
	return {
		props: {
			buildDatetime
		}
	}
}

export default class Home extends Component {
	render() {
		var offset = new Date().getTimezoneOffset();
		var localBuildDatetime = new Date(this.props.buildDatetime-offset)
		
		return (
			<Layout title="Build Date" page="/builddate">
				Last Build at {localBuildDatetime.toString()}
			</Layout>
		
		)
	}
}
