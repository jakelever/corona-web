
import React, { Component, useState, useRef } from 'react';

import { logEvent } from '../lib/analytics.js'

import Popover from 'react-bootstrap/Popover'
import OverlayTrigger from 'react-bootstrap/OverlayTrigger'

import {
  EmailShareButton,
  FacebookShareButton,
  LinkedinShareButton,
  RedditShareButton,
  TwitterShareButton,
  WhatsappShareButton
} from "react-share";

import {
  EmailIcon,
  FacebookIcon,
  LinkedinIcon,
  RedditIcon,
  TwitterIcon,
  WhatsappIcon
} from "react-share"


export default function SharePopover(props) {
		
	const popover = (
	  <Popover id="popover-share">
		<Popover.Title as="h3">Share Options</Popover.Title>
		<Popover.Content>
		  <EmailShareButton subject={props.title} body="The link for CoronaCentral is: " url={props.url} className="sharetime" onClick={event => logEvent('share','email')}>
			<EmailIcon size="2.5rem" />
		  </EmailShareButton>	
		  <FacebookShareButton quote={props.title} url={props.url} className="sharetime" onClick={event => logEvent('share','facebook')}>
			<FacebookIcon size="2.5rem" />
		  </FacebookShareButton>
		  <LinkedinShareButton title={props.title} url={props.url} className="sharetime" onClick={event => logEvent('share','linkedin')}>
			<LinkedinIcon size="2.5rem" />
		  </LinkedinShareButton>
		  <RedditShareButton title={props.title} url={props.url} className="sharetime" onClick={event => logEvent('share','reddit')}>
			<RedditIcon size="2.5rem" />
		  </RedditShareButton>
		  <TwitterShareButton title={props.title} url={props.url} className="sharetime" onClick={event => logEvent('share','twitter')}>
			<TwitterIcon size="2.5rem" />
		  </TwitterShareButton>
		  <WhatsappShareButton title={props.title} url={props.url} className="sharetime" onClick={event => logEvent('share','whatsapp')}>
			<WhatsappIcon size="2.5rem" />
		  </WhatsappShareButton>
		</Popover.Content>
	  </Popover>
	);
	
	return <OverlayTrigger trigger="click" placement="left" overlay={popover} container={props.container}>{props.children}</OverlayTrigger>

}