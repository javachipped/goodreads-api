export interface RootObjectSearch {
  GoodreadsResponse: GoodreadsResponse;
}

interface GoodreadsResponse {
  Request: Request[];
  search: Search[];
}

export interface Search {
  query: string[];
  "results-start": string[];
  "results-end": string[];
  "total-results": string[];
  source: string[];
  "query-time-seconds": string[];
  results: Result[];
}

interface Result {
  work: Work[];
}

interface Work {
  id: Id[];
  books_count: Id[];
  ratings_count: Id[];
  text_reviews_count: Id[];
  original_publication_year: Id[];
  original_publication_month: Originalpublicationmonth[];
  original_publication_day: Originalpublicationmonth[];
  average_rating: string[];
  best_book: Bestbook[];
}

interface Bestbook {
  $: _;
  id: Id[];
  title: string[];
  author: Author[];
  image_url: string[];
  small_image_url: string[];
}

interface Author {
  id: Id[];
  name: string[];
}

interface Originalpublicationmonth {
  _?: string;
  $: _2;
}

interface _2 {
  type: string;
  nil?: string;
}

interface Id {
  _: string;
  $: _;
}

interface _ {
  type: string;
}

interface Request {
  authentication: string[];
  key: string[];
  method: string[];
}
