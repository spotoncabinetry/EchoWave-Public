import React, { useState } from 'react';
import { MenuCategory } from '../../../types/menu';

interface CategorySidebarProps {
    categories: MenuCategory[];
    selectedCategory: string;
    setSelectedCategory: (id: string) => void;
    onUpdateCategory: (id: string, updates: Partial<MenuCategory>) => Promise<void>;
    onAddCategory: (name: string) => Promise<void>;
    onDeleteCategory: (id: string) => Promise<void>;
}

export default function CategorySidebar({
    categories,
    selectedCategory,
    setSelectedCategory,
    onUpdateCategory,
    onAddCategory,
    onDeleteCategory
}: CategorySidebarProps) {
    const [editingCategory, setEditingCategory] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleEditStart = (category: MenuCategory) => {
        setEditingCategory(category.id);
        setEditName(category.name);
    };

    const handleEditSave = async (categoryId: string) => {
        if (!editName.trim() || isSubmitting) return;
        
        setIsSubmitting(true);
        try {
            await onUpdateCategory(categoryId, { name: editName.trim() });
            setEditingCategory(null);
        } catch (error) {
            console.error('Error updating category:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddCategory = async () => {
        if (!newCategoryName.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await onAddCategory(newCategoryName.trim());
            setNewCategoryName('');
            setIsAdding(false);
        } catch (error) {
            console.error('Error adding category:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <aside className="w-64 border-r border-gray-200 bg-white">
            <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-medium text-gray-900">Menu Categories</h2>
                    <button
                        onClick={() => setIsAdding(true)}
                        className="p-1 text-gray-500 hover:text-gray-700"
                        title="Add Category"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </button>
                </div>

                {isAdding && (
                    <div className="mb-2 p-2 bg-gray-50 rounded-md">
                        <input
                            type="text"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Category name"
                            disabled={isSubmitting}
                        />
                        <div className="flex justify-end mt-2 space-x-2">
                            <button
                                onClick={() => setIsAdding(false)}
                                className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddCategory}
                                className="px-2 py-1 text-xs text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Adding...' : 'Add'}
                            </button>
                        </div>
                    </div>
                )}

                <nav className="space-y-1">
                    <div
                        className={`px-3 py-2 rounded-md cursor-pointer text-sm ${
                            selectedCategory === 'all' 
                                ? 'bg-blue-50 text-blue-700' 
                                : 'text-gray-700 hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedCategory('all')}
                    >
                        All Categories
                    </div>

                    {categories.map((category) => (
                        <div
                            key={category.id}
                            className={`px-3 py-2 rounded-md ${
                                selectedCategory === category.id 
                                    ? 'bg-blue-50' 
                                    : 'hover:bg-gray-50'
                            }`}
                        >
                            {editingCategory === category.id ? (
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="flex-1 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        disabled={isSubmitting}
                                    />
                                    <button
                                        onClick={() => handleEditSave(category.id)}
                                        className="p-1 text-blue-600 hover:text-blue-800"
                                        disabled={isSubmitting}
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => setEditingCategory(null)}
                                        className="p-1 text-gray-400 hover:text-gray-600"
                                        disabled={isSubmitting}
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between group">
                                    <span
                                        className="flex-1 text-sm cursor-pointer"
                                        onClick={() => setSelectedCategory(category.id)}
                                    >
                                        {category.name}
                                    </span>
                                    <div className="hidden group-hover:flex items-center space-x-1">
                                        <button
                                            onClick={() => handleEditStart(category)}
                                            className="p-1 text-gray-400 hover:text-gray-600"
                                            title="Edit category"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => onDeleteCategory(category.id)}
                                            className="p-1 text-gray-400 hover:text-red-600"
                                            title="Delete category"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </nav>
            </div>
        </aside>
    );
}
