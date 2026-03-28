'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://hfzetignhbtvhehwuzfj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmemV0aWduaGJ0dmhlaHd1emZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NTc4MjMsImV4cCI6MjA5MDIzMzgyM30.nIogeM9vXCmw9QJqYQmAexTGOmK5nmf-m8Kv8M5QYXM'
);

// Food database
const FOOD_DB = {
  high_purine_avoid: {
    red_meat: ['beef', 'lamb', 'pork', 'veal', 'venison', 'bison'],
    organ_meat: ['liver', 'kidney', 'heart', 'brain', 'sweetbreads', 'tripe'],
    seafood: ['anchovies', 'sardines', 'herring', 'mackerel', 'scallops', 'mussels', 'tuna', 'trout', 'cod', 'haddock'],
    alcohol: ['beer', 'liquor', 'wine'],
    drinks: ['soda', 'fruit juice', 'energy drinks']
  },
  moderate_purine_caution: {
    poultry: ['chicken', 'turkey', 'duck', 'goose'],
    fish: ['salmon', 'bass', 'halibut', 'sole', 'snapper'],
    vegetables: ['asparagus', 'spinach', 'mushrooms', 'cauliflower'],
    legumes: ['lentils', 'peas', 'beans']
  },
  low_purine_safe: {
    vegetables: ['broccoli', 'carrots', 'celery', 'cucumber', 'lettuce', 'tomatoes', 'peppers', 'cabbage', 'zucchini', 'squash', 'green beans', 'kale'],
    fruits: ['cherries', 'strawberries', 'blueberries', 'apples', 'oranges', 'bananas', 'watermelon', 'grapes'],
    grains: ['rice', 'pasta', 'bread', 'oats', 'quinoa'],
    dairy: ['milk', 'cheese', 'yogurt', 'eggs'],
    nuts_seeds: ['almonds', 'walnuts', 'peanuts', 'cashews']
  },
  beneficial: {
    anti_inflammatory: ['cherries', 'berries', 'ginger', 'turmeric', 'green tea'],
    hydration: ['water', 'coconut water', 'herbal tea'],
    vitamin_c: ['oranges', 'strawberries', 'bell peppers', 'broccoli']
  }
};

function analyzeFood(foodText: string) {
  const food_lower = foodText.toLowerCase();
  const matches: any = { avoid: [], caution: [], safe: [], beneficial: [] };
  
  // Check avoid
  Object.entries(FOOD_DB.high_purine_avoid).forEach(([category, items]) => {
    items.forEach(item => {
      if (food_lower.includes(item)) {
        matches.avoid.push([item, category]);
      }
    });
  });
  
  // Check caution
  Object.entries(FOOD_DB.moderate_purine_caution).forEach(([category, items]) => {
    items.forEach(item => {
      if (food_lower.includes(item)) {
        matches.caution.push([item, category]);
      }
    });
  });
  
  // Check safe
  Object.entries(FOOD_DB.low_purine_safe).forEach(([category, items]) => {
    items.forEach(item => {
      if (food_lower.includes(item)) {
        matches.safe.push([item, category]);
      }
    });
  });
  
  // Check beneficial
  Object.entries(FOOD_DB.beneficial).forEach(([category, items]) => {
    items.forEach(item => {
      if (food_lower.includes(item)) {
        matches.beneficial.push([item, category]);
      }
    });
  });
  
  // Determine rating
  let rating, emoji, advice;
  if (matches.avoid.length > 0) {
    rating = 'avoid';
    emoji = '❌';
    const items = matches.avoid.map((m: any) => m[0]).join(', ');
    advice = `HIGH PURINE - Avoid: ${items}`;
  } else if (matches.caution.length > 0) {
    rating = 'caution';
    emoji = '⚠️';
    const items = matches.caution.map((m: any) => m[0]).join(', ');
    advice = `Moderate purine - Small portions okay: ${items}`;
  } else if (matches.safe.length > 0 || matches.beneficial.length > 0) {
    rating = 'safe';
    emoji = '✅';
    if (matches.beneficial.length > 0) {
      const items = matches.beneficial.map((m: any) => m[0]).join(', ');
      advice = `Safe! Extra benefit: ${items}`;
    } else {
      advice = 'Safe choice for gout management';
    }
  } else {
    rating = 'unknown';
    emoji = '❓';
    advice = 'Unknown food - check with your doctor';
  }
  
  return { rating, emoji, advice, matches };
}

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

