
import { Map, Marker, Popup, TileLayer } from 'react-leaflet'
import Link from 'next/link'

export default function MyMap() {
	const L = require("leaflet");

    delete L.Icon.Default.prototype._getIconUrl;

    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "/leaflet/marker-icon-2x.png",
      iconUrl: "/leaflet/marker-icon.png",
      shadowUrl: "/leaflet/marker-shadow.png"
    });
	
	const position = [51.505, -0.09]
	return <Map center={position} zoom={13} style={{height:"400px"}}>
			<TileLayer
			  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
			  attribution="&copy; <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors"
			/>
			<Marker position={position} draggable={true}>
			  <Popup>A pretty CSS3 popup.<br />Easily customizable.
					<a href="/therapeutics">
						Therapeutics!
					</a>
			  </Popup>
			</Marker>
		  </Map>
}