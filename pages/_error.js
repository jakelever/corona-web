import React, { Component } from 'react';
import Layout from '../components/Layout.js'

function Error({ statusCode }) {
	const errorMessage = statusCode ? `An error ${statusCode} occurred on server` : 'An error occurred on client'
	
	return <Layout error={true} errorMessage={errorMessage} />
}

Error.getInitialProps = ({ res, err }) => {
	const statusCode = res ? res.statusCode : err ? err.statusCode : 404
	return { statusCode }
}

export default Error
