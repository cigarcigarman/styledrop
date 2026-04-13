import Replicate from 'replicate'
import type { StylePreset } from '@/types/database'

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
})

const FASHION_PREFIX = 'fashion photography style, high quality, detailed clothing, professional lighting'

const STYLE_MAP: Record<StylePreset, string> = {
  casual: 'casual everyday fashion, relaxed style',
  formal: 'formal business attire, professional look',
  streetwear: 'urban streetwear, contemporary fashion',
  vintage: 'vintage retro fashion, classic style',
  minimal: 'minimalist fashion, clean lines, neutral colors',
}

export function buildPrompt(prompt: string, stylePreset?: StylePreset | null): string {
  const stylePrefix = stylePreset ? `${STYLE_MAP[stylePreset]}, ` : ''
  return `${FASHION_PREFIX}, ${stylePrefix}${prompt}`
}

export const replicateClient = {
  async generate(params: {
    prompt: string
    stylePreset?: StylePreset | null
    width?: number
    height?: number
  }) {
    const prediction = await replicate.predictions.create({
      model: 'black-forest-labs/flux-schnell',
      input: {
        prompt: buildPrompt(params.prompt, params.stylePreset),
        width: params.width ?? 1024,
        height: params.height ?? 1024,
        num_outputs: 1,
        output_format: 'webp',
        output_quality: 90,
      },
    })

    return prediction
  },
}
