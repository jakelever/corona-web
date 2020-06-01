import '../css/sb-admin-2.css'

import 'react-bootstrap-typeahead/css/Typeahead.css';

// https://medium.com/@fabianterh/fixing-flashing-huge-font-awesome-icons-on-a-gatsby-static-site-787e1cfb3a18
// https://github.com/FortAwesome/react-fontawesome/issues/234
import { config } from '@fortawesome/fontawesome-svg-core' // 👈
import '@fortawesome/fontawesome-svg-core/styles.css' // 👈
config.autoAddCss = false // 👈

export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />
}
