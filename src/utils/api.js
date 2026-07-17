import { getFunctions, httpsCallable } from 'firebase/functions'
import { app } from '../firebase'

const functions = getFunctions(app)

const PASSTHROUGH_ERROR_CODES = [
  'functions/resource-exhausted',
  'functions/invalid-argument',
]

export async function callGeneratePrompt(systemPrompt, userPrompt) {
  const generatePrompt = httpsCallable(functions, 'generatePrompt')

  try {
    const response = await generatePrompt({ systemPrompt, userPrompt })
    return response.data.text
  } catch (err) {
    if (PASSTHROUGH_ERROR_CODES.includes(err.code)) {
      throw new Error(err.message)
    }
    throw new Error('AI 프롬프트 생성 중 오류가 발생했습니다.')
  }
}
