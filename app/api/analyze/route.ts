import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Using OpenRouter with OpenAI SDK
const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY || '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',
  defaultHeaders: {
    'HTTP-Referer': 'https://gout-tracker.vercel.app',
    'X-Title': 'Gout Food Tracker',
  }
});

const SYSTEM_PROMPT = `You are a gout diet analyzer. Analyze foods and meals for their gout-friendliness based on purine content.

**Gout Diet Guidelines:**

HIGH PURINE (AVOID):
- Red meat: beef, lamb, pork, veal, venison
- Organ meats: liver, kidney, heart, brain
- Certain seafood: anchovies, sardines, herring, mackerel, scallops, mussels, tuna, trout
- Alcohol (especially beer)
- Sugary drinks: soda, fruit juice, energy drinks

MODERATE PURINE (CAUTION - small portions okay):
- Poultry: chicken, turkey, duck
- Some fish: salmon, bass, halibut
- Vegetables: asparagus, spinach, mushrooms, cauliflower
- Legumes: lentils, peas, dried beans

LOW PURINE (SAFE):
- Most vegetables: broccoli, carrots, lettuce, tomatoes, peppers, cabbage
- Fruits (especially cherries - anti-inflammatory!)
- Grains: rice, pasta, bread, oats
- Dairy: milk, cheese, yogurt, eggs
- Nuts and seeds
- Water, coffee, tea

**Your Analysis Format:**

Respond with ONLY valid JSON (no markdown, no code blocks):
{
  "rating": "avoid" | "caution" | "safe",
  "emoji": "❌" | "⚠️" | "✅",
  "advice": "Detailed, practical advice about this meal/food",
  "components": [
    {"food": "item name", "purine_level": "high|moderate|low", "note": "brief comment"}
  ],
  "overall_assessment": "Consider the whole meal - balance, portions, combinations"
}

**Important:**
- Evaluate the ENTIRE MEAL holistically, not just the worst ingredient
- Consider portion sizes and balance
- Be practical and encouraging where appropriate
- For mixed meals, explain how components interact
- Mention beneficial foods that help offset higher-purine items`;

export async function POST(request: Request) {
  try {
    const { text, image } = await request.json();

    if (!text && !image) {
      return NextResponse.json(
        { error: 'Either text or image required' },
        { status: 400 }
      );
    }

    const messages: any[] = [];

    if (image) {
      // Image analysis
      const userContent: any[] = [];
      
      userContent.push({
        type: 'image_url',
        image_url: {
          url: image
        }
      });
      
      userContent.push({
        type: 'text',
        text: text 
          ? `Analyze this meal photo. User description: "${text}". Provide gout-friendliness analysis in JSON format.`
          : 'Analyze this meal photo for gout-friendliness. Identify the foods and provide detailed analysis in JSON format.',
      });
      
      messages.push({
        role: 'user',
        content: userContent
      });
    } else {
      // Text-only analysis
      messages.push({
        role: 'user',
        content: `Analyze this food/meal for gout-friendliness: "${text}". Respond in JSON format only.`
      });
    }

    const completion = await openai.chat.completions.create({
      model: 'google/gemini-2.0-flash-exp:free',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const responseText = completion.choices[0]?.message?.content || '';

    // Extract JSON from response (strip any markdown)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }

    const analysis = JSON.parse(jsonMatch[0]);

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to analyze food',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
