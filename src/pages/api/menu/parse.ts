import { NextApiRequest, NextApiResponse } from 'next';
import { createWorker, createScheduler } from 'tesseract.js';
import { fromPath } from 'pdf2pic';
import * as fs from 'fs';
import * as path from 'path';
import pdfParse from 'pdf-parse';
import { MENU_ANALYSIS_PROMPT } from '../../../lib/openai/prompts/menu-analysis';
import OpenAI from 'openai';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { config as envConfig } from '../../../lib/env.config';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: envConfig.OPENAI_API_KEY
});

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '20mb'
    },
    responseLimit: '20mb'
  }
};

const options = {
  density: 300,
  saveFilename: "menu",
  savePath: "./images",
  format: "png",
  width: 2480,
  height: 3508
};

const serverLog = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  if (data) {
    console.log(logMessage, JSON.stringify(data, null, 2));
  } else {
    console.log(logMessage);
  }
};

async function performOCR(imagePath: string): Promise<string> {
  const scheduler = createScheduler();
  const worker = await createWorker({
    logger: (m: any) => {
      if (typeof m === 'object' && m !== null) {
        console.log(m);
      }
    }
  });
  await worker.loadLanguage('eng');
  await worker.initialize('eng');

  await scheduler.addWorker(worker);
  const { data: { text } } = await worker.recognize(imagePath);
  await scheduler.terminate();

  return text;
}

async function extractTextFromImage(pdfPath: string): Promise<string> {
  try {
    const storeAsImage = fromPath(pdfPath, options);
    const pageToConvertAsImage = 1;

    const tempImagePath = path.join(process.cwd(), 'temp', 'menu.png');
    await storeAsImage(pageToConvertAsImage);

    const extractedText = await performOCR(tempImagePath);

    // Clean up temporary files
    if (fs.existsSync(tempImagePath)) {
      fs.unlinkSync(tempImagePath);
    }

    return extractedText;
  } catch (error) {
    console.error('Error in extractTextFromImage:', error);
    throw error;
  }
}

