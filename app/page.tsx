'use client';

import { useState, useEffect } from 'react';

interface FoodEntry {
  timestamp: string;
  food: string;
  meal_type: string;
  notes: string;
  analysis: {
    rating: string;
    emoji: string;
    advice: string;
    matches: any;
  };
}

interface DiaryData {
  entries: FoodEntry[];
}

export default function GoutTracker() {
  const [diary, setDiary] = useState<DiaryData>({ entries: [] });
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // Load diary data
    fetch('/api/diary')
      .then(res => res.json())
      .then(data => setDiary(data))
      .catch(() => setDiary({ entries: [] }));
  }, []);

  const filteredEntries = diary.entries.filter(entry => {
    if (filter === 'all') return true;
    return entry.analysis.rating === filter;
  });

  const stats = {
    total: diary.entries.length,
    avoid: diary.entries.filter(e => e.analysis.rating === 'avoid').length,
    caution: diary.entries.filter(e => e.analysis.rating === 'caution').length,
    safe: diary.entries.filter(e => e.analysis.rating === 'safe').length,
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '10px' }}>🩺 Gout Food Tracker</h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>Track your diet and manage gout triggers</p>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '30px' }}>
        <div style={{ padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Total Entries</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{stats.total}</div>
        </div>
        <div style={{ padding: '20px', background: '#fee', borderRadius: '8px' }}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>❌ Avoid</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#c00' }}>{stats.avoid}</div>
        </div>
        <div style={{ padding: '20px', background: '#ffc', borderRadius: '8px' }}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>⚠️ Caution</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#c60' }}>{stats.caution}</div>
        </div>
        <div style={{ padding: '20px', background: '#efe', borderRadius: '8px' }}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>✅ Safe</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#0a0' }}>{stats.safe}</div>
        </div>
      </div>

      {/* Filter */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button onClick={() => setFilter('all')} style={{ padding: '8px 16px', background: filter === 'all' ? '#333' : '#ddd', color: filter === 'all' ? '#fff' : '#000', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>All</button>
        <button onClick={() => setFilter('avoid')} style={{ padding: '8px 16px', background: filter === 'avoid' ? '#c00' : '#ddd', color: filter === 'avoid' ? '#fff' : '#000', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>❌ Avoid</button>
        <button onClick={() => setFilter('caution')} style={{ padding: '8px 16px', background: filter === 'caution' ? '#c60' : '#ddd', color: filter === 'caution' ? '#fff' : '#000', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>⚠️ Caution</button>
        <button onClick={() => setFilter('safe')} style={{ padding: '8px 16px', background: filter === 'safe' ? '#0a0' : '#ddd', color: filter === 'safe' ? '#fff' : '#000', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>✅ Safe</button>
      </div>

      {/* Entries */}
      <div>
        {filteredEntries.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#999', background: '#f9f9f9', borderRadius: '8px' }}>
            <p>No food entries yet</p>
            <p style={{ fontSize: '14px', marginTop: '10px' }}>Send a message to the WhatsApp group to log food</p>
          </div>
        ) : (
          filteredEntries.reverse().map((entry, i) => (
            <div key={i} style={{ marginBottom: '15px', padding: '15px', background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                <div>
                  <span style={{ fontSize: '24px', marginRight: '10px' }}>{entry.analysis.emoji}</span>
                  <span style={{ fontSize: '18px', fontWeight: '500' }}>{entry.food}</span>
                </div>
                <span style={{ fontSize: '12px', color: '#999' }}>
                  {new Date(entry.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                </span>
              </div>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                {entry.analysis.advice}
              </div>
              {entry.notes && (
                <div style={{ fontSize: '13px', color: '#888', fontStyle: 'italic' }}>
                  Note: {entry.notes}
                </div>
              )}
              <div style={{ fontSize: '12px', color: '#aaa', marginTop: '5px' }}>
                Meal: {entry.meal_type}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
