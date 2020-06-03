// https://medium.com/@austintoddj/using-google-analytics-with-next-js-423ea2d16a98

import ReactGA from 'react-ga'

export const initGA = () => {
	console.log('GA init')
	ReactGA.initialize('UA-168230925-1')
}

export const logPageView = (title) => {
	
	ReactGA.set({ page: window.location.pathname })
	if (title === undefined) {
		console.log(`Logging pageview for ${window.location.pathname}`)
		ReactGA.pageview(window.location.pathname)
	} else {
		console.log(`Logging pageview for ${window.location.pathname} with title ${title}`)
		ReactGA.pageview(window.location.pathname,[],title)
	}
}

export const logEvent = (category = '', action = '') => {
	if (category && action) {
		ReactGA.event({ category, action })
	}
}

export const logException = (description = '', fatal = false) => {
	if (description) {
		ReactGA.exception({ description, fatal })
	}
}
