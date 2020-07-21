import React, { Component } from 'react';
import Link from 'next/link'

import Layout from '../components/Layout.js'

export default class FAQs extends Component {
	render() {
		
		return (
			<Layout title="Frequently Asked Questions" page="/faqs" >
		
				{/* Page Heading */}
				<div className="d-sm-flex align-items-center justify-content-between mb-4">
					<h1 className="h3 mb-0 text-gray-800">Frequently Asked Questions</h1>
					
				</div>
				

				<div className="card shadow mb-4">
					
					<div className="card-body">
						<div className="table-responsive">
							
							<div>
								<p><b>Q: What is the purpose of this resource?</b></p>
								<p>A: To provide a portal to the entire biomedical literature focussed on SARS-CoV-2, MERS-CoV and SARS-CoV.</p>
							</div>
							
							<hr />
							
							<div>
								<p><b>Q: How do I find papers that mention a specific therapeutic?</b></p>
								<p>A: We find drug names extracted from Wikidata in papers and use a set of synonyms to extract them.</p>
							</div>
							
							<hr />
							
							<div>
								<p><b>Q: What machine learning methods are used in this resource?</b></p>
								<p>A: We use supervised machine learning to identify the topics of the papers. A set of papers has been annotated with relevant topics and fed into a traditional logistic regression based system that has been adjusted to make conservative decisions.</p>
							</div>
							
							<hr />
							
							<div>
								<p><b>Q: Are all the papers manually curated?</b></p>
								<p>A: No. A small number have been manually curated and machine learning has been used to predict the topics for all other papers</p>
							</div>
							
							<hr />
							
							<div>
								<p><b>Q: I've found a mistake with a paper. What should I do?</b></p>
								<p>A: Please flag the paper using the Flag Mistake button on the paper or use the <Link href="/feedback" as="/feedback"><a>Feedback page</a></Link>.</p>
							</div>
							
							<hr />
							
							<div>
								<p><b>Q: Who created this resource?</b></p>
								<p>A: This was created by Jake Lever, a postdoctoral researcher in the Helix Group at Stanford University.</p>
							</div>
							
							<hr />
							
							<div>
								<p><b>Q: How do I cite this research?</b></p>
								<p>A: There is currently a paper in preparation. Please cite that when it becomes available.</p>
							</div>
							
						</div>
					</div>
				</div>
				

			</Layout>
		)
	}
}

