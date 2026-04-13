import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'StyleDrop — AI 패션 스타일 생성',
  description: '텍스트로 나만의 패션 스타일을 시각화하세요. AI가 고품질 패션 이미지를 생성합니다.',
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <header className="border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="text-lg font-bold">StyleDrop</span>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900">로그인</Link>
            <Link
              href="/signup"
              className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              무료 시작
            </Link>
          </div>
        </div>
      </header>

      {/* 히어로 */}
      <section className="max-w-3xl mx-auto px-4 pt-20 pb-16 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight">
          AI로 나만의<br />패션 스타일을 시각화하세요
        </h1>
        <p className="mt-6 text-lg text-gray-500 max-w-xl mx-auto">
          텍스트로 스타일을 묘사하면 고품질 패션 이미지를 즉시 생성합니다.
          포토샵 없이, 스타일리스트 없이.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/signup"
            className="w-full sm:w-auto bg-black text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            무료로 시작하기 — 크레딧 5개 제공
          </Link>
          <Link
            href="/pricing"
            className="w-full sm:w-auto border border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            가격 보기
          </Link>
        </div>
      </section>

      {/* 예시 프롬프트 카드 */}
      <section className="max-w-4xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { style: '미니멀', prompt: '흰 린넨 셔츠, 와이드 베이지 팬츠, 갈색 로퍼', color: 'bg-stone-50' },
            { style: '스트릿', prompt: '오버핏 후드, 카고 팬츠, 청키 스니커즈', color: 'bg-zinc-50' },
            { style: '빈티지', prompt: '플로럴 미디 드레스, 버킷햇, 웨지 샌들', color: 'bg-amber-50' },
          ].map(({ style, prompt, color }) => (
            <div key={style} className={`${color} rounded-2xl p-6`}>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{style}</span>
              <p className="mt-3 text-sm text-gray-700 leading-relaxed">&ldquo;{prompt}&rdquo;</p>
              <div className="mt-4 h-40 bg-gray-200 rounded-xl flex items-center justify-center">
                <span className="text-xs text-gray-400">AI 생성 이미지</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 기능 소개 */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">왜 StyleDrop인가요?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { title: '텍스트로 즉시 생성', desc: '머릿속 스타일 아이디어를 텍스트로 입력하면 10초 안에 이미지로 만들어드립니다.' },
              { title: '패션 특화 AI', desc: '일반 AI 이미지 생성과 달리 패션 사진에 최적화된 프롬프트로 더 나은 결과물을 제공합니다.' },
              { title: '합리적인 가격', desc: '이미지 1장당 $0.13~0.20. 스타일리스트 비용의 1/100로 원하는 만큼 시각화하세요.' },
            ].map(({ title, desc }) => (
              <div key={title} className="bg-white rounded-xl p-6 border border-gray-100">
                <h3 className="font-semibold text-gray-900">{title}</h3>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900">지금 바로 시작해보세요</h2>
        <p className="mt-3 text-gray-500">가입 시 크레딧 5개 무료 지급 · 신용카드 불필요</p>
        <Link
          href="/signup"
          className="mt-6 inline-block bg-black text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
        >
          무료로 시작하기
        </Link>
      </section>

      {/* 푸터 */}
      <footer className="border-t border-gray-100 py-8 text-center text-xs text-gray-400">
        <div className="flex items-center justify-center gap-4">
          <Link href="/pricing" className="hover:text-gray-600">가격</Link>
          <Link href="/login" className="hover:text-gray-600">로그인</Link>
          <Link href="/signup" className="hover:text-gray-600">회원가입</Link>
        </div>
        <p className="mt-3">© 2026 StyleDrop</p>
      </footer>
    </div>
  )
}
