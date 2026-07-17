import { Link, Outlet } from 'react-router-dom'

function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link to="/" className="text-lg font-semibold text-gray-900">
            말해드림
          </Link>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <Link to="/" className="hover:text-gray-900">
              홈
            </Link>
            <Link to="/admin" className="hover:text-gray-900">
              관리자
            </Link>
            <Link to="/login" className="hover:text-gray-900">
              로그인
            </Link>
          </div>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-gray-200 py-4 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} 말해드림
      </footer>
    </div>
  )
}

export default Layout