export default function GoutTracker() {
  const [checkFood, setCheckFood] = useState('');
  const [checkResult, setCheckResult] = useState<any>(null);
  
  const [logFood, setLogFood] = useState('');
  const [logMealType, setLogMealType] = useState('lunch');
  const [logNotes, setLogNotes] = useState('');
  const [logImage, setLogImage] = useState<File | null>(null);
  const [logging, setLogging] = useState(false);
  
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Load entries
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

  function handleCheckFood() {
    if (!checkFood.trim()) return;
    const result = analyzeFood(checkFood);
    setCheckResult(result);
  }

  async function handleLogFood() {
    if (!logFood.trim()) return;
    
    setLogging(true);
    try {
      const analysis = analyzeFood(logFood);
      
      // Upload image if present
      let imageUrl = null;
      if (logImage) {
        const filename = `food_${Date.now()}.jpg`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('food-images')
          .upload(filename, logImage);
        
        if (!uploadError) {
          imageUrl = supabase.storage.from('food-images').getPublicUrl(filename).data.publicUrl;
        }
      }
      
      // Insert entry
      const entry = {
        timestamp: new Date().toISOString(),
        food: logFood,
        meal_type: logMealType,
        notes: logNotes,
        rating: analysis.rating,
        emoji: analysis.emoji,
        advice: analysis.advice,
        matches: analysis.matches,
        image_url: imageUrl,
        analyzed_at: new Date().toISOString()
      };
      
      const { error } = await supabase.from('food_entries').insert([entry]);
      
      if (error) throw error;
      
      // Clear form and reload
      setLogFood('');
      setLogNotes('');
      setLogImage(null);
      await loadEntries();
      
    } catch (err) {
      console.error('Error logging food:', err);
      alert('Failed to log food. Please try again.');
    } finally {
      setLogging(false);
    }
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '30px' }}>🩺 Gout Food Tracker</h1>

      {/* Check Food Section */}
      <div style={{ marginBottom: '40px', padding: '20px', background: '#f9f9f9', borderRadius: '8px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '15px' }}>🔍 Check a Food</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={checkFood}
            onChange={e => setCheckFood(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleCheckFood()}
            placeholder="salmon, beef, chicken..."
            style={{ flex: 1, padding: '10px', fontSize: '16px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
          <button
            onClick={handleCheckFood}
            style={{ padding: '10px 20px', background: '#333', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' }}
          >
            Check Safety
          </button>
        </div>
        
        {checkResult && (
          <div style={{ marginTop: '15px', padding: '15px', background: '#fff', border: '2px solid #ddd', borderRadius: '8px' }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>{checkResult.emoji}</div>
            <div style={{ fontSize: '18px', fontWeight: '500', marginBottom: '5px' }}>{checkFood}</div>
            <div style={{ color: '#666' }}>{checkResult.advice}</div>
          </div>
        )}
      </div>

      {/* Log Food Section */}
      <div style={{ marginBottom: '40px', padding: '20px', background: '#f0f8ff', borderRadius: '8px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '15px' }}>➕ Log What I Ate</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="text"
            value={logFood}
            onChange={e => setLogFood(e.target.value)}
            placeholder="What did you eat?"
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
            
            <label style={{ padding: '10px', background: '#fff', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
              📷 {logImage ? logImage.name : 'Add Photo'}
              <input
                type="file"
                accept="image/*"
                onChange={e => setLogImage(e.target.files?.[0] || null)}
                style={{ display: 'none' }}
              />
            </label>
          </div>
          
          <input
            type="text"
            value={logNotes}
            onChange={e => setLogNotes(e.target.value)}
            placeholder="Notes (optional)"
            style={{ padding: '10px', fontSize: '16px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
          
          <button
            onClick={handleLogFood}
            disabled={logging || !logFood.trim()}
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
            {logging ? 'Logging...' : 'Log It'}
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                      <span style={{ fontSize: '24px' }}>{entry.emoji}</span>
                      <span style={{ fontSize: '18px', fontWeight: '500' }}>{entry.food}</span>
                    </div>
                    <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
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
                      style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', marginLeft: '15px' }}
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
