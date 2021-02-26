import { useRef } from 'react';
import Link from 'next/link'

/*import OverlayTrigger from 'react-bootstrap/OverlayTrigger'
import Popover from 'react-bootstrap/Popover'
import Tooltip from 'react-bootstrap/Tooltip'*/

import MyToolTip from '../components/MyToolTip.js'

export default function TextWithEntities(props) {
	const in_title = props.isTitle ? 1 : 0
	
	var entitySpans = []
	if (props.entities) {
		props.entities.forEach(e => {
			e.positions.forEach( p => {
				if (p.in_title == in_title) {
					const entitySpan = { name:e.name, type:e.type, start_pos: p.start_pos, end_pos: p.end_pos, in_title: p.in_title}
					entitySpans.push(entitySpan)
				}
			})
		} )
	}
	
	// TODO: Error checking code to make sure there aren't overlapping entities
	
	// Sort the spans by entity starting position
	entitySpans.sort((a,b) => a.start_pos - b.start_pos)
	
	var text = props.text
	
	if (entitySpans.length == 0)
		return text
	
	var textSpans = []
	if (entitySpans[0].start_pos > 0) {
		const startSpan = {start_pos:0, end_pos: entitySpans[0].start_pos, entity_name: null, entity_type: null}
		textSpans.push(startSpan)
	}
	entitySpans.forEach( (span,i) => {
		const midSpanWithEntity = {start_pos:span.start_pos, end_pos: span.end_pos, entity_name: span.name, entity_type: span.type}
		textSpans.push(midSpanWithEntity)
		
		if (i < (entitySpans.length-1) && span.end_pos != entitySpans[i+1].start_pos) {
			const midSpanWithoutEntity = {start_pos:span.end_pos, end_pos: entitySpans[i+1].start_pos, entity_name: null, entity_type: null}
			textSpans.push(midSpanWithoutEntity)
		}
	})
	const lastEntitySpan = entitySpans[entitySpans.length-1]
	if (lastEntitySpan.end_pos < text.length) {
		const endSpan = {start_pos:lastEntitySpan.end_pos, end_pos: text.length, entity_name: null, entity_type: null}
		textSpans.push(endSpan)
	}
	
	const container = useRef(null);
	
	const textObjects = textSpans.map( (ts,i) => {
		if (ts.entity_name == null || ts.entity_type == null) {
			return <span key={'textspan_'+i}>{text.substring(ts.start_pos,ts.end_pos)}</span>
		} else {
			const tooltipText = ts.entity_name + " [" + ts.entity_type + "]"
					
			return <span key={'entitylink_'+i}><MyToolTip text={tooltipText} container={container} >
				<span><Link href={"/entity/[...typename]"} as={"/entity/"+ts.entity_type+"/"+ts.entity_name} prefetch={false}><a>
							{text.substring(ts.start_pos,ts.end_pos)}
						</a></Link></span>
					</MyToolTip></span>
		}
	} )
	
	const combinedTextObject = textObjects.length > 0 ? textObjects.reduce((prev, curr) => [prev, '', curr]) : ''
	
	return <div ref={container}>{textObjects}</div>
}