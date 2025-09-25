export default function RootLoading() {
  return (
    <div className="min-h-screen grid place-items-center bg-slate-50">
      <div className="flex flex-col items-center gap-3 text-slate-600">
        <svg className="animate-spin h-6 w-6 text-slate-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
        <p className="text-sm">Loading...</p>
      </div>
    </div>
  )
}
