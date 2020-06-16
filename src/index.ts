import axios from "axios";
import { parseString } from "xml2js";
import { RootObjectSearch, Search } from "./types";
import OAuth from "oauth";

interface GoodreadsConfig {
  developerKey: string;
  developerSecret: string;
}

interface Book {
  title: string;
  author: Author;
}

interface Author {
  name: string;
}

interface SearchInput {
  query: string;
  page?: number;
  searchInFields?: "title" | "author" | "all";
}

interface RequestToken {
  requestToken: string;
  requestTokenSecret: string;
}

interface AccessToken {
  accessToken: string;
  accessTokenSecret: string;
}

interface IUserLoginURL {
  requestToken: string;
}

const BASE_URL = "https://www.goodreads.com";
const RESULTS_PER_PAGE = 20;

export default class Goodreads {
  private developerKey: string;
  private developerSecret: string;
  private oauth: OAuth.OAuth;

  constructor({ developerKey, developerSecret }: GoodreadsConfig) {
    this.developerKey = developerKey;
    this.developerSecret = developerSecret;
    this.oauth = new OAuth.OAuth(
      "https://goodreads.com/oauth/request_token",
      "https://goodreads.com/oauth/access_token",
      developerKey,
      developerSecret,
      "1.0",
      null,
      "HMAC-SHA1"
    );
  }

  async userLoginURL({ requestToken }: IUserLoginURL): Promise<string> {
    const GOODREADS_AUTHORIZE_URL = "/oauth/authorize?oauth_token=";
    return `${BASE_URL}${GOODREADS_AUTHORIZE_URL}${requestToken}`;
  }

  /**
   * Keep in mind that this is the oauth_token. It will be a token that needs to be authenticated
   * by Goodreads API using: https://www.goodreads.com/oauth/authorize?oauth_token=${requestToken}.
   * Don't go around trying to use this in API requests like an idiot
   */
  async generateRequestToken(): Promise<RequestToken> {
    return await new Promise((resolve, reject) => {
      this.oauth.getOAuthRequestToken(
        (err, token: string, token_secret: string, qs) => {
          if (err) {
            reject(err);
          } else {
            resolve({ requestToken: token, requestTokenSecret: token_secret });
          }
        }
      );
    });
  }

  /**
   * This access token and secret can now be used to make API requests. Store this to make requests using this package.
   * @param param0 Request token and the request token secret: Generate them for the user using generateRequestToken
   */
  async generateAccessToken({
    requestToken,
    requestTokenSecret,
  }: RequestToken): Promise<AccessToken> {
    return await new Promise((resolve, reject) => {
      this.oauth.getOAuthAccessToken(
        requestToken,
        requestTokenSecret,
        (err, token, token_secret, _) => {
          if (err) {
            reject("Error generating the OAuth Access Token");
          } else {
            // Now you have an Access Token that you can make requests with.
            resolve({ accessToken: token, accessTokenSecret: token_secret });
          }
        }
      );
    });
  }

  async getUserId({ accessToken, accessTokenSecret }: AccessToken) {
    const endpoint = `${BASE_URL}/api/auth_user`;
    const response = await new Promise((resolve, reject) => {
      this.oauth.get(
        endpoint,
        accessToken,
        accessTokenSecret,
        (err, response) => {
          if (err) {
            reject(
              "Error making a request to Goodreads with the given credentials"
            );
          } else {
            resolve("Done");
            console.log(response);
          }
        }
      );
    });
    return response;
  }

  async searchBooks({
    query,
    page = 1,
    searchInFields = "all",
  }: SearchInput): Promise<{ totalPages: number; books: Book[] }> {
    const response = await axios.get(
      `${BASE_URL}/search/index.xml?key=${this.developerKey}&q=${query}&page=${page}&search=${searchInFields}`
    );
    const data: RootObjectSearch = await new Promise<any>((resolve, reject) => {
      parseString(response.data, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });

    const search: Search = data.GoodreadsResponse.search[0];
    const totalPages = Math.ceil(
      parseInt(search["total-results"][0]) / RESULTS_PER_PAGE
    );

    const books = (search.results[0]?.work || []).map(({ best_book }) => ({
      title: best_book[0]?.title[0] || "NOT FOUND",
      author: {
        name: (best_book[0]?.author || [])
          .map((author) => author.name)
          .join(", "),
      },
    }));

    return {
      totalPages,
      books,
    };
  }
}
