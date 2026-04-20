import { useState, useEffect, useCallback } from "react";

function sessionHeaders(session) {
  return {
    "Content-Type": "application/json",
    "X-Session": JSON.stringify(session),
  };
}

export function useNotes(session) {
  const [notes,   setNotes]   = useState([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const res  = await fetch("/api/notes", { headers: sessionHeaders(session) });
      const data = await res.json();
      if (res.ok) setNotes(data.notes ?? []);
    } catch {
      // network error — keep existing notes
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => { refresh(); }, [refresh]);

  async function addNote(fields) {
    const res  = await fetch("/api/notes", {
      method: "POST",
      headers: sessionHeaders(session),
      body: JSON.stringify(fields),
    });
    const data = await res.json();
    if (res.ok) setNotes((prev) => [data.note, ...prev]);
    return res.ok ? data.note : null;
  }

  async function updateNote(id, fields) {
    const res  = await fetch("/api/notes", {
      method: "PUT",
      headers: sessionHeaders(session),
      body: JSON.stringify({ id, ...fields }),
    });
    const data = await res.json();
    if (res.ok) setNotes((prev) => prev.map((n) => n.id === id ? data.note : n));
    return res.ok;
  }

  async function deleteNote(id) {
    const res = await fetch("/api/notes", {
      method: "DELETE",
      headers: sessionHeaders(session),
      body: JSON.stringify({ id }),
    });
    if (res.ok) setNotes((prev) => prev.filter((n) => n.id !== id));
    return res.ok;
  }

  return { notes, loading, addNote, updateNote, deleteNote, refresh };
}
