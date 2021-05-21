import React, { Component } from 'react';
import Link from 'next/link'

import Layout from '../components/Layout.js'

export default class FAQs extends Component {
	render() {
		
		return (
			<Layout title="Frequently Asked Questions" page="/faqs" >
		
				{/* Page Heading */}
				<div className="d-sm-flex align-items-center justify-content-between mb-4 titlepadding">
					<h1 className="h3 mb-0 text-gray-800">Frequently Asked Questions</h1>
					
				</div>
				

				<div className="card shadow mb-4">
					
					<div className="card-body">
						<div className="table-responsive">
							
							<div>
								<p><b>Q: What is the purpose of this resource?</b></p>
								<p>A: To provide a portal to the entire biomedical literature focussed on SARS-CoV-2, MERS-CoV and SARS-CoV. It categorises papers into a set of categories to make it easier to find relevant research and indexes by important concepts (e.g. drugs, proteins, locations, etc).</p>
							</div>
							
							<hr />
							
							<div>
								<p><b>Q: How do I find papers that mention a specific therapeutic?</b></p>
								<p>A: We find drug names extracted from Wikidata in papers and use a set of synonyms to extract them.</p>
							</div>
							
							<hr />
							
							<div>
								<p><b>Q: What machine learning methods are used in this resource?</b></p>
								<p>A: We use a deep learning (BERT-based) supervised machine learning to identify the categories of the papers. A set of papers has been annotated with relevant categories and used as training data for a system that uses the text of the title and abstract to make predictions. This is complemented with heuristics to identify specific categories, e.g. clinical trial registration numbers.</p>
							</div>
							
							<hr />
							
							<div>
								<p><b>Q: Are all the papers manually curated?</b></p>
								<p>A: No. A small number have been manually curated and machine learning has been used to predict the categories for all other papers</p>
							</div>
							
							<hr />
							
							<div>
								<p><b>Q: Is this up-to-date?</b></p>
								<p>A: Yes. The latest version of PubMed and the CORD-19 dataset are downloaded and processed every day.</p>
							</div>
							
							<hr />
							
							<div>
								<p><b>Q: Can I download or export the data?</b></p>
								<p>A: Yes. Each page with a table has an export button in the top right which allows you to download the table data as a CSV or JSON file. Alternatively, you can download the entire CoronaCentral dataset from <a href="https://doi.org/10.5281/zenodo.4383289" target="_blank">Zenodo</a>. This is regularly updated.</p>
							</div>
							
							<hr />
							
							<div>
								<p><b>Q: I've found a mistake with a paper. What should I do?</b></p>
								<p>A: Please flag the paper using the Flag Mistake button on the paper or use the <Link href="/feedback" as="/feedback" prefetch={false}><a>Feedback page</a></Link>.</p>
							</div>
							
							<hr />
							
							<div>
								<p><b>Q: Who created this resource?</b></p>
								<p>A: This was created by <a href="https://twitter.com/jakelever0" target="_blank">Jake Lever</a>, during his postdoctoral work supervised by <a href="https://rbaltman.people.stanford.edu/" target="_blank">Russ Altman</a> in the <a href="http://helix.stanford.edu/" target="_blank">Helix Group</a> at Stanford University. He is now a lecturer in the <a href="https://www.gla.ac.uk/schools/computing/" target="_blank">School of Computer Science</a> at the <a href="https://www.gla.ac.uk" target="_blank">University of Glasgow</a></p>
							</div>
							
							<hr />
							
							<div>
								<p><b>Q: How is this research funded?</b></p>
								<p>A: This project has been funded through the <a href="https://www.czbiohub.org/" target="_blank">Chan Zuckerberg Biohub</a> and through the National Library of Medicine LM05652 grant.</p>
							</div>
							
							<hr />
							
							<div>
								<p><b>Q: Where can I get more details?</b></p>
								<p>A: This work has been published in <a href="https://doi.org/10.1073/pnas.2100766118" target="_blank">PNAS</a>. The preprint is also available at <a href="https://doi.org/10.1101/2020.12.21.423860">bioRxiv</a>. The code for the analysis also available at <a href="https://github.com/jakelever/corona-ml">https://github.com/jakelever/corona-ml</a>.</p>
							</div>
							
							<hr />
							
							<div>
								<p><b>Q: How do I cite this research?</b></p>
								<p>A: Please cite the <a href="https://doi.org/10.1073/pnas.2100766118">PNAS paper</a>. Below is some Bibtex if that's helpful.
								</p>
								<div style={{backgroundColor:"#eeeeee"}}>
									<pre>
@article {'{'}coronacentral,{'\n'}
{'   '}author = {'{'}Lever, Jake and Altman, Russ B.{'}'},{'\n'}
{'   '}title = {'{'}Analyzing the vast coronavirus literature with {'{'}C{'}'}orona{'{'}C{'}'}entral{'}'},{'\n'}
{'   '}volume = {'{'}118{'}'},{'\n'}
{'   '}number = {'{'}23{'}'},{'\n'}
{'   '}elocation-id = {'{'}e2100766118{'}'},{'\n'}
{'   '}year = {'{'}2021{'}'},{'\n'}
{'   '}doi = {'{'}10.1073/pnas.2100766118{'}'},{'\n'}
{'   '}publisher = {'{'}National Academy of Sciences{'}'},{'\n'}
{'   '}issn = {'{'}0027-8424{'}'},{'\n'}
{'   '}URL = {'{'}https://www.pnas.org/content/118/23/e2100766118{'}'},{'\n'}
{'   '}eprint = {'{'}https://www.pnas.org/content/118/23/e2100766118.full.pdf{'}'},{'\n'}
{'   '}journal = {'{'}Proceedings of the National Academy of Sciences{'}'}{'\n'}
}{'\n'}
									</pre>
								</div>
							</div>
							
							<hr />
							
							
							<div>
								<p><b>Q: Who should I contact to ask a question?</b></p>
								<p>A: Please contact Jake Lever at <a href="mailto:jlever@stanford.edu">jlever@stanford.edu</a></p>
							</div>
							
							<hr />
							
							<div>
								<p><b>Q: What other projects and resources does this website rely upon?</b></p>
								<p>A: This website is built using <a href="https://nextjs.org/" target="_blank">NextJS</a> and uses the <a href="https://startbootstrap.com/themes/sb-admin-2/" target="_blank">SB Admin 2</a> MIT-licensed <a href="https://getbootstrap.com/" target="_blank">Bootstrap</a> template. This website makes use of FontAwesome assets under a <a href="https://fontawesome.com/license" target="_blank">Creative Commons Attribution 4.0 International license</a>. It uses <a href="https://www.chartjs.org/" target="_blank">ChartJS</a> with <a href="https://github.com/jerairrest/react-chartjs-2" target="_blank">react-chartjs-2</a> to render charts. It uses <a href="https://github.com/jbetancur/react-data-table-component" target="_blank">React Data Table</a> for interactive tables. It also uses <a href="https://leafletjs.com/" target="_blank">Leaflet</a> with <a href="https://react-leaflet.js.org/" target="_blank">React Leaflet</a> to render maps from <a href="https://www.openstreetmap.org/" target="_blank">OpenStreetMap</a>. The code for the website also available at <a href="https://github.com/jakelever/corona-web">https://github.com/jakelever/corona-web</a>.</p>
							</div>
							
							
						</div>
					</div>
				</div>
				

			</Layout>
		)
	}
}

