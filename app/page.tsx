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
  
  // Check all categories
  Object.entries(FOOD_DB.high_purine_avoid).forEach(([category, items]) => {
    items.forEach(item => {
      if (food_lower.includes(item)) matches.avoid.push([item, category]);
    });
  });
  
  Object.entries(FOOD_DB.moderate_purine_caution).forEach(([category, items]) => {
    items.forEach(item => {
      if (food_lower.includes(item)) matches.caution.push([item, category]);
    });
  });
  
  Object.entries(FOOD_DB.low_purine_safe).forEach(([category, items]) => {
    items.forEach(item => {
      if (food_lower.includes(item)) matches.safe.push([item, category]);
    });
  });
  
  Object.entries(FOOD_DB.beneficial).forEach(([category, items]) => {
    items.forEach(item => {
      if (food_lower.includes(item)) matches.beneficial.push([item, category]);
    });
  });
  
  // Smart overall assessment
  const totalItems = matches.avoid.length + matches.caution.length + matches.safe.length;
  const safeCount = matches.safe.length + matches.beneficial.length;
  
  let rating, emoji, advice, overall;
  
  if (matches.avoid.length > 0) {
    // Has high-purine foods
    if (safeCount > matches.avoid.length * 2) {
      // Mostly safe foods
      rating = 'caution';
      emoji = '⚠️';
      const items = matches.avoid.map((m: any) => m[0]).join(', ');
      advice = `Contains high-purine ${items}, but balanced with plenty of safe foods. Keep portions small.`;
      overall = `This meal has ${safeCount} safe ingredients helping balance ${matches.avoid.length} high-purine item(s). The vegetables and grains are protective.`;
    } else {
      rating = 'avoid';
      emoji = '❌';
      const items = matches.avoid.map((m: any) => m[0]).join(', ');
      advice = `HIGH PURINE - Avoid: ${items}`;
      overall = matches.safe.length > 0 
        ? `Even with ${matches.safe.length} safe food(s), the high-purine content is too risky.`
        : `Pure high-purine meal - not recommended for gout management.`;
    }
  } else if (matches.caution.length > 0) {
    // Moderate purine
    rating = 'caution';
    emoji = '⚠️';
    const items = matches.caution.map((m: any) => m[0]).join(', ');
    advice = safeCount > 0
      ? `Moderate purine (${items}) balanced with safe foods - small portions okay.`
      : `Moderate purine - Small portions okay: ${items}`;
    overall = safeCount > matches.caution.length
      ? `Well-balanced meal with more safe foods than moderate-purine items.`
      : `Mostly moderate-purine foods - watch portion sizes.`;
  } else if (safeCount > 0) {
    // Only safe foods
    rating = 'safe';
    emoji = '✅';
    if (matches.beneficial.length > 0) {
      const items = matches.beneficial.map((m: any) => m[0]).join(', ');
      advice = `Excellent choice! Includes beneficial: ${items}`;
      overall = `This meal is packed with gout-friendly ingredients and anti-inflammatory benefits.`;
    } else {
      advice = `Safe choice for gout management`;
      overall = `All identified ingredients are low-purine and safe.`;
    }
  } else {
    // Unknown
    rating = 'unknown';
    emoji = '❓';
    advice = `No recognized ingredients in database. If unsure, check with your doctor.`;
    overall = `Our database covers ~100 common foods. This item isn't recognized.`;
  }
  
  // Build components list
  const components = [
    ...matches.avoid.map((m: any) => ({ food: m[0], purine_level: 'high', note: m[1] })),
    ...matches.caution.map((m: any) => ({ food: m[0], purine_level: 'moderate', note: m[1] })),
    ...matches.safe.map((m: any) => ({ food: m[0], purine_level: 'low', note: m[1] })),
    ...matches.beneficial.map((m: any) => ({ food: m[0], purine_level: 'beneficial', note: m[1] }))
  ];
  
  return { rating, emoji, advice, matches, overall_assessment: overall, components };
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
      <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '10px' }}>🩺 Gout Food Tracker</h1>
      <p style={{ color: '#666', fontSize: '14px', marginBottom: '30px' }}>Smart meal analysis considers your entire plate, not just individual ingredients</p>

      {/* Check Food Section */}
      <div style={{ marginBottom: '40px', padding: '20px', background: '#f9f9f9', borderRadius: '8px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '15px' }}>🔍 Check a Food</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={checkFood}
            onChange={e => setCheckFood(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleCheckFood()}
            placeholder="e.g., grilled salmon with broccoli and rice"
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
          <div style={{ marginTop: '15px', padding: '20px', background: '#fff', border: '2px solid #ddd', borderRadius: '8px' }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>{checkResult.emoji}</div>
            <div style={{ fontSize: '16px', marginBottom: '15px', lineHeight: '1.5' }}>{checkResult.advice}</div>
            
            {checkResult.components && checkResult.components.length > 0 && (
              <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
                <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Identified Ingredients:</div>
                {checkResult.components.map((comp: any, i: number) => (
                  <div key={i} style={{ fontSize: '13px', marginBottom: '5px', paddingLeft: '10px' }}>
                    • <strong>{comp.food}</strong> ({comp.purine_level} purine) - {comp.note}
                  </div>
                ))}
              </div>
            )}
            
            {checkResult.overall_assessment && (
              <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #eee', fontSize: '14px', fontStyle: 'italic', color: '#666' }}>
                💡 {checkResult.overall_assessment}
              </div>
            )}
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
            placeholder="Describe your complete meal..."
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
              📷 {logImage ? logImage.name.slice(0, 20) : 'Add Photo'}
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
