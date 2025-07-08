"use client";

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          CSS 테스트 페이지
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 기본 카드 */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">기본 카드</h2>
              <p className="card-description">
                Tailwind CSS가 제대로 적용되었는지 확인합니다.
              </p>
            </div>
            <div className="card-content">
              <p className="text-gray-700">
                이 카드가 스타일이 적용되어 보인다면 CSS가 정상적으로 작동하고
                있습니다.
              </p>
            </div>
            <div className="card-footer">
              <button className="btn btn-primary">기본 버튼</button>
            </div>
          </div>

          {/* 버튼 테스트 */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">버튼 테스트</h2>
              <p className="card-description">
                다양한 버튼 스타일을 확인합니다.
              </p>
            </div>
            <div className="card-content">
              <div className="space-y-4">
                <button className="btn btn-primary">Primary Button</button>
                <button className="btn btn-secondary">Secondary Button</button>
                <button className="btn btn-outline">Outline Button</button>
              </div>
            </div>
          </div>

          {/* 색상 테스트 */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">색상 테스트</h2>
              <p className="card-description">
                Primary 색상이 제대로 적용되는지 확인합니다.
              </p>
            </div>
            <div className="card-content">
              <div className="space-y-2">
                <div className="p-4 bg-primary-50 text-primary-900 rounded">
                  Primary 50
                </div>
                <div className="p-4 bg-primary-100 text-primary-900 rounded">
                  Primary 100
                </div>
                <div className="p-4 bg-primary-600 text-white rounded">
                  Primary 600
                </div>
              </div>
            </div>
          </div>

          {/* 레이아웃 테스트 */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">레이아웃 테스트</h2>
              <p className="card-description">
                Flexbox와 Grid가 제대로 작동하는지 확인합니다.
              </p>
            </div>
            <div className="card-content">
              <div className="flex items-center justify-between p-4 bg-gray-100 rounded">
                <span>왼쪽</span>
                <span>오른쪽</span>
              </div>
            </div>
          </div>
        </div>

        {/* 상태 표시 */}
        <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="text-lg font-semibold text-green-800 mb-2">
            CSS 상태 확인
          </h3>
          <ul className="text-green-700 space-y-1">
            <li>✅ Tailwind CSS 로드됨</li>
            <li>✅ 기본 스타일 적용됨</li>
            <li>✅ 반응형 디자인 작동</li>
            <li>✅ 커스텀 색상 적용됨</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
