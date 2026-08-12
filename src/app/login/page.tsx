import { signInWithGoogle } from '@/app/auth/actions'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">

      {/* ── ヒーロー ── */}
      <div className="flex flex-col items-center justify-center text-center px-6 pt-20 pb-16 space-y-8">

        {/* ロゴ */}
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-md">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
              </svg>
            </div>
            <span className="text-4xl font-bold text-emerald-700 tracking-tight">U-Safe</span>
          </div>
          <p className="text-gray-500 text-base">社員安否確認システム</p>
        </div>

        {/* キャッチフレーズ */}
        <div className="space-y-2 max-w-lg">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight leading-tight">
            いざというとき、<br />全員の安全をひとつの画面に。
          </h1>
        </div>

        {/* コアバリュー */}
        <div className="inline-block bg-emerald-700 text-white text-sm sm:text-base font-semibold px-6 py-3 rounded-full shadow-sm tracking-wide">
          業務よりも、社員とその家族の安全を優先する。
        </div>

        {/* ログインボタン */}
        <div className="w-full max-w-xs space-y-3">
          <form action={signInWithGoogle}>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 rounded-xl px-5 py-3.5 text-sm text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-300 transition-all shadow-md"
            >
              <GoogleIcon />
              Googleでログイン
            </button>
          </form>
          <p className="text-xs text-gray-400">
            UFASメールアドレス（@ufas.co.jp）でログインしてください
          </p>
        </div>
      </div>

      {/* ── 区切り線 ── */}
      <div className="max-w-3xl mx-auto px-6">
        <div className="border-t border-gray-200" />
      </div>

      {/* ── 社員 / 管理者 向けメッセージ ── */}
      <div className="max-w-3xl mx-auto px-6 py-14 grid grid-cols-1 sm:grid-cols-2 gap-10">

        {/* 社員の皆さんへ */}
        <div className="space-y-4">
          <div>
            <p className="text-[10px] font-bold tracking-widest text-emerald-600 uppercase mb-1">For Employees</p>
            <h2 className="text-lg font-bold text-gray-900">社員の皆さんへ</h2>
          </div>
          <ul className="space-y-4">
            {[
              {
                title: '家族の安全を最優先に',
                body: '緊急時は業務より先に、自身とご家族の安全を確認してください。会社は皆さんの安全を何より大切にしています。',
              },
              {
                title: 'できるだけ早く回答を',
                body: '安全が確認できたら、すぐにアプリから安否を報告してください。管理者は皆さんの回答を待っています。',
              },
              {
                title: '正確な情報を入力する',
                body: '本人・家族それぞれの状況と、業務対応の可否を正確に選択してください。適切な初動対応につながります。',
              },
            ].map((item) => (
              <li key={item.title} className="flex gap-3">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-800">{item.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* 区切り線（モバイルのみ） */}
        <div className="sm:hidden border-t border-gray-200 col-span-full" />

        {/* 管理者の方へ */}
        <div className="space-y-4">
          <div>
            <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-1">For Managers</p>
            <h2 className="text-lg font-bold text-gray-900">管理者・リーダーの方へ</h2>
          </div>
          <ul className="space-y-4">
            {[
              {
                title: '未回答者へのフォローを',
                body: '発報後も回答がない社員には、電話や直接確認など個別のフォローをお願いします。アプリで未回答者を即座に確認できます。',
              },
              {
                title: '定期的な避難訓練を実施',
                body: '訓練発報機能を使い、定期的に全社員がアプリ操作に慣れる機会を設けてください。いざというときの回答率が上がります。',
              },
              {
                title: '役割分担を事前に決める',
                body: '緊急時に誰が何を担当するか、部署ごとの連絡体制や集計担当者を平時から取り決めておくと初動が速くなります。',
              },
            ].map((item) => (
              <li key={item.title} className="flex gap-3">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-800">{item.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

      </div>

      {/* ── 区切り線 ── */}
      <div className="max-w-3xl mx-auto px-6">
        <div className="border-t border-gray-200" />
      </div>

      {/* フッター */}
      <div className="text-center pb-10">
        <p className="text-xs text-gray-300">© {new Date().getFullYear()} U-Safe</p>
      </div>

    </div>
  )
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}
