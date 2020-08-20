import argparse
import json
from datetime import datetime

if __name__ == '__main__':
	parser = argparse.ArgumentParser('Create a predefined sitemap with updated dates for CoronaCentral')
	args = parser.parse_args()
	
	page_listing_file = 'lib/pages.json'
	print("Loading page data from %s" % page_listing_file)
	pages = ['','/trending','/faqs','/feedback']
	with open(page_listing_file) as f:
		page_json = json.load(f)
		for p in page_json:
			pages.append( '/' + p['page'] )
	pages = sorted(pages)
			
	now = datetime.now().isoformat()
			
	output_file = 'public/sitemap.xml'
	print("Saving sitemap to %s" % output_file)
	with open(output_file,'w') as f:
		f.write('<?xml version="1.0" encoding="UTF-8"?>\n')
		f.write('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n')
		for p in pages:
			f.write('  <url>\n')
			f.write('    <loc>http://www.coronacentral.ai%s</loc>\n' % p)
			f.write('    <lastmod>%s/lastmod>\n' % now)
			f.write('    <changefreq>daily</changefreq>\n')
			f.write('  </url>\n')
		f.write('</urlset>\n')
	