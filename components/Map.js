
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
	
	const locations = 'locations' in props ? props.locations : []
	
	var markers
	if ('links' in props && props.links == true) {
		markers = locations.map( (loc,i) => 
			<Marker key={"marker_"+i} position={[loc.latitude,loc.longitude]}>
				<Popup>
					<Link href={"/entity/[...typename]"} as={"/entity/Location/"+loc.name} prefetch={false}>
						<a>
							{loc.name}
						</a>
					</Link>
				</Popup>
			</Marker>
		)
	} else {
		markers = locations.map( (loc,i) => 
			<Marker key={"marker_"+i} position={[loc.latitude,loc.longitude]}>
				<Popup>
					{loc.name}
				</Popup>
			</Marker>
		)
	}
	
	const position = 'position' in props ? props.position : [10, 0]
	const zoom = 'zoom' in props ? props.zoom : 2
	const height = 'height' in props ? props.height : "400px"
	return <Map center={position} zoom={zoom} style={{height:height}}>
			<TileLayer
			  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
			  attribution="&copy; <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors"
			/>
			{markers}
		  </Map>
}