import { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { MenuUploadStatus } from '../../../types/supabase';
import { GPTMenuAnalysis, GPTMenuCategory, GPTMenuItem, SpecialNote } from '../../../types/menu';
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
      
      // Group text items by their y-coordinate to preserve line structure
      const lineMap = new Map<number, TextItem[]>();
      content.items
        .filter((item): item is TextItem => 'str' in item)
        .forEach(item => {
          // Round y to nearest pixel to handle slight misalignments
          const y = Math.round(item.transform[5]);
          if (!lineMap.has(y)) {
            lineMap.set(y, []);
          }
          lineMap.get(y)!.push(item);
        });

      // Sort lines by y-coordinate (top to bottom)
      const sortedLines = Array.from(lineMap.entries())
        .sort((a, b) => b[0] - a[0])
        .map(([_, items]) => {
          // Sort items within each line by x-coordinate (left to right)
          return items
            .sort((a, b) => a.transform[4] - b.transform[4])
            .map(item => item.str)
            .join(' ');
        });

      return sortedLines.join('\n');
    });

    const pageTexts = await Promise.all(pagePromises);
    
    // Join pages with clear separation
    const pdfText = pageTexts
      .map(text => text.trim())  // Remove extra whitespace
      .filter(text => text)      // Remove empty pages
      .join('\n\n=== PAGE BREAK ===\n\n');

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
function splitTextIntoChunks(text: string, chunkSize: number = 2000): string[] {
  const chunks: string[] = [];
  let currentChunk = '';
  // Split on both sentences and menu section markers
  const splitChunks = text.split(/(?:(?<=[.!?])|(?:===.*===))\s+/);
  
  // Group chunks by potential menu sections
  const sections: string[] = [];
  let currentSection = '';
  
  splitChunks.forEach(chunk => {
    // If this is a section marker or the current section is getting too big
    if (chunk.includes('===') || (currentSection + chunk).length > chunkSize) {
      if (currentSection) {
        sections.push(currentSection.trim());
      }
      currentSection = chunk;
    } else {
      currentSection += (currentSection ? ' ' : '') + chunk;
    }
  });
  
  // Add the last section
  if (currentSection) {
    sections.push(currentSection.trim());
  }
  
  // Further split any large sections
  const finalChunks: string[] = [];
  sections.forEach(section => {
    if (section.length > chunkSize) {
      const sentences = section.split(/(?<=[.!?])\s+/);
      let chunk = '';
      sentences.forEach(sentence => {
        if ((chunk + sentence).length > chunkSize && chunk.length > 0) {
          finalChunks.push(chunk.trim());
          chunk = sentence;
        } else {
          chunk += (chunk ? ' ' : '') + sentence;
        }
      });
      if (chunk) {
        finalChunks.push(chunk.trim());
      }
    } else {
      finalChunks.push(section);
    }
  });
  
  return finalChunks;

}

