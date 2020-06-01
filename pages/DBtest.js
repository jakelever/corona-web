import Head from 'next/head'
import Sidebar from '../components/Sidebar.js'
import Topbar from '../components/Topbar.js'
import Table from '../components/Table.js'

import fetch from 'isomorphic-unfetch'
import Link from 'next/link'

HomePage.getInitialProps = async ({ req, query }) => {
	
  var location = { protocol:'http:', host:'localhost:3000' }
	
  const protocol = req && req.headers['x-forwarded-proto']
    ? `${req.headers['x-forwarded-proto']}:`
    : location.protocol
  const host = req && req.headers['x-forwarded-host'] ? req.headers['x-forwarded-host'] : location.host
  const pageRequest = `${protocol}//${host}/api/tabledata`
  console.log(pageRequest)
  const res = await fetch(pageRequest)
  const data = await res.json()
  //return json
  console.log("hello")
	
  //const resultsData = json
  return {
    props: {
      data
    }
  }
}

export default function HomePage({ data }) {
  var columns = {Title:'title',Journal:'journal'}
  /*var data = [ {virus: 'Moo', drug:'erlotinib'},
  {virus: 'Moo2', drug:'erlotinib1'},
  {virus: 'Moo3', drug:'erlotinib2'},
  {virus: 'Moo4', drug:'erlotinib3'},
  {virus: 'Moo5', drug:'erlotinib5'}]*/
  
  console.log(data)
  
  data = [];
	
  return (
  <div id="wrapper">
  {/* Page Wrapper */}

    <Sidebar />

    {/* Content Wrapper */}
    <div id="content-wrapper" className="d-flex flex-column">

      {/* Main Content */}
      <div id="content">

        <Topbar />

        {/* Begin Page Content */}
        <div className="container-fluid">

          {/* Page Heading */}
          <div className="d-sm-flex align-items-center justify-content-between mb-4">
            <h1 className="h3 mb-0 text-gray-800">Hello, is it you I'm looking for?</h1>
          </div>
		  
		
		  <Table data={data} columns={columns} loading={false} error={false} />

        </div>
        {/* /.container-fluid */}

      </div>
      {/* End of Main Content */}

      {/* Footer */}
      <footer className="sticky-footer bg-white">
        <div className="container my-auto">
          <div className="copyright text-center my-auto">
            <span>Copyright &copy; Your Website 2020</span>
          </div>
        </div>
      </footer>
      {/* End of Footer */}

    </div>
    {/* End of Content Wrapper */}

  </div>
  )
}
