
export default class LayoutService {

    constructor(config) {
        if (!config.sitecoreApiHost) {
            throw 'sitecoreApiHost not configured in config.'
        }
        if (!config.jssAppName) {
            throw 'jssAppName not configured in config'
        }
        if (!config.sitecoreApiKey) {
            throw 'sitecoreApiKey not configured in config'
        }

        this.sitecoreApiHost = config.sitecoreApiHost;
        this.jssAppName = config.jssAppName;
        this.sitecoreApiKey = config.sitecoreApiKey;
    }

    /**
     * Build the layout service request URL for a route.
     * @param {string} route 
     * @param {string} language 
     */
    buildRouteRequestUrl(route, language) {
        const layoutUrl = `${this.sitecoreApiHost}/sitecore/api/layout/render/jss?item=${route}&sc_lang=${language}&sc_apikey=${this.sitecoreApiKey}`;
        return layoutUrl;
    }

    /**
     * Builds the dictionary layout service request URL for a language.
     * @param {string} language 
     */
    buildDictionaryRequestUrl(language) {
        const dictionaryUrl = `${this.sitecoreApiHost}/sitecore/api/jss/dictionary/${this.jssAppName}/${language}?sc_apikey=${this.sitecoreApiKey}`;
        return dictionaryUrl;
    }

    /**
     * Fetches the route JSON from layout service.
     * @param {string} route 
     * @param {string} language 
     */
    async fetchRoute(route, language) {
        const layoutUrl = this.buildRouteRequestUrl(route, language);
        const json = await this.fetchJson(layoutUrl);
        return json;
    }

    /**
     * Fetches the dictionary JSON from layout service.
     * @param {string} language 
     */
    async fetchDictionary(language) {
        const dictionaryUrl = this.buildDictionaryRequestUrl(language);
        const json = await this.fetchJson(dictionaryUrl);
        return json;
    }

    /**
     * Handles calling fetch and retrieving the JSON for web requests.
     * @param {string} url 
     * @param {any} options 
     */
    async fetchJson(url, options) {
        const response = await fetch(url, options);
        const json = await response.json();
        return json;
    }
}