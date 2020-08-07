import React, { Component } from 'react';

import OverlayTrigger from 'react-bootstrap/OverlayTrigger'
import Popover from 'react-bootstrap/Popover'
import Tooltip from 'react-bootstrap/Tooltip'

export default class MyToolTip extends Component {
	constructor(props) {
		super(props)
		
		this.showOverlay = this.showOverlay.bind(this);
	}
	
	showOverlay(toolprops) {
		return (<Tooltip id="button-tooltip" {...toolprops}>{this.props.text}</Tooltip>)
	}
	
	render() {
		const placement = 'placement' in this.props ? props.placement : 'right'
		
		return <OverlayTrigger
							placement={placement}
							delay={{ show: 250, hide: 400 }}
							overlay={toolprops => this.showOverlay(toolprops)}
						  >
							{this.props.children}
						</OverlayTrigger>
	}
}
