const axios = require('axios');
const xml2js = require('xml2js');

const SITEMAP_URL = 'https://unstory.app/sitemap.xml';
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
const HOST = 'unstory.app';
const KEY = '6770db5397184cacb0c3ea38d9827e06';
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;

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
