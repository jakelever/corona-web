//import { useState, useEffect } from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger'
import Popover from 'react-bootstrap/Popover'
import Tooltip from 'react-bootstrap/Tooltip'

/* 
const UpdatingPopover = React.forwardRef(
  ({ popper, children, show: _, ...props }, ref) => {
    useEffect(() => {
      console.log('updating!');
      popper.scheduleUpdate();
    }, [children, popper]);

    return (
      <Popover ref={ref} content {...props}>
        {children}
      </Popover>
    );
  },
);

*/
/*
<OverlayTrigger
	placement="top"
	delay={{ show: 250, hide: 400 }}
	overlay={this.renderTooltip}
  >
  <a href="#" onClick={event => event.preventDefault()}>Hover me to see</a>
</OverlayTrigger>
{this.props.doc.title}

*/

export default function TextWithEntities(props) {
	
	const in_title = props.isTitle ? 1 : 0
	
	var entitySpans = []
	props.entities.forEach(e => {
		//console.log(e.positions)
		
		e.positions.forEach( p => {
			if (p.in_title == in_title) {
				const entitySpan = { name:e.name, type:e.type, start_pos: p.start_pos, end_pos: p.end_pos, in_title: p.in_title}
				entitySpans.push(entitySpan)
			}
		})
	} )
	//console.log(this.props.doc.entities)
	//console.log(spans)
	
	// TODO: Error checking code to make sure there aren't overlapping entities
	
	//var starts = Object.keys(spans)
	//starts.sort((a,b)=> parseInt(a) - parseInt(b))
	
	// Sort the spans by entity starting position
	entitySpans.sort((a,b) => a.start_pos - b.start_pos)
	
	console.log(entitySpans)
	
	var text = props.text
	
	if (entitySpans.length == 0)
		return text
	
	//const titleSpans = entitySpans.filter(s => s.in_title==1)
	//console.log(titleSpans)
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
	console.log(textSpans)
	
	/* overlay={props => {
							return (
								<Tooltip id="button-tooltip" {...props}>
									{ts.entity_name} [{ts.entity_type}]
								</Tooltip>
							);
						}}
						*/
						
	/*const longContent = `
	  Very long
	  Multiline content
	  that is engaging and what-not
	`;
	const shortContent = 'Short and sweet!';

	const [content, setContent] = useState(shortContent);
						
	useEffect(() => {
		const timerId = setInterval(() => {
		  setContent(content === shortContent ? longContent : shortContent);
		}, 3000);

		return () => clearInterval(timerId);
	  });*/

	
	const textObjects = textSpans.map( ts => {
		if (ts.entity_name == null || ts.entity_type == null) {
			return <span>{text.substring(ts.start_pos,ts.end_pos)}</span>
		} else {
			return <OverlayTrigger
						placement="right"
						delay={{ show: 250, hide: 400 }}
						overlay={props => {
							return (
								<Tooltip id="button-tooltip" {...props}>
									{ts.entity_name} [{ts.entity_type}]
								</Tooltip>
							);
						}}
					  >
						<a href="#" onClick={event => event.preventDefault()}>
							{text.substring(ts.start_pos,ts.end_pos)}
						</a>
					</OverlayTrigger>
		}
	} )
	
	const combinedTextObject = textObjects.length > 0 ? textObjects.reduce((prev, curr) => [prev, '', curr]) : ''
	
	return combinedTextObject
}