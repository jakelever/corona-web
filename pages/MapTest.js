import React, { Component } from 'react';
import Layout from '../components/Layout.js'
//import { Map, Marker, Popup, TileLayer } from 'react-leaflet'
import dynamic from 'next/dynamic'

const DynamicComponentWithNoSSR = dynamic(
  () => import('../components/Map'),
  { ssr: false }
)

export default class Page extends Component {
	constructor(props) {
		super(props)
		this.state = {
			inBrowser: false
			}
	}
	
	componentDidMount() {
		this.setState({ inBrowser: true });
	}

	render() {
		
		var map = <div></div>
		if (this.state.inBrowser) {
			const position = [51.505, -0.09]
			/*map = (
			  <Map center={position} zoom={13}>
				<TileLayer
				  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
				  attribution="&copy; <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors"
				/>
				<Marker position={position}>
				  <Popup>A pretty CSS3 popup.<br />Easily customizable.</Popup>
				</Marker>
			  </Map>
			)*/
		}
	
	
		return (
			<Layout title="Alpha" page="/">

				{/* Page Heading */}
				<div className="d-sm-flex align-items-center justify-content-between mb-4">
					<h1 className="h3 mb-0 text-gray-800">Dashboard</h1>
				</div>
				<div className="d-sm-flex align-items-center justify-content-between mb-4">
					<h3 className="h6 mb-0 text-gray-800"></h3>
				</div>
				
				<div style={{width:"400px",height:"400px",backgroundColor:"#DDFFDD"}}>
					<DynamicComponentWithNoSSR />
				</div>

			</Layout>
		
		)
	}
}
