import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '../../../contexts/AuthContext';
import { Database, MenuUploadStatus } from '../../../types/supabase';

interface MenuUploadProps {
  onUploadComplete: () => void;
}

export default function MenuUpload({ onUploadComplete }: MenuUploadProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<MenuUploadStatus | null>(null);
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (uploadId && uploadStatus && uploadStatus !== 'completed' && uploadStatus !== 'failed') {
      interval = setInterval(async () => {
        try {
          const { data, error } = await supabase
            .from('menu_uploads')
            .select('status, error_message')
            .eq('id', uploadId)
            .single();

          if (error) {
            console.error('Status check error:', error);
            setError(error.message);
            setUploadStatus('failed');
            clearInterval(interval);
            return;
          }

          if (data) {
            setUploadStatus(data.status as MenuUploadStatus);
            
            if (data.status === 'completed') {
              onUploadComplete();
              clearInterval(interval);
            } else if (data.status === 'failed') {
              setError(data.error_message || 'Failed to process menu');
              clearInterval(interval);
            }
          }
        } catch (error) {
          console.error('Error checking upload status:', error);
          clearInterval(interval);
        }
      }, 2000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [uploadId, uploadStatus, onUploadComplete, supabase]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) {
      setError('Please sign in to upload a menu');
      return;
    }

    setError('');
    setUploadStatus('pending');
    setUploading(true);

    try {
      const file = event.target.files?.[0];
      if (!file) {
        throw new Error('No file selected');
      }

      if (file.type !== 'application/pdf') {
        throw new Error('Please upload a PDF file only');
      }

      // Get restaurant using user_id
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (restaurantError) {
        if (restaurantError.message.includes('no rows')) {
          throw new Error('No restaurant found. Please create a restaurant profile first.');
        }
        throw new Error('Failed to fetch restaurant details. Please try again.');
      }

      // Create menu upload record
      const { data: uploadRecord, error: recordError } = await supabase
        .from('menu_uploads')
        .insert({
          restaurant_id: restaurantData.id,
          file_url: 'pending',
          status: 'pending',
          error_message: null,
          metadata: {
            originalName: file.name,
            size: file.size,
            lastModified: file.lastModified
          }
        })
        .select()
        .single();

      if (recordError) {
        throw new Error(`Failed to create upload record: ${recordError.message}`);
      }

      if (!uploadRecord) {
        throw new Error('Failed to create upload record');
      }

      // Convert PDF to base64
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });

      // Send to API
      const response = await fetch('/api/menu/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pdf: base64Data,
          uploadId: uploadRecord.id,
          debug: {
            fileName: file.name,
            fileSize: file.size,
            userId: user.id
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} - ${errorText}`);
      }

      setUploadId(uploadRecord.id);
      setUploadStatus('processing');

    } catch (error: any) {
      console.error('Error uploading file:', error);
      setError(error.message);
      setUploadStatus('failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-center w-full">
        <label className={`flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
            </svg>
            <p className="mb-2 text-sm text-gray-500">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">PDF menu (MAX. 20MB)</p>
          </div>
          <input 
            type="file" 
            className="hidden" 
            onChange={handleFileUpload}
            accept="application/pdf"
            disabled={uploading}
          />
        </label>
      </div>

      {uploadStatus && uploadStatus !== 'failed' && (
        <div className="mt-4">
          <div className="flex items-center">
            <div className="flex-1">
              <div className="h-2 bg-gray-200 rounded-full">
                <div 
                  className={`h-2 rounded-full ${
                    uploadStatus === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                  style={{ 
                    width: uploadStatus === 'completed' ? '100%' : '60%',
                    transition: 'width 0.5s ease-in-out'
                  }}
                />
              </div>
            </div>
            <div className="ml-4">
              {uploadStatus === 'completed' ? (
                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-blue-500 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            {uploadStatus === 'completed' ? 'Upload complete!' : 'Processing your menu...'}
          </p>
        </div>
      )}
    </div>
  );
}
