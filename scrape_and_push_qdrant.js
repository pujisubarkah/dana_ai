// scrape_and_push_qdrant.js
import axios from 'axios';
import * as cheerio from 'cheerio';
import { QdrantClient } from '@qdrant/js-client-rest';

const QDRANT_URL = 'http://localhost:6333';
const COLLECTION_NAME = 'lan_articles';

async function scrapeArticle(url) {
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);
  const title = $('h1').first().text().trim();
  const paragraphs = [];
  $('article p').each((_, el) => {
    const text = $(el).text().trim();
    if (text.length > 30) paragraphs.push(text);
  });
  return { title, content: paragraphs.join('\n\n') };
}

// Dummy embedder: replace with real embedding model/API
async function embedText(text) {
  return Array(1536).fill(0).map((_, i) => Math.sin(i + text.length));
}

async function main() {
  const url = 'https://lan.go.id/lan-tekankan-pentingnya-mutu-pembelajaran-asn-melalui-implementasi-corporate-university';
  const article = await scrapeArticle(url);
  const vector = await embedText(article.content);

  const client = new QdrantClient({ url: QDRANT_URL });

  // Create collection if not exists
  try {
    await client.getCollection(COLLECTION_NAME);
  } catch {
    await client.createCollection(COLLECTION_NAME, {
      vectors: { size: vector.length, distance: 'Cosine' },
    });
  }

  // Upsert article
  await client.upsert(COLLECTION_NAME, {
    points: [
      {
        id: Date.now(),
        vector,
        payload: {
          title: article.title,
          url,
          content: article.content,
        },
      },
    ],
  });

  console.log('Artikel berhasil dimasukkan ke Qdrant!');
}

main().catch(console.error);
