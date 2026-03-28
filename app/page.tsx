'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://hfzetignhbtvhehwuzfj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmemV0aWduaGJ0dmhlaHd1emZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NTc4MjMsImV4cCI6MjA5MDIzMzgyM30.nIogeM9vXCmw9QJqYQmAexTGOmK5nmf-m8Kv8M5QYXM'
);

interface FoodEntry {
  id: string;
  timestamp: string;
  food: string;
  meal_type: string;
  notes: string;
  rating: string;
  emoji: string;
  advice: string;
  image_url?: string;
}

interface AnalysisResult {
  rating: 'avoid' | 'caution' | 'safe';
  emoji: string;
  advice: string;
  components?: Array<{ food: string; purine_level: string; note: string }>;
  overall_assessment?: string;
}

export default function GoutTracker() {
  const [checkFood, setCheckFood] = useState('');
  const [checkImage, setCheckImage] = useState<string | null>(null);
  const [checkResult, setCheckResult] = useState<AnalysisResult | null>(null);
  const [checking, setChecking] = useState(false);
  
  const [logFood, setLogFood] = useState('');
  const [logMealType, setLogMealType] = useState('lunch');
  const [logNotes, setLogNotes] = useState('');
  const [logImage, setLogImage] = useState<File | null>(null);
  const [logImagePreview, setLogImagePreview] = useState<string | null>(null);
  const [logging, setLogging] = useState(false);
  
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEntries();
  }, []);

  async function loadEntries() {
    try {
      const { data, error } = await supabase
        .from('food_entries')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(10);

      if (error) throw error;
      setEntries(data || []);
    } catch (err) {
      console.error('Error loading entries:', err);
    } finally {
      setLoading(false);
    }
  }

  async function analyzeFood(text: string, imageData?: string): Promise<AnalysisResult> {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, image: imageData }),
    });

    if (!response.ok) {
      throw new Error('Analysis failed');
    }

    return response.json();
  }

  async function handleCheckFood() {
    if (!checkFood.trim() && !checkImage) return;
    
    setChecking(true);
    setCheckResult(null);
    
    try {
      const result = await analyzeFood(checkFood, checkImage || undefined);
      setCheckResult(result);
    } catch (err) {
      console.error('Error checking food:', err);
      alert('Failed to analyze food. Please try again.');
    } finally {
      setChecking(false);
    }
  }

  function handleCheckImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setCheckImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function handleLogFood() {
    if (!logFood.trim() && !logImage) return;
    
    setLogging(true);
    try {
      // Convert image to base64 if present
      let imageBase64 = null;
      if (logImage) {
        imageBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(logImage);
        });
      }
      
      // Analyze with AI
      const analysis = await analyzeFood(logFood, imageBase64 || undefined);
      
      // Upload image to Supabase if present
      let imageUrl = null;
      if (logImage) {
        const filename = `food_${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('food-images')
          .upload(filename, logImage);
        
        if (!uploadError) {
          imageUrl = supabase.storage.from('food-images').getPublicUrl(filename).data.publicUrl;
        }
      }
      
      // Insert entry
      const entry = {
        timestamp: new Date().toISOString(),
        food: logFood || 'Photo meal',
        meal_type: logMealType,
        notes: logNotes,
        rating: analysis.rating,
        emoji: analysis.emoji,
        advice: analysis.advice,
        matches: analysis.components || [],
        image_url: imageUrl,
        analyzed_at: new Date().toISOString()
      };
      
      const { error } = await supabase.from('food_entries').insert([entry]);
      
      if (error) throw error;
      
      // Clear form and reload
      setLogFood('');
      setLogNotes('');
      setLogImage(null);
      setLogImagePreview(null);
      await loadEntries();
      
    } catch (err) {
      console.error('Error logging food:', err);
      alert('Failed to log food. Please try again.');
    } finally {
      setLogging(false);
    }
  }

  function handleLogImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '30px' }}>🩺 Gout Food Tracker</h1>

      {/* Check Food Section */}
      <div style={{ marginBottom: '40px', padding: '20px', background: '#f9f9f9', borderRadius: '8px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '15px' }}>🔍 Check a Food (AI-Powered)</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '10px' }}>
          <input
            type="text"
            value={checkFood}
            onChange={e => setCheckFood(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && !checking && handleCheckFood()}
            placeholder="Describe the meal or food..."
            style={{ padding: '10px', fontSize: '16px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <label style={{ 
              flex: 1,
              padding: '10px', 
              background: '#fff', 
              border: '1px solid #ddd', 
              borderRadius: '4px', 
              cursor: 'pointer', 
              textAlign: 'center',
              fontSize: '14px'
            }}>
              📷 {checkImage ? 'Photo added ✓' : 'Or upload photo'}
              <input
                type="file"
                accept="image/*"
                onChange={handleCheckImageUpload}
                style={{ display: 'none' }}
              />
            </label>
            
            <button
              onClick={handleCheckFood}
              disabled={checking || (!checkFood.trim() && !checkImage)}
              style={{ 
                padding: '10px 20px', 
                background: checking ? '#ccc' : '#333', 
                color: '#fff', 
                border: 'none', 
                borderRadius: '4px', 
                cursor: checking ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                minWidth: '140px'
              }}
            >
              {checking ? 'Analyzing...' : 'Check Safety'}
            </button>
          </div>
        </div>
        
        {checkImage && (
          <div style={{ marginBottom: '10px' }}>
            <img src={checkImage} alt="Check preview" style={{ maxWidth: '200px', borderRadius: '8px' }} />
            <button 
              onClick={() => setCheckImage(null)}
              style={{ marginLeft: '10px', padding: '5px 10px', background: '#ddd', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Remove
            </button>
          </div>
        )}
        
        {checkResult && (
          <div style={{ marginTop: '15px', padding: '20px', background: '#fff', border: '2px solid #ddd', borderRadius: '8px' }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>{checkResult.emoji}</div>
            <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px', textTransform: 'uppercase', color: checkResult.rating === 'avoid' ? '#c00' : checkResult.rating === 'caution' ? '#c60' : '#0a0' }}>
              {checkResult.rating}
            </div>
            <div style={{ fontSize: '16px', marginBottom: '15px', lineHeight: '1.5' }}>{checkResult.advice}</div>
            
            {checkResult.components && checkResult.components.length > 0 && (
              <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
                <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Components:</div>
                {checkResult.components.map((comp, i) => (
                  <div key={i} style={{ fontSize: '13px', marginBottom: '5px', paddingLeft: '10px' }}>
                    • <strong>{comp.food}</strong> ({comp.purine_level} purine) - {comp.note}
                  </div>
                ))}
              </div>
            )}
            
            {checkResult.overall_assessment && (
              <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #eee', fontSize: '14px', fontStyle: 'italic', color: '#666' }}>
                {checkResult.overall_assessment}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Log Food Section */}
      <div style={{ marginBottom: '40px', padding: '20px', background: '#f0f8ff', borderRadius: '8px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '15px' }}>➕ Log What I Ate (AI-Powered)</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="text"
            value={logFood}
            onChange={e => setLogFood(e.target.value)}
            placeholder="Describe what you ate (or just upload a photo)"
            style={{ padding: '10px', fontSize: '16px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <select
              value={logMealType}
              onChange={e => setLogMealType(e.target.value)}
              style={{ padding: '10px', fontSize: '16px', border: '1px solid #ddd', borderRadius: '4px' }}
            >
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snack">Snack</option>
            </select>
            
            <label style={{ 
              padding: '10px', 
              background: '#fff', 
              border: '1px solid #ddd', 
              borderRadius: '4px', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '5px',
              fontSize: '14px'
            }}>
              📷 {logImage ? logImage.name : 'Add Photo'}
              <input
                type="file"
                accept="image/*"
                onChange={handleLogImageUpload}
                style={{ display: 'none' }}
              />
            </label>
          </div>
          
          {logImagePreview && (
            <div>
              <img src={logImagePreview} alt="Preview" style={{ maxWidth: '200px', borderRadius: '8px' }} />
              <button 
                onClick={() => { setLogImage(null); setLogImagePreview(null); }}
                style={{ marginLeft: '10px', padding: '5px 10px', background: '#ddd', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                Remove
              </button>
            </div>
          )}
          
          <input
            type="text"
            value={logNotes}
            onChange={e => setLogNotes(e.target.value)}
            placeholder="Notes (optional)"
            style={{ padding: '10px', fontSize: '16px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
          
          <button
            onClick={handleLogFood}
            disabled={logging || (!logFood.trim() && !logImage)}
            style={{ 
              padding: '12px', 
              background: logging ? '#ccc' : '#0066cc', 
              color: '#fff', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: logging ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: '600'
            }}
          >
            {logging ? 'Analyzing & Logging...' : 'Log It'}
          </button>
        </div>
      </div>

      {/* Recent Meals */}
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '15px' }}>📊 Recent Meals</h2>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>Loading...</div>
        ) : entries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999', background: '#f9f9f9', borderRadius: '8px' }}>
            No meals logged yet. Use the form above to start tracking!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {entries.map((entry) => (
              <div key={entry.id} style={{ padding: '15px', background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                      <span style={{ fontSize: '24px' }}>{entry.emoji}</span>
                      <span style={{ fontSize: '18px', fontWeight: '500' }}>{entry.food}</span>
                    </div>
                    <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px', lineHeight: '1.4' }}>
                      {entry.advice}
                    </div>
                    {entry.notes && (
                      <div style={{ fontSize: '13px', color: '#888', fontStyle: 'italic', marginBottom: '5px' }}>
                        Note: {entry.notes}
                      </div>
                    )}
                    <div style={{ fontSize: '12px', color: '#aaa' }}>
                      {entry.meal_type} • {new Date(entry.timestamp).toLocaleString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        hour: 'numeric', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                  {entry.image_url && (
                    <img 
                      src={entry.image_url} 
                      alt={entry.food}
                      style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', marginLeft: '15px' }}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
