import axios from "axios";
import xml2js, { parseString } from "xml2js";

interface GoodreadsConfig {
  developerKey: string;
}

interface Book {
  title: string;
  author: string;
}

const BASE_URL = "https://www.goodreads.com";

export default class Goodreads {
  developerKey: string;
  constructor({ developerKey }: GoodreadsConfig) {
    this.developerKey = developerKey;
  }

  async getBooks(): Promise<Book[]> {
    const response = await axios.get(
      `${BASE_URL}/search/index.xml?key=${this.developerKey}&q=programming`
    );
    const data = await new Promise<any>((resolve, reject) => {
      parseString(response.data, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });

    return data.GoodreadsResponse.search[0].results[0].work.map(
      ({ best_book }: any) => ({
        title: best_book[0]?.title[0] || "NOT FOUND",
        author: (best_book[0]?.author || [])
          .map((author: any) => author.name)
          .join(", "),
      })
    );
  }
}
