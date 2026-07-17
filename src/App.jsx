import { BrowserRouter, Route, Routes } from 'react-router-dom'
import AdminPage from './pages/AdminPage'
import DocumentPromptPage from './pages/DocumentPromptPage'
import HomePage from './pages/HomePage'
import ImagePromptPage from './pages/ImagePromptPage'
import LoginPage from './pages/LoginPage'
import MyPage from './pages/MyPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/prompt/image" element={<ImagePromptPage />} />
        <Route path="/prompt/document" element={<DocumentPromptPage />} />
        <Route path="/mypage" element={<MyPage />} />
        <Route
          path="*"
          element={
            <div className="flex min-h-screen items-center justify-center text-gray-500">
              준비 중인 페이지입니다.
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