// Process text with GPT
async function processWithGPT(text: string): Promise<GPTMenuAnalysis> {
  try {
    // Split the text into larger chunks
    const chunks = splitTextIntoChunks(text);
    
    // Process all chunks in parallel with a single prompt that includes cleaning and analysis
    const chunkPromises = chunks.map(async (chunk) => {
      // Try up to 3 times with different prompts
      let attempts = 0;
      let lastError: Error | null = null;
      
      while (attempts < 3) {
        try {
          const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
              { 
                role: "system", 
                content: MENU_ANALYSIS_PROMPT
              },
              { 
                role: "user", 
                content: attempts === 0 
                  ? "Analyze this menu text and return a valid JSON object following the exact structure specified. The response must be pure JSON with no additional text or formatting:\n" + chunk
                  : attempts === 1
                  ? "Parse this menu text into a JSON object. Return ONLY the JSON, with no explanation or formatting:\n" + chunk
                  : "Convert this menu text to JSON format. The output must be a single JSON object and nothing else:\n" + chunk
              }
            ],
            temperature: 0.0,
            max_tokens: 4000,
            presence_penalty: 0.0,
            frequency_penalty: 0.0,
            top_p: 1.0
          });

          const content = response.choices[0].message.content;
          if (!content) {
            throw new Error('No content returned from GPT');
          }

          // Log the raw response for debugging
          console.log(`Attempt ${attempts + 1} raw response:`, content);

          // Try to find a JSON object in the response
          let cleanContent: string;
          
          // First try: Look for content that's already valid JSON
          try {
            JSON.parse(content);
            cleanContent = content;
          } catch {
            // Second try: Extract content between curly braces
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
              throw new Error('No valid JSON object found in response');
            }
            cleanContent = jsonMatch[0].trim();
            
            // Verify the extracted content is valid JSON
            try {
              JSON.parse(cleanContent);
            } catch (error) {
              const parseError = error instanceof Error ? error.message : String(error);
              throw new Error(`Extracted content is not valid JSON: ${parseError}`);
            }
          }

          console.log(`Attempt ${attempts + 1} cleaned response:`, cleanContent);
          
          const parsed = JSON.parse(cleanContent);
        
          // Validate the structure and price formats
          if (!parsed.categories || !Array.isArray(parsed.categories)) {
            throw new Error('Missing or invalid categories array');
          }

          if (parsed.categories.length === 0) {
            throw new Error('Categories array is empty');
          }

          // Validate each category and its items
          parsed.categories.forEach((category: GPTMenuCategory, categoryIndex: number) => {
          if (!category.items || !Array.isArray(category.items)) {
            throw new Error(`Invalid items array in category ${categoryIndex}`);
          }

          (category as GPTMenuCategory).items.forEach((item: GPTMenuItem, itemIndex: number) => {
            // Log the price received from GPT
            console.log('GPT item price:', item.price || item.base_price);

            // CRITICAL: Every item must have a price
            if (
              item.price === undefined &&
              item.base_price === undefined &&
              (!item.size_options || item.size_options.length === 0)
            ) {
              throw new Error(`Missing price for item ${item.name} - every menu item must have a price`);
            }

            // Validate direct price if present
            if (item.price !== undefined && item.price !== null) {
              if (typeof item.price !== 'number' || isNaN(item.price)) {
                throw new Error(`Invalid price for item ${item.name}: ${item.price}`);
              }
              // Ensure exactly 2 decimal places
              item.price = Number(item.price.toFixed(2));
              // Don't allow zero prices unless explicitly marked as free
              if (item.price === 0 && !item.description?.toLowerCase().includes('free')) {
                throw new Error(`Zero price not allowed for item ${item.name} unless marked as free`);
              }
            }

            // Validate base_price format if present
            if (item.base_price !== undefined && item.base_price !== null) {
              if (typeof item.base_price !== 'number' || isNaN(item.base_price)) {
                throw new Error(`Invalid base_price for item ${item.name}: ${item.base_price}`);
              }
              // Ensure exactly 2 decimal places
              item.base_price = Number(item.base_price.toFixed(2));
              // Don't allow zero prices unless explicitly marked as free
              if (item.base_price === 0 && !item.description?.toLowerCase().includes('free')) {
                throw new Error(`Zero price not allowed for item ${item.name} unless marked as free`);
              }
            }

            // Validate size_options prices if present
            if (item.size_options && Array.isArray(item.size_options)) {
              if (item.size_options.length === 0) {
                throw new Error(`Empty size_options array for item ${item.name}`);
              }
              item.size_options.forEach((option: { size: string; price: number }, optionIndex: number) => {
                if (!option.size || typeof option.size !== 'string') {
                  throw new Error(`Missing or invalid size in size_options[${optionIndex}] for item ${item.name}`);
                }
                if (typeof option.price !== 'number' || isNaN(option.price)) {
                  throw new Error(`Invalid price in size_options[${optionIndex}] for item ${item.name}: ${option.price}`);
                }
                if (option.price === 0) {
                  throw new Error(`Zero price not allowed in size_options for item ${item.name}`);
                }
                // Ensure exactly 2 decimal places
                option.price = Number(option.price.toFixed(2));
              });
            }

            // Validate add_ons prices if present
            if (item.add_ons && Array.isArray(item.add_ons)) {
              item.add_ons.forEach((addon: { name: string; price?: number; special_pricing?: boolean }, addonIndex: number) => {
                if (!addon.name) {
                  throw new Error(`Missing name in add_ons[${addonIndex}] for item ${item.name}`);
                }
                if (addon.price !== undefined && !addon.special_pricing) {
                  if (typeof addon.price !== 'number' || isNaN(addon.price)) {
                    throw new Error(`Invalid price in add_ons[${addonIndex}] for item ${item.name}: ${addon.price}`);
                  }
                  if (addon.price === 0) {
                    throw new Error(`Zero price not allowed in add_ons for item ${item.name}`);
                  }
                  // Ensure exactly 2 decimal places
                  addon.price = Number(addon.price.toFixed(2));
                }
              });
            }

            // Log the final price information for debugging
            console.log('Price validation for:', item.name);
            console.log('- base_price:', item.base_price);
            console.log('- size_options:', item.size_options);
            console.log('- add_ons:', item.add_ons);
          });
        });

          return parsed;
        } catch (error: unknown) {
          console.error(`Attempt ${attempts + 1} failed:`, error);
          lastError = error instanceof Error ? error : new Error(String(error));
          attempts++;
          
          // Short delay before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // If we get here, all attempts failed
      throw new Error(`Failed to parse menu chunk after ${attempts} attempts. Last error: ${lastError?.message}`);
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
    
    // Log extracted text with price-focused analysis
    console.log('=== EXTRACTED TEXT ANALYSIS ===');
    console.log('Raw text:', extractedText);
    
    // Log potential price patterns found
    const pricePatterns = [
      /\$?\d+\.\d{2}/g,                    // Standard price format: $12.99 or 12.99
      /\$?\d+(?:\.\d{2})?-/g,              // Trailing dash format: $12- or $12.99-
      /\$?\d+(?:\.\d{2})?\s*(?:each|ea)/ig,// Price with 'each': $12.99 each
      /(?:starts?|starting)\s+(?:at|from)\s+\$?\d+(?:\.\d{2})?/ig, // "Starting at" prices
      /\$?\d+(?:\.\d{2})?\s*\/\s*\$?\d+(?:\.\d{2})?/g, // Price ranges: $12.99/$14.99
      /\$?\d+(?:\.\d{2})?\s*(?:sm|md|lg|small|medium|large)/ig, // Size-based pricing
      /\$?\d+(?:\.\d{2})?\s*(?:\d{1,2}"|inch)/ig,  // Size-based pricing with inches
    ];

    const allPriceMatches = new Set<string>();
    pricePatterns.forEach(pattern => {
      const matches = extractedText.matchAll(pattern);
      for (const match of matches) {
        allPriceMatches.add(match[0]);
      }
    });
    console.log('Potential price matches:', Array.from(allPriceMatches));
    
    // Look for common price patterns in lines
    const priceLines = extractedText.split('\n')
      .filter(line => pricePatterns.some(pattern => pattern.test(line)))
      .map(line => line.trim());
    console.log('Lines containing prices:', priceLines);
    
    // Look for item-price pairs with various formats
    const itemPricePatterns = [
      /[a-zA-Z].+?\$?\d+\.\d{2}\b/,          // Standard item with price
      /[a-zA-Z].+?\$?\d+(?:-|each|ea)\b/i,   // Items with dash or 'each' prices
      /[a-zA-Z].+?(?:sm|md|lg|small|medium|large)\s+\$?\d+(?:\.\d{2})?\b/i,  // Size-based prices
      /[a-zA-Z].+?\d{1,2}"\s+\$?\d+(?:\.\d{2})?\b/,  // Inch-based prices
    ];

    // Process the menu data
    const processedMenuData: GPTMenuAnalysis = await processWithGPT(extractedText);

    // Post-process the menu data to standardize prices
    const standardizedMenuData: GPTMenuAnalysis = {
      categories: processedMenuData.categories.map((category: GPTMenuCategory) => ({
        ...category,
        items: category.items.map((item: GPTMenuItem) => {
          // Log all available price information
          console.log('Processing item:', {
            name: item.name,
            price: item.price,
            base_price: item.base_price,
            size_options: item.size_options,
            add_ons: item.add_ons
          });

          let finalPrice: number;

          if (item.price !== undefined && item.price !== null) {
            // Validate and use direct price if available
            if (typeof item.price !== 'number' || isNaN(item.price)) {
              throw new Error(`Invalid direct price for item ${item.name}: ${item.price}`);
            }
            finalPrice = item.price;
            console.log(`Using direct price for ${item.name}:`, finalPrice);
          } else if (item.size_options && item.size_options.length > 0) {
            // If size options are present, take the price of the first option
            finalPrice = item.size_options[0].price;
            console.log(`Using size option price for ${item.name}:`, finalPrice);
          } else if (item.base_price !== undefined && item.base_price !== null) {
            // Use base_price if available
            finalPrice = item.base_price;
            console.log(`Using base price for ${item.name}:`, finalPrice);
          } else {
            // This should never happen due to earlier validation
            throw new Error(`No valid price found for item ${item.name}`);
          }

          // Double-check the final price
          if (typeof finalPrice !== 'number' || isNaN(finalPrice)) {
            throw new Error(`Invalid price for item ${item.name}: ${finalPrice}`);
          }
          
          // Don't allow zero prices unless explicitly marked as free
          if (finalPrice === 0 && !item.description?.toLowerCase().includes('free')) {
            throw new Error(`Zero price not allowed for item ${item.name} unless marked as free`);
          }

          // Ensure exactly 2 decimal places
          finalPrice = Number(finalPrice.toFixed(2));

          // Return item with standardized price
          return {
            ...item,
            price: finalPrice
          };
        })
      })),
      special_notes: processedMenuData.special_notes || []
    };

    // Log the final processed data for verification
    console.log('=== FINAL MENU DATA ANALYSIS ===');
    standardizedMenuData.categories.forEach(category => {
      console.log(`Category: ${category.name}`);
      category.items.forEach(item => {
        console.log(`  Item: ${item.name}`);
        console.log(`    Final price: ${item.price}`);
        console.log(`    Base price: ${item.base_price}`);
        if (item.size_options) {
          console.log(`    Size options:`, item.size_options);
        }
        if (item.add_ons) {
          console.log(`    Add-ons:`, item.add_ons);
        }
      });
    });
    console.log('=== END FINAL ANALYSIS ===');

    // Call the database function to process the menu data
    const { data: processResult, error: processError } = await supabase.rpc('process_menu_upload', {
      p_upload_id: uploadId,
      p_menu_data: standardizedMenuData
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
