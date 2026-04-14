import Replicate from 'replicate'
import Anthropic from '@anthropic-ai/sdk'

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
})

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

function hasKorean(text: string) {
  return /[\uAC00-\uD7A3]/.test(text)
}

async function translateToEnglish(text: string): Promise<string> {
  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 200,
    messages: [{
      role: 'user',
      content: `Translate this image generation prompt to English. Output ONLY the translated prompt, nothing else.\n\n${text}`,
    }],
  })
  const content = msg.content[0]
  return content.type === 'text' ? content.text.trim() : text
}

const FORCED_NEGATIVE = [
  'nsfw', 'nude', 'explicit', 'sexual', 'adult content',
  'violence', 'gore', 'blood', 'realistic person', 'real face',
  'child', 'minor', 'underage',
].join(', ')

interface CreatePredictionParams {
  modelVersion: string
  triggerWord: string
  userPrompt: string
  bannedKeywords: string[]
}

export function checkBannedKeywords(prompt: string, bannedKeywords: string[]): string | null {
  const lower = prompt.toLowerCase()
  for (const kw of bannedKeywords) {
    if (kw && lower.includes(kw.toLowerCase())) {
      return kw
    }
  }
  return null
}

export async function createPrediction({
  modelVersion,
  triggerWord,
  userPrompt,
  bannedKeywords,
}: CreatePredictionParams) {
  const banned = checkBannedKeywords(userPrompt, bannedKeywords)
  if (banned) {
    throw new Error(`BANNED_KEYWORD:${banned}`)
  }

  const finalPrompt = hasKorean(userPrompt)
    ? await translateToEnglish(userPrompt)
    : userPrompt

  return await replicate.predictions.create({
    version: modelVersion,
    input: {
      prompt: `${triggerWord}, ${finalPrompt}`,
      negative_prompt: FORCED_NEGATIVE,
      num_inference_steps: 28,
      guidance_scale: 3.5,
      lora_scale: 0.85,
      width: 1024,
      height: 1024,
      output_format: 'webp',
      output_quality: 85,
    },
  })
}

export async function getPrediction(predictionId: string) {
  return await replicate.predictions.get(predictionId)
}
