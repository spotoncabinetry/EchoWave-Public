import { useState } from 'react';
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
  const [progress, setProgress] = useState<number>(0);
  const supabase = createClientComponentClient<Database>();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user?.id) {
      setError('Please sign in to upload a menu');
      return;
    }

    const file = event.target.files?.[0];
    if (!file) {
      setError('No file selected');
      return;
    }

    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file only');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError('File size must be less than 10MB');
      return;
    }

    setError(null);
    setUploading(true);
    setProgress(10); // Started upload

    try {
      // Get user's restaurant_id from profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('restaurant_id')
        .eq('id', user.id)
        .single();

      if (profileError || !profileData?.restaurant_id) {
        throw new Error('Please complete your restaurant profile first');
      }

      console.log('Restaurant ID from profile:', profileData.restaurant_id);

      setProgress(20); // Got restaurant ID

      // Upload file to storage first
      const filePath = `${profileData.restaurant_id}/${Date.now()}-${file.name}`;
      console.log('Uploading to path:', filePath);
      const { error: storageError } = await supabase.storage
        .from('menu-files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (storageError) {
        throw new Error('Failed to upload file: ' + storageError.message);
      }

      setProgress(50); // File uploaded

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('menu-files')
        .getPublicUrl(filePath);

      // Create menu upload record
      console.log('Creating menu upload record with:', {
        restaurant_id: profileData.restaurant_id,
        file_url: publicUrl
      });
      const { data: uploadRecord, error: uploadError } = await supabase
        .from('menu_uploads')
        .insert({
          restaurant_id: profileData.restaurant_id,
          file_url: publicUrl,
          status: 'pending' as MenuUploadStatus,
          metadata: {
            originalName: file.name,
            size: file.size,
            lastModified: file.lastModified
          }
        })
        .select()
        .single();

      if (uploadError) {
        console.error('Upload record error:', uploadError);
      }

      if (uploadError || !uploadRecord) {
        // Clean up the uploaded file if record creation fails
        await supabase.storage
          .from('menu-files')
          .remove([filePath]);
        throw new Error('Failed to create upload record');
      }

      setProgress(70); // Record created

      // Process the menu via API route
      const response = await fetch('/api/menu/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uploadId: uploadRecord.id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process menu');
      }

      setProgress(100); // Processing complete
      onUploadComplete();
    } catch (error: any) {
      console.error('Upload error:', error);
      setError(error.message);
      setProgress(0);
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
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <label className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L4 8m4-4v12"></path>
          </svg>
          Upload PDF
          <input
            type="file"
            className="hidden"
            onChange={handleFileUpload}
            accept="application/pdf"
            disabled={uploading}
          />
        </label>
      </div>

      {uploading && (
        <div className="mt-4">
          <div className="flex items-center">
            <div className="flex-1">
              <div className="h-2 bg-gray-200 rounded-full">
                <div 
                  className="h-2 bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <div className="ml-4">
              <svg className="w-6 h-6 text-blue-500 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            {progress < 50 ? 'Uploading menu...' :
             progress < 70 ? 'Creating record...' :
             'Processing menu...'}
          </p>
        </div>
      )}
    </div>
  );
}
