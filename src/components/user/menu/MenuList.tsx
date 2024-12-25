import React, { useState, useEffect } from 'react';
import { MenuItem } from '../../../types/menu';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../../../lib/supabase/types/database.types';
import MenuItemCard from './MenuItemCard';
import NotesModal from './NotesModal';
import CategorySidebar from './CategorySidebar';
import UploadPDFButton from './UploadPDFButton';
import RefreshButton from './RefreshButton';
import AddMenuItemForm from './AddMenuItemForm';

type MenuItemNote = Database['public']['Tables']['menu_item_notes']['Row'];

interface MenuListProps {
    items: MenuItem[];
    categories: any[];
    supabase: SupabaseClient<Database>;
    onDelete: (id: string) => Promise<void>;
    onUpdate: (id: string, updates: Partial<MenuItem>) => Promise<void>;
    onUpdateCategory: (id: string, updates: Partial<any>) => Promise<void>;
    onDeleteCategory: (id: string) => Promise<void>;
    onAddCategory: (name: string) => Promise<void>;
    onAddItem: (newItem: Partial<MenuItem>) => Promise<void>;
    onRefresh: () => Promise<void>;
    handleImageError: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
    uploadingImage: boolean;
    handleImageUpload: (file: File, itemId: string) => Promise<void>;
}

export default function MenuList({
    items,
    categories,
    supabase,
    onDelete,
    onUpdate,
    onUpdateCategory,
    onDeleteCategory,
    onAddCategory,
    onAddItem,
    onRefresh,
    handleImageError,
    uploadingImage,
    handleImageUpload,
}: MenuListProps) {
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [editItem, setEditItem] = useState<MenuItem | null>(null);
    const [notesItem, setNotesItem] = useState<MenuItem | null>(null);
    const [itemNotes, setItemNotes] = useState<Record<string, MenuItemNote[]>>({});
    const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
    const [showAddItemModal, setShowAddItemModal] = useState(false);

    // Filter and sort items
    const filteredItems = items.filter((item) => {
        const matchesCategory = selectedCategory === 'all' || item.category_id === selectedCategory;
        const matchesSearch = 
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.description?.toLowerCase() || '').includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const sortedItems = [...filteredItems].sort((a, b) => {
        if (a.category_id !== b.category_id) {
            return (a.category_id || '').localeCompare(b.category_id || '');
        }
        return (a.display_order || 0) - (b.display_order || 0);
    });

    const refreshNotes = async (menuItemId?: string) => {
        if (!supabase) {
            console.error('Supabase client is not initialized');
            return;
        }

        try {
            const query = supabase
                .from('menu_item_notes')
                .select('*')
                .order('created_at', { ascending: false });

            if (menuItemId) {
                query.eq('menu_item_id', menuItemId);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error fetching notes:', error);
                return;
            }

            // Group notes by menu item ID
            const groupedNotes = (data || []).reduce((acc, note) => {
                if (!acc[note.menu_item_id]) {
                    acc[note.menu_item_id] = [];
                }
                acc[note.menu_item_id].push(note);
                return acc;
            }, {} as Record<string, MenuItemNote[]>);

            setItemNotes(groupedNotes);
        } catch (error) {
            console.error('Error in refreshNotes:', error);
        }
    };

    useEffect(() => {
        refreshNotes();
    }, []);

    const handleNotesClick = async (item: MenuItem) => {
        if (!supabase) {
            console.error('Supabase client is not initialized');
            return;
        }

        const notes = itemNotes[item.id] || [];
        setNotesItem(item);
        setIsNotesModalOpen(true);
    };

    const handleCloseNotesModal = () => {
        setNotesItem(null);
        setIsNotesModalOpen(false);
    };

    const handlePDFUpload = async (file: File) => {
        try {
            // Implement PDF parsing logic here
            console.log('Processing PDF:', file.name);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing
            return Promise.resolve();
        } catch (error) {
            console.error('Error processing PDF:', error);
            throw error;
        }
    };

    const toggleAvailability = async (item: MenuItem) => {
        await onUpdate(item.id, { is_available: !item.is_available });
    };

    return (
        <div className="flex">
            <CategorySidebar
                categories={categories}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                onUpdateCategory={onUpdateCategory}
                onDeleteCategory={onDeleteCategory}
                onAddCategory={onAddCategory}
            />
            <div className="flex-1 p-6">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center space-x-4">
                        <input
                            type="text"
                            placeholder="Search menu items..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <RefreshButton onRefresh={onRefresh} />
                        <UploadPDFButton onUpload={handlePDFUpload} />
                    </div>
                    <button
                        onClick={() => setShowAddItemModal(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Add Item
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedItems.map((item) => (
                        <MenuItemCard
                            key={item.id}
                            item={item}
                            onDelete={onDelete}
                            setEditItem={setEditItem}
                            handleImageError={handleImageError}
                            uploadingImage={uploadingImage}
                            handleImageUpload={handleImageUpload}
                            handleNotesClick={handleNotesClick}
                            toggleAvailability={toggleAvailability}
                            notes={itemNotes[item.id] || []}
                        />
                    ))}
                </div>
            </div>

            {notesItem && isNotesModalOpen && (
                <NotesModal
                    item={notesItem}
                    notes={itemNotes[notesItem.id] || []}
                    onClose={handleCloseNotesModal}
                    supabase={supabase}
                    onNotesChange={() => refreshNotes(notesItem.id)}
                />
            )}

            {showAddItemModal && (
                <AddMenuItemForm
                    onAddItem={onAddItem}
                    onClose={() => setShowAddItemModal(false)}
                    categories={categories}
                />
            )}

            {editItem && (
                <AddMenuItemForm
                    onAddItem={(updates) => {
                        onUpdate(editItem.id, updates);
                        setEditItem(null);
                    }}
                    onClose={() => setEditItem(null)}
                    categories={categories}
                    initialData={editItem}
                />
            )}
        </div>
    );
}
