import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { MenuItemNote } from '../../../types/menu';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface MenuItemNotesProps {
  menuItemId: string;
  onNoteAdded?: () => void;
}

export default function MenuItemNotes({ menuItemId, onNoteAdded }: MenuItemNotesProps) {
  const [notes, setNotes] = useState<MenuItemNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState<MenuItemNote['note_type']>('general');
  const [expiryDate, setExpiryDate] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotes();
  }, [menuItemId]);

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_item_notes')
        .select('*')
        .eq('menu_item_id', menuItemId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const addNote = async () => {
    if (!newNote.trim()) return;

    try {
      const { error } = await supabase.from('menu_item_notes').insert([
        {
          menu_item_id: menuItemId,
          note_type: noteType,
          content: newNote.trim(),
          expires_at: expiryDate || null,
        },
      ]);

      if (error) throw error;

      setNewNote('');
      setNoteType('general');
      setExpiryDate('');
      fetchNotes();
      onNoteAdded?.();
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('menu_item_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;
      fetchNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const getNoteTypeColor = (type: MenuItemNote['note_type']) => {
    switch (type) {
      case 'out_of_stock':
        return 'bg-red-100 text-red-800';
      case 'special':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="animate-pulse h-20 bg-gray-100 rounded"></div>;
  }

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="flex space-x-4">
          <select
            value={noteType}
            onChange={(e) => setNoteType(e.target.value as MenuItemNote['note_type'])}
            className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="general">General</option>
            <option value="out_of_stock">Out of Stock</option>
            <option value="special">Special</option>
          </select>

          <input
            type="text"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add a note..."
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />

          {noteType !== 'general' && (
            <input
              type="datetime-local"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="block w-48 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          )}

          <button
            onClick={addNote}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Add Note
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {notes.map((note) => (
          <div
            key={note.id}
            className="flex items-center justify-between bg-white p-4 rounded-lg shadow"
          >
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getNoteTypeColor(
                    note.note_type
                  )}`}
                >
                  {note.note_type.replace('_', ' ').toUpperCase()}
                </span>
                {note.expires_at && (
                  <span className="text-xs text-gray-500">
                    Expires: {new Date(note.expires_at).toLocaleString()}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-900">{note.content}</p>
            </div>
            <button
              onClick={() => deleteNote(note.id)}
              className="ml-4 text-gray-400 hover:text-gray-500"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
