import React from 'react';
import { MenuItem } from '../../../types/menu';
import { Database } from '../../../lib/supabase/types/database.types';
import Switch from './Switch';

type MenuItemNote = Database['public']['Tables']['menu_item_notes']['Row'];

interface MenuItemCardProps {
    item: MenuItem;
    onDelete: (id: string) => Promise<void>;
    setEditItem: (item: MenuItem | null) => void;
    handleImageError: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
    uploadingImage: boolean;
    handleImageUpload: (file: File, itemId: string) => Promise<void>;
    handleNotesClick: (item: MenuItem) => void;
    toggleAvailability: (item: MenuItem) => Promise<void>;
    notes?: MenuItemNote[];
}

export default function MenuItemCard({
    item,
    onDelete,
    setEditItem,
    handleImageError,
    uploadingImage,
    handleImageUpload,
    handleNotesClick,
    toggleAvailability,
    notes = []
}: MenuItemCardProps) {
    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            await handleImageUpload(file, item.id);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="relative">
                {item.image_url ? (
                    <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-48 object-cover"
                        onError={handleImageError}
                    />
                ) : (
                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400">No image</span>
                    </div>
                )}
                <input
                    type="file"
                    id={`image-upload-${item.id}`}
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={uploadingImage}
                />
                <label
                    htmlFor={`image-upload-${item.id}`}
                    className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md cursor-pointer hover:bg-gray-100"
                >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </label>
            </div>

            <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold">{item.name}</h3>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => handleNotesClick(item)}
                            className="p-1 text-gray-500 hover:text-blue-600"
                            title="Notes"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            {notes.length > 0 && (
                                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                    {notes.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setEditItem(item)}
                            className="p-1 text-gray-500 hover:text-blue-600"
                            title="Edit"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                        </button>
                        <button
                            onClick={() => onDelete(item.id)}
                            className="p-1 text-gray-500 hover:text-red-600"
                            title="Delete"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </div>

                <p className="text-gray-600 mb-2">{item.description}</p>
                <div className="flex justify-between items-center">
                    <p className="text-lg font-semibold">${item.price}</p>
                    <Switch
                        checked={item.is_available}
                        onChange={() => toggleAvailability(item)}
                        label={item.is_available ? 'In Stock' : 'Out of Stock'}
                    />
                </div>

                {notes.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                        <div className="text-sm text-gray-600">
                            <p className="font-medium mb-1">Latest Note:</p>
                            <p className="italic">{notes[0].content}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
