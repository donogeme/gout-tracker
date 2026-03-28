import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
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

For each query, respond with JSON:
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

    const content: any[] = [];

    if (image) {
      // Image analysis
      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/jpeg',
          data: image.replace(/^data:image\/\w+;base64,/, ''),
        },
      });
      content.push({
        type: 'text',
        text: text 
          ? `Analyze this meal photo. User description: "${text}". Provide gout-friendliness analysis.`
          : 'Analyze this meal photo for gout-friendliness. Identify the foods and provide detailed analysis.',
      });
    } else {
      // Text-only analysis
      content.push({
        type: 'text',
        text: `Analyze this food/meal for gout-friendliness: "${text}"`,
      });
    }

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' 
      ? message.content[0].text 
      : '';

    // Extract JSON from response
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
