// https://medium.com/@austintoddj/using-google-analytics-with-next-js-423ea2d16a98

import ReactGA from 'react-ga'

export const initGA = () => {
	const isLocalhost = (location.hostname === "localhost" || location.hostname === "127.0.0.1" || location.hostname === "")
	const notrack = location.search.includes('notrack')
	
	if (!isLocalhost && !notrack) {
		console.log('GA init')
		ReactGA.initialize('UA-168230925-1')
		ReactGA.set({ 'dimension1': 'scotch-tape' });
	}
}

export const logPageView = (title) => {
	const isLocalhost = (location.hostname === "localhost" || location.hostname === "127.0.0.1" || location.hostname === "")
	const notrack = location.search.includes('notrack')
	
	if (!isLocalhost && !notrack) {
		ReactGA.set({ page: window.location.pathname })
		if (title === undefined) {
			//console.log(`Logging pageview for ${window.location.pathname}`)
			ReactGA.pageview(window.location.pathname)
		} else {
			//console.log(`Logging pageview for ${window.location.pathname} with title ${title}`)
			ReactGA.pageview(window.location.pathname,[],title)
		}
	}
}

export const logEvent = (category = '', action = '') => {
	const isLocalhost = (location.hostname === "localhost" || location.hostname === "127.0.0.1" || location.hostname === "")
	const notrack = location.search.includes('notrack')
	
	if (!isLocalhost && !notrack && category && action) {
		ReactGA.event({ category, action })
	}
}

export const logException = (description = '', fatal = false) => {
	const isLocalhost = (location.hostname === "localhost" || location.hostname === "127.0.0.1" || location.hostname === "")
	const notrack = location.search.includes('notrack')
	
	if (!isLocalhost && !notrack && description) {
		ReactGA.exception({ description, fatal })
	}
}
