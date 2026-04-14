import Replicate from 'replicate'

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
})

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

  return await replicate.predictions.create({
    version: modelVersion,
    input: {
      prompt: `${triggerWord}, ${userPrompt}`,
      negative_prompt: FORCED_NEGATIVE,
      num_inference_steps: 28,
      guidance_scale: 3.5,
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
