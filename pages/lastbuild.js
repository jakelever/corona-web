import React, { Component } from 'react';
import Layout from '../components/Layout.js'

export async function getStaticProps({ params }) {
	const buildTimestamp = Date.now();
	
	return {
		props: {
			buildTimestamp
		}
	}
}

export default class Home extends Component {
	render() {
		var offset = new Date().getTimezoneOffset();
		var localBuildDateTime = new Date(this.props.buildTimestamp-offset)
		
		return (
			<Layout title="Build Date" page="/builddate">
				Last Build at {localBuildDateTime.toString()}
			</Layout>
		
		)
	}
}
