import { promises as fs } from 'fs';
import * as pdfParse from 'pdf-parse';
import formidable from 'formidable';

export default defineEventHandler(async (event) => {
  return await new Promise((resolve) => {
    const form = formidable();
    form.parse(event.node.req, async (err, fields, files) => {
      try {
        if (err) {
          console.error('Form parse error:', err);
          resolve({ error: 'Error parsing form data', detail: String(err) });
          return;
        }

        const fileArray = files.pdf;
        const file = Array.isArray(fileArray) ? fileArray[0] : fileArray;

        if (!file) {
          console.error('No PDF uploaded');
          resolve({ error: 'No PDF uploaded' });
          return;
        }

        console.log('Processing file:', file.originalFilename, file.filepath);
        const dataBuffer = await fs.readFile(file.filepath);
        
        const pdf = (pdfParse as any).default || pdfParse;
        const data = await pdf(dataBuffer);
        if (!data.text) {
          console.error('PDF extraction returned empty text');
          resolve({ error: 'Ekstraksi PDF kosong' });
          return;
        }
        resolve({ text: data.text, filename: file.originalFilename || 'uploaded.pdf' });
        console.log('PDF extraction success, text length:', data.text.length);
      } catch (e: any) {
        console.error('Upload handler error:', e);
        resolve({ error: e.message || 'Unknown error', stack: e.stack });
      }
    });
  });
});
