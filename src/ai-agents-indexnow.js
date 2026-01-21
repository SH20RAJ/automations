const axios = require('axios');
const xml2js = require('xml2js');

const SITEMAP_URL = 'http://ai-agents.30tools.com/sitemap.xml';
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
const HOST = 'ai-agents.30tools.com';
const KEY = 'b786ce2423fa4a1182fa2c99ae947657';
const KEY_LOCATION = `http://${HOST}/${KEY}.txt`;

async function fetchSitemapUrls() {
  try {
    console.log(`Fetching sitemap from ${SITEMAP_URL}...`);
    const response = await axios.get(SITEMAP_URL);
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(response.data);
    
    if (!result.urlset || !result.urlset.url) {
      throw new Error('Invalid sitemap format');
    }

    const urls = result.urlset.url.map(entry => entry.loc[0]);
    console.log(`Found ${urls.length} URLs in sitemap.`);
    return urls;
  } catch (error) {
    console.error('Error fetching sitemap:', error.message);
    process.exit(1);
  }
}

async function submitToIndexNow(urls) {
  if (urls.length === 0) {
    console.log('No URLs to submit.');
    return;
  }

  const payload = {
    host: HOST,
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList: urls
  };

  try {
    console.log(`Submitting ${urls.length} URLs to IndexNow...`);
    const response = await axios.post(INDEXNOW_ENDPOINT, payload, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      }
    });

    if (response.status === 200 || response.status === 202) {
      console.log('Successfully submitted URLs to IndexNow.');
    } else {
      console.warn(`Unexpected response status: ${response.status}`);
      console.log(response.data);
    }
  } catch (error) {
    console.error('Error submitting to IndexNow:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

async function main() {
  const urls = await fetchSitemapUrls();
  await submitToIndexNow(urls);
}

main();
