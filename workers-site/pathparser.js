
export default class PathParser {

    constructor(config) {
        if (!config.defaultLanguage) {
            throw 'defaultLanguage not configured.';
        }

        this.defaultLanguage = config.defaultLanguage;
    }

    /**
     * Parses a route URL and extracts a language code from the beginning of the URL,
     * if it exists.
     * @param {string} url 
     */
    parse(url) {
        const pathname = url.pathname;
        const pathNamePieces = pathname.substr(1).split('/');

        let language = null;
        let path = pathname;

        if (pathNamePieces.length && this.looksLikeALanguage(pathNamePieces[0])) {
            language = pathNamePieces.shift();
            path = pathNamePieces.join('/');
        } else {
            language = this.defaultLanguage;
        }

        path = path ? path : '/';

        return {
            path,
            language
        }
    }

    /**
     * Determines if the pathPiece looks like a language code.
     * @param {string} pathPiece 
     */
    looksLikeALanguage(pathPiece) {
        // some assumptions here, modify this to fit your needs
        const looksLikeLanguage = pathPiece && (pathPiece.length === 2 || pathPiece.length === 5 && pathPiece[2] === '-');
        return looksLikeLanguage;
    }

}