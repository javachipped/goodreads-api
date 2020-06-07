import axios from "axios";
import { parseString } from "xml2js";
import { RootObjectSearch, Search } from "./types";

interface GoodreadsConfig {
  developerKey: string;
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

const BASE_URL = "https://www.goodreads.com";
const RESULTS_PER_PAGE = 20;

export default class Goodreads {
  developerKey: string;
  constructor({ developerKey }: GoodreadsConfig) {
    this.developerKey = developerKey;
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
