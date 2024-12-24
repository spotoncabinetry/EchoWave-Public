import { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { MenuUploadStatus } from '../../../types/supabase';
import { GPTMenuAnalysis, GPTMenuCategory, SpecialNote } from '../../../types/menu';
import { createWorker } from 'tesseract.js';
import { OpenAI } from 'openai';
import { getDocument } from 'pdfjs-dist';
import { TextItem } from 'pdfjs-dist/types/src/display/api';
import { MENU_ANALYSIS_PROMPT } from '../../../lib/openai/prompts/menu-analysis';

// Set up PDF.js worker
if (typeof window === 'undefined') {
  const pdfjsWorker = require('pdfjs-dist/build/pdf.worker.entry');
  (globalThis as any).pdfjsWorker = pdfjsWorker;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Enable JSON body parser
export const config = {
  api: {
    bodyParser: true
  },
};

interface ParseRequest extends NextApiRequest {
  body: {
    uploadId: string;
  };
}

// Download file
async function downloadFile(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to download file');
  return await response.arrayBuffer();
}

// Extract text from PDF using PDF.js
async function extractTextFromPDF(pdfUrl: string): Promise<string> {
  try {
    // Download PDF
    const pdfBuffer = await downloadFile(pdfUrl);

    // Try PDF.js text extraction first
    const loadingTask = getDocument(new Uint8Array(pdfBuffer));
    const pdf = await loadingTask.promise;

    // Process all pages in parallel
    const pagePromises = Array.from({ length: pdf.numPages }, (_, i) => i + 1).map(async (pageNum) => {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      return content.items
        .filter((item): item is TextItem => 'str' in item)
        .map(item => item.str)
        .join(' ');
    });

    const pageTexts = await Promise.all(pagePromises);
    const pdfText = pageTexts.join('\n');

    // If we got meaningful text, return it
    if (pdfText.trim().length > 100) {
      return pdfText;
    }

    // If PDF.js didn't get enough text, try OCR
    console.log('PDF text extraction yielded insufficient text, falling back to OCR...');

    // Initialize Tesseract worker
    const worker = await createWorker();
    let ocrText = '';

    try {
      // Process the PDF buffer directly with OCR
      const { data: { text } } = await worker.recognize(Buffer.from(pdfBuffer));
      ocrText = text;
    } finally {
      await worker.terminate();
    }

    return ocrText || pdfText;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw error;
  }
}

// Split text into larger chunks to minimize API calls
function splitTextIntoChunks(text: string, chunkSize: number = 4000): string[] {
  const chunks: string[] = [];
  let currentChunk = '';
  const sentences = text.split(/(?<=[.!?])\s+/);

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

// Process text with GPT
async function processWithGPT(text: string): Promise<GPTMenuAnalysis> {
  try {
    // Split the text into larger chunks
    const chunks = splitTextIntoChunks(text);
    
    // Process all chunks in parallel with a single prompt that includes cleaning and analysis
    const chunkPromises = chunks.map(async (chunk) => {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { 
            role: "system", 
            content: MENU_ANALYSIS_PROMPT + "\n\nIMPORTANT: Your response must be valid JSON that matches the specified structure exactly. Do not include any text outside of the JSON object." 
          },
          { 
            role: "user", 
            content: "Please analyze this menu text directly. Clean up any OCR errors and format as JSON:\n" + chunk
          }
        ],
        temperature: 0.3
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('No content returned from GPT');
      }

      try {
        return JSON.parse(content.trim());
      } catch (error) {
        console.error('Failed to parse GPT response:', content);
        throw new Error('Invalid JSON response from GPT');
      }
    });

    // Wait for all chunks to be processed
    const results = await Promise.all(chunkPromises);

    // Merge results
    const mergedResult: GPTMenuAnalysis = {
      categories: [] as GPTMenuCategory[],
      special_notes: [] as SpecialNote[]
    };

    results.forEach(result => {
      if (result.categories) {
        mergedResult.categories.push(...result.categories);
      }
      if (result.special_notes) {
        mergedResult.special_notes.push(...result.special_notes);
      }
    });

    return mergedResult;
  } catch (error) {
    console.error('Error processing with GPT:', error);
    throw error;
  }
}

export default async function handler(
  req: ParseRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let supabase;
  try {
    const uploadId = req.body.uploadId;
    if (!uploadId) {
      return res.status(400).json({ error: 'Missing uploadId' });
    }

    // Initialize Supabase client with auth context
    supabase = createPagesServerClient({ req, res });

    // Verify authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user's restaurant_id from profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('restaurant_id')
      .eq('id', session.user.id)
      .single();

    if (profileError || !profileData?.restaurant_id) {
      return res.status(400).json({ error: 'No restaurant profile found' });
    }

    // Verify the upload belongs to the user's restaurant
    const { data: uploadData, error: uploadError } = await supabase
      .from('menu_uploads')
      .select('restaurant_id, file_url')
      .eq('id', uploadId)
      .eq('restaurant_id', profileData.restaurant_id)
      .single();

    if (uploadError || !uploadData) {
      return res.status(403).json({ error: 'Unauthorized access to upload' });
    }

    // Update status to processing
    await supabase
      .from('menu_uploads')
      .update({
        status: 'processing' as MenuUploadStatus
      })
      .eq('id', uploadId)
      .eq('restaurant_id', profileData.restaurant_id);

    // Process the menu
    const extractedText = await extractTextFromPDF(uploadData.file_url);
    console.log('Extracted text:', extractedText);
    const menuData = await processWithGPT(extractedText);

    // Log the menu data for debugging
    console.log('GPT parse result:', JSON.stringify(menuData, null, 2));

    // Call the database function to process the menu data
    const { data: processResult, error: processError } = await supabase.rpc('process_menu_upload', {
      p_upload_id: uploadId,
      p_menu_data: menuData
    });

    if (processError) {
      console.error('Process error details:', processError);
      throw new Error(`Failed to process menu: ${processError.message}`);
    }

    console.log('Menu processing completed:', processResult);

    // Update status to completed
    await supabase
      .from('menu_uploads')
      .update({
        status: 'completed' as MenuUploadStatus
      })
      .eq('id', uploadId)
      .eq('restaurant_id', profileData.restaurant_id);

    return res.status(200).json({ success: true });

  } catch (error: any) {
    console.error('Error processing menu:', error);

    // Update status to failed if we have supabase client and uploadId
    if (supabase && req.body?.uploadId) {
      try {
        await supabase
          .from('menu_uploads')
          .update({
            status: 'failed' as MenuUploadStatus,
            error_message: error.message
          })
          .eq('id', req.body.uploadId);
      } catch (updateError) {
        console.error('Failed to update error status:', updateError);
      }
    }

    // Send error response
    res.status(500).json({ 
      error: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
