import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PrivacyPolicyModal from '../components/PrivacyPolicyModal'
import { db } from '../firebase'
import { getOrCreateDeviceId, setStoredUser } from '../utils/auth'
import { hashPin } from '../utils/hash'

const MAX_LOGIN_FAILS = 5
const NICKNAME_PATTERN = /[^가-힣a-zA-Z0-9]/g

export default function LoginPage() {
  const [nickname, setNickname] = useState('')
  const [pin, setPin] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [showPolicy, setShowPolicy] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isComposing, setIsComposing] = useState(false)
  const navigate = useNavigate()

  const handlePinChange = (e) => {
    setPin(e.target.value.replace(/\D/g, '').slice(0, 4))
  }

  const handleNicknameChange = (e) => {
    if (isComposing) {
      setNickname(e.target.value)
      return
    }
    setNickname(e.target.value.replace(NICKNAME_PATTERN, '').slice(0, 10))
  }

  const handleCompositionStart = () => setIsComposing(true)

  const handleCompositionEnd = (e) => {
    setIsComposing(false)
    setNickname(e.target.value.replace(NICKNAME_PATTERN, '').slice(0, 10))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const trimmedNickname = nickname.trim()

    try {
      const usersRef = collection(db, 'users')
      const snapshot = await getDocs(
        query(usersRef, where('nickname', '==', trimmedNickname)),
      )
      const hashedPin = await hashPin(pin)

      if (snapshot.empty) {
        await addDoc(usersRef, {
          nickname: trimmedNickname,
          pin: hashedPin,
          role: 'teacher',
          loginFailCount: 0,
        })
        setStoredUser({
          nickname: trimmedNickname,
          role: 'teacher',
          deviceId: getOrCreateDeviceId(),
        })
        navigate('/home')
        return
      }

      const userDoc = snapshot.docs[0]
      const user = userDoc.data()
      const failCount = user.loginFailCount ?? 0

      if (failCount > MAX_LOGIN_FAILS) {
        setError('로그인 시도 횟수를 초과했습니다. 관리자에게 문의해주세요.')
        return
      }

      if (user.pin !== hashedPin) {
        const nextFailCount = failCount + 1
        await updateDoc(doc(db, 'users', userDoc.id), {
          loginFailCount: nextFailCount,
        })
        setError(
          nextFailCount > MAX_LOGIN_FAILS
            ? '로그인 시도 횟수를 초과했습니다. 관리자에게 문의해주세요.'
            : `PIN이 올바르지 않습니다. (${nextFailCount}/${MAX_LOGIN_FAILS}회 실패)`,
        )
        return
      }

      if (failCount > 0) {
        await updateDoc(doc(db, 'users', userDoc.id), { loginFailCount: 0 })
      }

      setStoredUser({
        nickname: user.nickname,
        role: user.role,
        deviceId: getOrCreateDeviceId(),
      })
      navigate(user.role === 'admin' ? '/admin' : '/home')
    } catch {
      setError('로그인 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        .login-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px 16px;
          background: #EDF7F5;
          font-family: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, sans-serif;
          position: relative;
        }
        .login-root::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image: radial-gradient(circle, rgba(45,201,168,0.07) 1px, transparent 1px);
          background-size: 32px 32px;
          pointer-events: none;
          z-index: 0;
        }
        @media (prefers-color-scheme: dark) {
          .login-root { background: #0D201D; }
        }
        [data-theme="dark"] .login-root { background: #0D201D; }
        [data-theme="light"] .login-root { background: #EDF7F5; }

        .login-card {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: 1fr 1fr;
          width: 100%;
          max-width: 900px;
          min-height: 560px;
          background: #fff;
          border-radius: 24px;
          box-shadow: 0 8px 48px rgba(27,168,138,0.13), 0 2px 8px rgba(0,0,0,0.06);
          overflow: hidden;
          border: 1px solid #D0EDE8;
        }
        @media (prefers-color-scheme: dark) {
          .login-card { background: #132621; border-color: #1C3D37; box-shadow: 0 8px 48px rgba(0,0,0,0.4); }
        }
        [data-theme="dark"] .login-card { background: #132621; border-color: #1C3D37; box-shadow: 0 8px 48px rgba(0,0,0,0.4); }
        [data-theme="light"] .login-card { background: #fff; border-color: #D0EDE8; }

        /* ── Left panel ── */
        .login-left {
          background: linear-gradient(145deg, #1BA88A 0%, #2DC9A8 60%, #4DD6BA 100%);
          padding: 48px 40px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          color: #fff;
          position: relative;
          overflow: hidden;
        }
        .login-left::before {
          content: '';
          position: absolute;
          width: 260px; height: 260px;
          bottom: -80px; right: -80px;
          border-radius: 50%;
          background: rgba(255,255,255,0.08);
          pointer-events: none;
        }
        .login-left::after {
          content: '';
          position: absolute;
          width: 140px; height: 140px;
          top: -40px; left: -40px;
          border-radius: 50%;
          background: rgba(255,255,255,0.08);
          pointer-events: none;
        }

        .ll-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          position: relative;
          z-index: 1;
        }
        .ll-logo-icon {
          width: 40px; height: 40px;
          background: rgba(255,255,255,0.22);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          backdrop-filter: blur(4px);
          font-size: 20px;
        }
        .ll-logo-name {
          font-size: 20px;
          font-weight: 700;
          letter-spacing: -0.3px;
        }

        .ll-body {
          position: relative;
          z-index: 1;
        }
        .ll-body h1 {
          font-size: 28px;
          font-weight: 700;
          line-height: 1.35;
          letter-spacing: -0.5px;
          margin-bottom: 12px;
          text-wrap: balance;
        }
        .ll-body p {
          font-size: 13.5px;
          line-height: 1.7;
          opacity: 0.85;
          margin-bottom: 28px;
        }

        .ll-features {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .ll-feature {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 13px;
          line-height: 1.55;
        }
        .ll-dot {
          width: 22px; height: 22px;
          background: rgba(255,255,255,0.22);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          margin-top: 1px;
          font-size: 11px;
        }

        .ll-footer {
          font-size: 12px;
          opacity: 0.6;
          position: relative;
          z-index: 1;
        }

        /* ── Right panel ── */
        .login-right {
          padding: 48px 44px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .lr-title {
          font-size: 22px;
          font-weight: 700;
          letter-spacing: -0.3px;
          margin-bottom: 4px;
          color: #1A2E2B;
        }
        @media (prefers-color-scheme: dark) { .lr-title { color: #E4F4F0; } }
        [data-theme="dark"] .lr-title { color: #E4F4F0; }
        [data-theme="light"] .lr-title { color: #1A2E2B; }

        .lr-sub {
          font-size: 13px;
          color: #5A7A75;
          margin-bottom: 28px;
        }
        @media (prefers-color-scheme: dark) { .lr-sub { color: #7AB5AE; } }
        [data-theme="dark"] .lr-sub { color: #7AB5AE; }
        [data-theme="light"] .lr-sub { color: #5A7A75; }

        .lr-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 14px;
        }
        .lr-field label {
          font-size: 12.5px;
          font-weight: 500;
          color: #5A7A75;
        }
        @media (prefers-color-scheme: dark) { .lr-field label { color: #7AB5AE; } }
        [data-theme="dark"] .lr-field label { color: #7AB5AE; }
        [data-theme="light"] .lr-field label { color: #5A7A75; }

        .lr-input {
          background: #E8F8F5;
          border: 1.5px solid transparent;
          border-radius: 12px;
          padding: 12px 15px;
          font-size: 14.5px;
          font-family: inherit;
          color: #1A2E2B;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          width: 100%;
        }
        .lr-input::placeholder { color: #9DBAB5; }
        .lr-input:focus {
          border-color: #2DC9A8;
          box-shadow: 0 0 0 3px rgba(45,201,168,0.15);
        }
        @media (prefers-color-scheme: dark) {
          .lr-input { background: #172E2A; color: #E4F4F0; border-color: transparent; }
          .lr-input::placeholder { color: #4A7A73; }
          .lr-input:focus { border-color: #2DC9A8; }
        }
        [data-theme="dark"] .lr-input { background: #172E2A; color: #E4F4F0; }
        [data-theme="dark"] .lr-input::placeholder { color: #4A7A73; }
        [data-theme="light"] .lr-input { background: #E8F8F5; color: #1A2E2B; }

        .lr-hint {
          font-size: 11.5px;
          color: #9DBAB5;
          margin-bottom: 16px;
          line-height: 1.5;
        }

        .lr-checkbox {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 20px;
          font-size: 12.5px;
          color: #5A7A75;
        }
        @media (prefers-color-scheme: dark) { .lr-checkbox { color: #7AB5AE; } }
        [data-theme="dark"] .lr-checkbox { color: #7AB5AE; }
        .lr-checkbox input[type="checkbox"] {
          width: 16px; height: 16px;
          accent-color: #2DC9A8;
          cursor: pointer;
          flex-shrink: 0;
        }
        .lr-policy-btn {
          color: #2DC9A8;
          background: none;
          border: none;
          cursor: pointer;
          font-size: inherit;
          font-family: inherit;
          text-decoration: underline;
          text-underline-offset: 2px;
          padding: 0;
        }
        .lr-policy-btn:hover { color: #1BA88A; }

        .lr-error {
          font-size: 12.5px;
          color: #e53e3e;
          background: #fff5f5;
          border-radius: 8px;
          padding: 10px 13px;
          margin-bottom: 12px;
          line-height: 1.5;
        }
        @media (prefers-color-scheme: dark) {
          .lr-error { background: rgba(229,62,62,0.1); color: #fc8181; }
        }
        [data-theme="dark"] .lr-error { background: rgba(229,62,62,0.1); color: #fc8181; }

        .lr-btn {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #2DC9A8, #1BA88A);
          color: #fff;
          font-size: 15px;
          font-weight: 600;
          font-family: inherit;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          box-shadow: 0 4px 16px rgba(45,201,168,0.3);
          transition: opacity 0.15s, transform 0.1s;
        }
        .lr-btn:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); }
        .lr-btn:active:not(:disabled) { transform: translateY(0); }
        .lr-btn:disabled { opacity: 0.55; cursor: not-allowed; }

        /* Mobile */
        @media (max-width: 640px) {
          .login-card { grid-template-columns: 1fr; }
          .login-left { padding: 36px 28px; }
          .login-left h1 { font-size: 22px; }
          .login-right { padding: 36px 28px; }
          .ll-features { display: none; }
        }
      `}</style>

      <div className="login-root">
        <div className="login-card">
          {/* ── 왼쪽 소개 패널 ── */}
          <div className="login-left">
            <div className="ll-logo">
              <div className="ll-logo-icon">💬</div>
              <span className="ll-logo-name">말해드림</span>
            </div>

            <div className="ll-body">
              <h1>AI에게 대신<br />말해드립니다</h1>
              <p>
                복잡한 프롬프트 없이도 좋은 결과물을.<br />
                선생님의 업무를 AI가 돕는 가장 쉬운 방법이에요.
              </p>
              <div className="ll-features">
                <div className="ll-feature">
                  <div className="ll-dot">✦</div>
                  <span>이미지 생성, 문서 작성, IB 유닛 플랜까지 — 교사 맞춤 프롬프트</span>
                </div>
                <div className="ll-feature">
                  <div className="ll-dot">✦</div>
                  <span>ChatGPT · Claude · Gemini 어디서든 바로 붙여넣기</span>
                </div>
                <div className="ll-feature">
                  <div className="ll-dot">✦</div>
                  <span>마음에 드는 프롬프트는 내 보관함에 저장</span>
                </div>
              </div>
            </div>

            <div className="ll-footer">동신중학교 교사 전용 서비스</div>
          </div>

          {/* ── 오른쪽 로그인 폼 ── */}
          <div className="login-right">
            <div className="lr-title">로그인</div>
            <div className="lr-sub">닉네임과 PIN을 입력해 시작하세요</div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="lr-field">
                <label htmlFor="nickname">닉네임</label>
                <input
                  id="nickname"
                  type="text"
                  value={nickname}
                  onChange={handleNicknameChange}
                  onCompositionStart={handleCompositionStart}
                  onCompositionEnd={handleCompositionEnd}
                  placeholder="한글/영문/숫자, 최대 10자"
                  autoComplete="username"
                  required
                  className="lr-input"
                />
              </div>

              <div className="lr-field">
                <label htmlFor="pin">PIN</label>
                <input
                  id="pin"
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={pin}
                  onChange={handlePinChange}
                  placeholder="숫자 4자리"
                  autoComplete="off"
                  required
                  className="lr-input"
                />
              </div>

              <p className="lr-hint">처음 사용하시나요? 닉네임과 PIN을 입력하면 자동으로 가입됩니다.</p>

              <label className="lr-checkbox">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                />
                <span>
                  개인정보처리방침에 동의합니다{' '}
                  <button
                    type="button"
                    className="lr-policy-btn"
                    onClick={() => setShowPolicy(true)}
                  >
                    [내용 보기]
                  </button>
                </span>
              </label>

              {error && <p className="lr-error">{error}</p>}

              <button
                type="submit"
                disabled={loading || !agreed || pin.length !== 4}
                className="lr-btn"
              >
                {loading ? '로그인 중...' : '로그인'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {showPolicy && (
        <PrivacyPolicyModal onClose={() => setShowPolicy(false)} />
      )}
    </>
  )
}
