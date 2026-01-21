const axios = require('axios');
const xml2js = require('xml2js');
const sites = require('./config');

const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';

async function fetchSitemapUrls(sitemapUrl) {
  try {
    console.log(`Fetching sitemap from ${sitemapUrl}...`);
    const response = await axios.get(sitemapUrl);
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(response.data);
    
    if (!result.urlset || !result.urlset.url) {
      console.warn(`Invalid sitemap format or empty sitemap for ${sitemapUrl}`);
      return [];
    }

    const urls = result.urlset.url.map(entry => entry.loc[0]);
    console.log(`Found ${urls.length} URLs in sitemap.`);
    return urls;
  } catch (error) {
    console.error(`Error fetching sitemap ${sitemapUrl}:`, error.message);
    return [];
  }
}

async function submitToIndexNow(site, urls) {
  if (urls.length === 0) {
    console.log(`No URLs to submit for ${site.host}.`);
    return;
  }

  const keyLocation = site.keyLocation || `https://${site.host}/${site.key}.txt`;
  
  const payload = {
    host: site.host,
    key: site.key,
    keyLocation: keyLocation,
    urlList: urls
  };

  try {
    console.log(`Submitting ${urls.length} URLs to IndexNow for ${site.host}...`);
    const response = await axios.post(INDEXNOW_ENDPOINT, payload, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      }
    });

    if (response.status === 200 || response.status === 202) {
      console.log(`Successfully submitted URLs for ${site.host}.`);
    } else {
      console.warn(`Unexpected response status for ${site.host}: ${response.status}`);
      console.log(response.data);
    }
  } catch (error) {
    console.error(`Error submitting to IndexNow for ${site.host}:`, error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    // Continue to next site, don't exit process
  }
}

async function main() {
  console.log('Starting IndexNow submission for all sites...');
  
  for (const site of sites) {
    console.log(`\nProcessing ${site.host}...`);
    const urls = await fetchSitemapUrls(site.sitemap);
    await submitToIndexNow(site, urls);
  }
  
  console.log('\nAll IndexNow submissions completed.');
}

main();
