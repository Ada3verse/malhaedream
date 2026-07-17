const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { initializeApp } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')
const Anthropic = require('@anthropic-ai/sdk')

initializeApp()
const db = getFirestore()

const MODEL = 'claude-sonnet-4-6'
const DAILY_LIMIT = 500
const ALLOWED_ORIGINS = ['https://malhaedream.vercel.app']

exports.generatePrompt = onCall({ cors: ALLOWED_ORIGINS }, async (request) => {
  const { systemPrompt, userPrompt } = request.data ?? {}

  if (
    typeof systemPrompt !== 'string' ||
    typeof userPrompt !== 'string' ||
    !systemPrompt.trim() ||
    !userPrompt.trim()
  ) {
    throw new HttpsError('invalid-argument', 'systemPrompt과 userPrompt가 필요합니다.')
  }

  const today = new Date().toISOString().slice(0, 10)
  const usageRef = db.collection('api_usage').doc(today)

  const limitExceeded = await db.runTransaction(async (tx) => {
    const snap = await tx.get(usageRef)
    const count = snap.exists ? (snap.data().count ?? 0) : 0

    if (count >= DAILY_LIMIT) return true

    tx.set(usageRef, { date: today, count: count + 1 }, { merge: true })
    return false
  })

  if (limitExceeded) {
    throw new HttpsError(
      'resource-exhausted',
      '오늘 사용량을 초과했습니다. 내일 다시 시도해주세요.',
    )
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  try {
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const textBlock = message.content.find((block) => block.type === 'text')
    return { text: textBlock?.text ?? '' }
  } catch (err) {
    console.error('generatePrompt Claude API error:', err)
    throw new HttpsError('internal', 'AI 프롬프트 생성 중 오류가 발생했습니다.')
  }
})
