/**
 * Book content loaded from JSON.
 */

import book from '../../data/reader/phenomenology-culture-systems-v1.json' with { type: 'json' };

export const BOOK_ID = book.id;
export const BOOK_TITLE = book.title;
export const CHAPTERS = book.chapters;
