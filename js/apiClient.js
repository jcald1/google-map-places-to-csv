/*/
  params  url : site that doesn’t send Access-Control-*
 */
import config from './config.js';

const apiClient = (url, currentRecordNumber) => {
    const proxyurl = config.corsProxyUrl;

    console.log(`Calling Google ${url} record number: ${currentRecordNumber}`);
    return fetch(proxyurl + url)
        .then(
            (response) => {
                if (response.status !== 200) {
                    const err = new Error(`Looks like there was a problem calling ${url}. Status Code: 
                        ${response.status}`)
                    console.error(err);
                    throw err;
                }
                console.log('url', url, 'response', response)
                // Examine the text in the response
                return response.json()

                    .catch(err => {
                        console.error(err);
                        throw err;
                    })
            }
        )
        .catch((err) => {
            console.error(`Fetch Error callplaceSearching ${url}`, err);
            //handleError(err)
            throw err;
        });
}
export {apiClient};