import { embedTextAndPushToQdrant } from '../../utils/qdrant';
import type { IncomingMessage, ServerResponse } from 'node:http';

export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  let body = '';
  req.on('data', chunk => {
    body += chunk;
  });
  req.on('end', async () => {
    try {
      const { text, filename } = JSON.parse(body);
      if (!text || !filename) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Missing text or filename' }));
        return;
      }
      await embedTextAndPushToQdrant(text, filename);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ message: 'Teks berhasil dipush ke Qdrant' }));
    } catch (e: any) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: e.message }));
    }
  });
}