async function extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(pdfBuffer);
    return data.text;
  } catch (error) {
    console.error('Error in extractTextFromPDF:', error);
    
    // If PDF text extraction fails, try OCR
    console.log('Attempting OCR extraction...');
    const tempPdfPath = path.join(process.cwd(), 'temp', 'temp.pdf');
    
    // Ensure temp directory exists
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Write PDF to temporary file
    fs.writeFileSync(tempPdfPath, pdfBuffer);
    
    try {
      const text = await extractTextFromImage(tempPdfPath);
      
      // Clean up
      if (fs.existsSync(tempPdfPath)) {
        fs.unlinkSync(tempPdfPath);
      }
      
      return text;
    } catch (ocrError) {
      console.error('OCR extraction failed:', ocrError);
      throw new Error('Both PDF text extraction and OCR failed');
    }
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  serverLog('=== Menu Parse API Handler Start ===');
  serverLog('Request Method:', req.method);

  if (req.method !== 'POST') {
    serverLog('Invalid Method:', req.method);
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Handle error logging requests
    if (req.body.error) {
      serverLog('Client Error:', req.body.error);
      return res.status(200).json({ logged: true });
    }

    // Initialize Supabase client with auth context
    const supabase = createServerSupabaseClient({ req, res });

    // Check if user is authenticated
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session) {
      serverLog('Authentication Error:', authError);
      return res.status(401).json({ message: 'Unauthorized' });
    }

    serverLog('Processing upload request', {
      debug: req.body.debug,
      uploadId: req.body.uploadId
    });

    const { pdf, uploadId } = req.body;

    if (!pdf || !uploadId) {
      const error = 'Missing required fields';
      serverLog('Validation Error:', { hasPdf: !!pdf, hasUploadId: !!uploadId });
      return res.status(400).json({ message: error });
    }

    serverLog('Processing upload ID:', uploadId);

    try {
      // Get the upload record to get restaurant_id
      serverLog('Fetching upload record...');
      const { data: uploadRecord, error: fetchError } = await supabase
        .from('menu_uploads')
        .select('restaurant_id')
        .eq('id', uploadId)
        .single();

      if (fetchError) {
        serverLog('Database fetch error:', fetchError);
        throw new Error(`Failed to fetch upload record: ${fetchError.message}`);
      }

      if (!uploadRecord) {
        const error = 'Upload record not found';
        serverLog('Error:', { uploadId });
        throw new Error(error);
      }

      // Convert base64 to buffer
      serverLog('Converting PDF to buffer...');
      const base64Data = pdf.split(',')[1];
      const pdfBuffer = Buffer.from(base64Data, 'base64');
      
      // Generate filename
      const filename = `${uploadRecord.restaurant_id}/${uploadId}.pdf`;
      serverLog('Generated filename:', filename);
      
      // Upload to Supabase Storage
      serverLog('Uploading to Supabase Storage...');
      const { error: storageError } = await supabase.storage
        .from('menu-files')
        .upload(filename, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: true
        });

      if (storageError) {
        serverLog('Storage upload error:', storageError);
        throw new Error(`Failed to upload file: ${storageError.message}`);
      }

      // Get public URL
      serverLog('Getting public URL...');
      const { data: { publicUrl } } = supabase.storage
        .from('menu-files')
        .getPublicUrl(filename);

      serverLog('File uploaded successfully, updating record with URL:', publicUrl);

      // Update the record with file URL
      const { error: urlUpdateError } = await supabase
        .from('menu_uploads')
        .update({
          file_url: publicUrl,
          status: 'uploaded'
        })
        .eq('id', uploadId);

      if (urlUpdateError) {
        serverLog('URL update error:', urlUpdateError);
        throw new Error(`Failed to update file URL: ${urlUpdateError.message}`);
      }

      serverLog('Record updated successfully');

      // Extract text from PDF
      serverLog('Extracting text from PDF');
      const extractedText = await extractTextFromPDF(pdfBuffer);

      serverLog('Text extracted, sending to OpenAI');

      // Process with OpenAI
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are a menu analysis expert. Extract only menu items and their categories from the provided text.
You must ONLY respond with valid JSON. Do not include any other text or explanations.
The JSON must follow this exact format:
{
  "categories": [
    {
      "name": "Category Name",
      "description": "Optional category description"
    }
  ],
  "items": [
    {
      "name": "Item Name",
      "description": "Item description",
      "price": 15.99,
      "category_name": "Category Name"  // This should match one of the category names above
    }
  ]
}

Rules:
1. Extract ONLY menu items, prices, and categories
2. Ignore restaurant information, hours, addresses, etc.
3. If a price range is given (e.g., "$15-$20"), use the lower price
4. If no description is available, use an empty string
5. If you cannot determine a category, use "Other"
6. Remove any currency symbols from prices
7. If you cannot extract any menu items, respond with: {"categories": [], "items": []}

Example Output:
{
  "categories": [
    {
      "name": "Appetizers",
      "description": "Start your meal with these delicious starters"
    }
  ],
  "items": [
    {
      "name": "Garlic Bread",
      "description": "Fresh bread with garlic butter",
      "price": 5.99,
      "category_name": "Appetizers"
    }
  ]
}`
          },
          {
            role: "user",
            content: extractedText
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      });

      const menuData = completion.choices[0].message.content;
      serverLog('OpenAI processing complete');

      // Validate JSON before updating
      let parsedMenuData;
      try {
        parsedMenuData = JSON.parse(menuData || '{}');
        if (!Array.isArray(parsedMenuData.categories) || !Array.isArray(parsedMenuData.items)) {
          throw new Error('Invalid menu data format: missing or invalid categories/items arrays');
        }
      } catch (error) {
        serverLog('Failed to parse menu data:', menuData);
        throw new Error(`Invalid menu data format: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
      }

      // Get user's restaurant_id
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('restaurant_id')
        .eq('id', session.user.id)
        .maybeSingle();

      // If no restaurant_id, create one with a default name
      let restaurant_id = profileData?.restaurant_id;
      if (!restaurant_id) {
        const { data: newRestaurant, error: restaurantError } = await supabase
          .from('restaurants')
          .insert({
            name: `${session.user.email}'s Restaurant`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (restaurantError) {
          throw new Error(`Failed to create restaurant: ${restaurantError.message}`);
        }

        restaurant_id = newRestaurant.id;

        // Update profile with new restaurant_id
        await supabase
          .from('profiles')
          .upsert({
            id: session.user.id,
            restaurant_id: restaurant_id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      }

      // Insert categories first
      for (const category of parsedMenuData.categories) {
        const { error: categoryError } = await supabase
          .from('menu_categories')
          .insert({
            restaurant_id,
            name: category.name,
            description: category.description || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (categoryError) {
          serverLog('Error inserting category:', categoryError);
          throw new Error(`Failed to insert category: ${categoryError.message}`);
        }
      }

      // Get inserted categories to map names to IDs
      const { data: categoryData, error: categoryFetchError } = await supabase
        .from('menu_categories')
        .select('id, name')
        .eq('restaurant_id', restaurant_id);

      if (categoryFetchError) {
        throw new Error(`Failed to fetch categories: ${categoryFetchError.message}`);
      }

      const categoryMap = new Map(categoryData.map(cat => [cat.name, cat.id]));

      // Insert menu items with category IDs
      for (const item of parsedMenuData.items) {
        const category_id = categoryMap.get(item.category_name);
        const { error: itemError } = await supabase
          .from('menu_items')
          .insert({
            restaurant_id,
            category_id,
            name: item.name,
            description: item.description || '',
            price: item.price,
            is_available: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (itemError) {
          serverLog('Error inserting menu item:', itemError);
          throw new Error(`Failed to insert menu item: ${itemError.message}`);
        }
      }

      // Update the upload record with menu data
      const { error: updateError } = await supabase
        .from('menu_uploads')
        .update({
          status: 'completed',
          metadata: parsedMenuData
        })
        .eq('id', uploadId);

      if (updateError) {
        serverLog('Menu data update error:', updateError);
        throw new Error(`Failed to update menu data: ${updateError.message}`);
      }

      serverLog('Menu data updated successfully');
      return res.status(200).json({ success: true });

    } catch (error: any) {
      serverLog('Processing error:', error);
      // Update the upload record with error status
      await supabase
        .from('menu_uploads')
        .update({
          status: 'failed',
          error_message: error.message
        })
        .eq('id', uploadId);

      throw error;
    }
  } catch (error: any) {
    serverLog('Error:', error);
    return res.status(500).json({ message: error.message });
  }
}
