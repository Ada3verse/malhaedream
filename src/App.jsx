import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ToastProvider } from './components/Toast'
import AdminPage from './pages/AdminPage'
import DocumentPromptPage from './pages/DocumentPromptPage'
import HomePage from './pages/HomePage'
import IBPromptPage from './pages/IBPromptPage'
import ImagePromptPage from './pages/ImagePromptPage'
import LibraryPage from './pages/LibraryPage'
import LoginPage from './pages/LoginPage'
import MyPage from './pages/MyPage'
import SharedPromptPage from './pages/SharedPromptPage'

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/prompt/image" element={<ImagePromptPage />} />
          <Route path="/prompt/document" element={<DocumentPromptPage />} />
          <Route path="/prompt/ib" element={<IBPromptPage />} />
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/shared/:promptId" element={<SharedPromptPage />} />
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
    </ToastProvider>
  )
}

export default App
