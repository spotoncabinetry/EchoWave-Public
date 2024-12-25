import React, { useState } from 'react';
import { MenuItem } from '../../../types/menu';
import { Database } from '../../../lib/supabase/types/database.types';
import { SupabaseClient } from '@supabase/supabase-js';

type MenuItemNote = Database['public']['Tables']['menu_item_notes']['Row'];

interface NotesModalProps {
    item: MenuItem;
    notes: MenuItemNote[];
    onClose: () => void;
    supabase: SupabaseClient<Database>;
    onNotesChange?: () => Promise<void>;
}

export default function NotesModal({ item, notes, onClose, supabase, onNotesChange }: NotesModalProps) {
    const [newNote, setNewNote] = useState('');
    const [editingNote, setEditingNote] = useState<MenuItemNote | null>(null);
    const [editContent, setEditContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAddNote = async () => {
        if (!newNote.trim() || isSubmitting) return;
        setIsSubmitting(true);

        try {
            const { error } = await supabase.from('menu_item_notes').insert([
                {
                    menu_item_id: item.id,
                    content: newNote.trim(),
                    note_type: 'general'
                }
            ]);

            if (error) throw error;
            setNewNote('');
            if (onNotesChange) await onNotesChange();
        } catch (error) {
            console.error('Error adding note:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteNote = async (noteId: string) => {
        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            const { error } = await supabase
                .from('menu_item_notes')
                .delete()
                .eq('id', noteId);

            if (error) throw error;
            if (onNotesChange) await onNotesChange();
        } catch (error) {
            console.error('Error deleting note:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditNote = async (note: MenuItemNote) => {
        setEditingNote(note);
        setEditContent(note.content);
    };

    const handleSaveEdit = async () => {
        if (!editingNote || !editContent.trim() || isSubmitting) return;
        setIsSubmitting(true);

        try {
            const { error } = await supabase
                .from('menu_item_notes')
                .update({ content: editContent.trim() })
                .eq('id', editingNote.id);

            if (error) throw error;
            setEditingNote(null);
            setEditContent('');
            if (onNotesChange) await onNotesChange();
        } catch (error) {
            console.error('Error updating note:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col">
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Notes for {item.name}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {notes.map((note) => (
                        <div key={note.id} className="bg-gray-50 p-3 rounded-lg">
                            {editingNote?.id === note.id ? (
                                <div className="space-y-2">
                                    <textarea
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        className="w-full p-2 border rounded-lg"
                                        rows={3}
                                    />
                                    <div className="flex justify-end space-x-2">
                                        <button
                                            onClick={() => setEditingNote(null)}
                                            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSaveEdit}
                                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                            disabled={isSubmitting}
                                        >
                                            Save
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <div className="flex justify-between items-start">
                                        <p className="text-gray-800">{note.content}</p>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => handleEditNote(note)}
                                                className="text-gray-500 hover:text-blue-600"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleDeleteNote(note.id)}
                                                className="text-gray-500 hover:text-red-600"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {new Date(note.created_at).toLocaleString()}
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="p-4 border-t">
                    <div className="flex space-x-2">
                        <textarea
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            placeholder="Add a note..."
                            className="flex-1 p-2 border rounded-lg"
                            rows={2}
                        />
                        <button
                            onClick={handleAddNote}
                            disabled={!newNote.trim() || isSubmitting}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            Add Note
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
