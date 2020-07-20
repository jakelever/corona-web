
import { Map, Marker, Popup, TileLayer } from 'react-leaflet'
import Link from 'next/link'

export default function MyMap(props) {
	const L = require("leaflet");

    delete L.Icon.Default.prototype._getIconUrl;

    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "/leaflet/marker-icon-2x.png",
      iconUrl: "/leaflet/marker-icon.png",
      shadowUrl: "/leaflet/marker-shadow.png"
    });
	
	const markers = 'locations' in props ? props.locations.map( loc => 
		<Marker position={[loc.latitude,loc.longitude]}>
			<Popup>
				<Link href={"/entity/[...typename]"} as={"/entity/Location/"+loc.name}>
					<a>
						{loc.name}
					</a>
				</Link>
			</Popup>
		</Marker>
	) : []
	
	const position = [10, 0]
	return <Map center={position} zoom={2} style={{height:"400px"}}>
			<TileLayer
			  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
			  attribution="&copy; <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors"
			/>
			{markers}
		  </Map>
}