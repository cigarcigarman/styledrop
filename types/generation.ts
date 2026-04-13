import type { StylePreset } from './database'

export interface GenerateInput {
  prompt: string
  negative_prompt?: string
  style_preset?: StylePreset
  width?: 768 | 1024
  height?: 768 | 1024
}

export interface ReplicatePrediction {
  id: string
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled'
  output?: string[]
  error?: string
}
