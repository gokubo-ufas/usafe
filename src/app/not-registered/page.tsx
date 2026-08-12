import Link from 'next/link'

export default function NotRegisteredPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-xl shadow-md p-8 w-full max-w-sm text-center space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">U-Safe</h1>
        <div className="space-y-2">
          <p className="font-medium text-red-600">アクセスできません</p>
          <p className="text-sm text-gray-600">
            U-Safeの利用対象社員として登録されていません。
          </p>
          <p className="text-xs text-gray-400">
            ご不明な点は管理者にお問い合わせください。
          </p>
        </div>
        <Link href="/login" className="inline-block text-sm text-blue-600 hover:underline">
          ログインページへ戻る
        </Link>
      </div>
    </div>
  )
}
