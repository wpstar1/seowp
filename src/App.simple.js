import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './App.css';
import { useAuth } from './contexts/LocalAuthContext';
import Header from './components/Header';

function App() {
  // 인증 관련 변수
  const { currentUser, isAdmin } = useAuth();
  const isLoggedIn = !!currentUser;
  const isVip = currentUser && currentUser.membershipType === 'vip';
  
  // 상태 관리
  const [keyword, setKeyword] = useState('');
  const [link, setLink] = useState('');
  const [links, setLinks] = useState([]); // 링크 목록
  const [currentLinkKeyword, setCurrentLinkKeyword] = useState(''); // 현재 입력 중인 링크 키워드
  const [contentType, setContentType] = useState('블로그');
  const [styleType, setStyleType] = useState('정보형');
  const [headlineStyle, setHeadlineStyle] = useState('클릭 유도');
  const [writingTone, setWritingTone] = useState('말투 튜닝');
  const [result, setResult] = useState('');
  const [headlines, setHeadlines] = useState([]);
  const [seoAnalysis, setSeoAnalysis] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [loadingStep, setLoadingStep] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingTips, setLoadingTips] = useState([]);
  const [images, setImages] = useState([]);
  const [imageLinks, setImageLinks] = useState([]);
  const [activeResultTab, setActiveResultTab] = useState("content"); // 결과 탭 관련 상태 변수
  const apiKey = process.env.REACT_APP_OPENAI_API_KEY; // API 키는 보안을 위해 환경 변수로 관리해야 합니다
  
  // 새로운 기능을 위한 상태 변수
  const [trendingKeywords, setTrendingKeywords] = useState([]);
  const [showTrendingKeywords, setShowTrendingKeywords] = useState(false);
  const [competitorKeywords, setCompetitorKeywords] = useState([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [depositName, setDepositName] = useState('');
  const [vipRequestStatus, setVipRequestStatus] = useState(''); // 'pending', 'approved', 'rejected'
  const [readabilityScore, setReadabilityScore] = useState(null);
  const [showReadabilityDetails, setShowReadabilityDetails] = useState(false);
  const [readabilityDetails, setReadabilityDetails] = useState({
    sentenceCount: 0,
    wordCount: 0,
    characterCount: 0,
    keywordDensity: 0,
    suggestions: []
  });
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [showVipModal, setShowVipModal] = useState(false);
  const [similarKeywords, setSimilarKeywords] = useState([]);
  const [isLoadingKeywords, setIsLoadingKeywords] = useState(false);
  
  // 콘텐츠 생성 함수
  const generateContent = async () => {
    if (!keyword.trim()) {
      alert('키워드를 입력해주세요.');
      return;
    }
    
    setIsLoading(true);
    setLoadingStep(1);
    setLoadingProgress(10);
    setLoadingMessage('키워드 분석 중...');
    setLoadingTips([
      '키워드를 분석하여 SEO에 최적화된 콘텐츠를 생성합니다.',
      'AI가 작성한 콘텐츠는 추가 편집이 필요할 수 있습니다.',
      '키워드 밀도를 적절히 유지하는 것이 중요합니다.'
    ]);
    
    // 콘텐츠 생성 요청할 내용
    try {
      // 여기에 콘텐츠 생성 로직 구현
      setResult("이 콘텐츠는 테스트 버전으로 생성되었습니다. 실제 API 연결 시 키워드에 맞는 최적화된 콘텐츠가 생성됩니다.");
      setHeadlines(["제목 예시 1", "제목 예시 2", "제목 예시 3"]);
      setSeoAnalysis({
        keywordDensity: "2.5%",
        readabilityScore: "좋음",
        suggestions: ["메타 태그에 키워드 포함", "자연스러운 키워드 배치"]
      });
      
      setIsLoading(false);
      setLoadingProgress(100);
    } catch (error) {
      console.error('콘텐츠 생성 오류:', error);
      setErrorMessage('콘텐츠 생성 중 오류가 발생했습니다. 다시 시도해주세요.');
      setIsLoading(false);
    }
  };

  return (
    <div className="app">
      <Header />
      <main className="content">
        {/* VIP 회원 환영 배너 */}
        {isLoggedIn && isVip && (
          <div className="vip-welcome-banner">
            <div className="vip-icon">👑</div>
            <div className="vip-message">
              <h3>VIP 회원님 반갑습니다!</h3>
              <p>모든 기능을 무제한으로 사용하실 수 있습니다.</p>
            </div>
          </div>
        )}
        
        {/* 홍보 섹션 */}
        {!isLoggedIn && (
          <div className="promotion-section">
            <div className="promo-content">
              <h2>스마트 콘텐츠 크리에이터로 컨텐츠 제작을 더 쉽게!</h2>
              <p>AI 기반의 최적화된 콘텐츠를 빠르게 생성하세요. 키워드 분석부터 SEO 최적화까지 한번에!</p>
              <div className="promo-buttons">
                <Link to="/register" className="promo-btn register-btn">무료로 시작하기</Link>
                <button className="promo-btn vip-btn" onClick={() => setShowVipModal(true)}>VIP 혜택 보기</button>
              </div>
            </div>
            <div className="promo-image">
              <img src="/images/ai-content.svg" alt="AI 콘텐츠 생성" />
            </div>
          </div>
        )}
        
        {/* 키워드 입력 섹션 */}
        <div className="keyword-section">
          <h2>키워드 입력</h2>
          <p>분석할 키워드를 입력하세요. 여러 키워드는 쉼표로 구분합니다.</p>
          
          <div className="keyword-input-container">
            <input 
              type="text" 
              className="keyword-input"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="키워드 입력 (예: 다이어트 방법, 건강한 식단)"
            />
            <button 
              className="generate-btn"
              onClick={generateContent}
              disabled={!keyword || isLoading}
            >
              콘텐츠 생성하기
            </button>
          </div>
        </div>
        
        {/* 로딩 인디케이터 */}
        {isLoading && (
          <div className="loading-overlay">
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <h3>{loadingMessage}</h3>
              <div className="loading-progress-bar">
                <div 
                  className="loading-progress-fill"
                  style={{ width: `${loadingProgress}%` }}
                ></div>
              </div>
              <div className="loading-tips">
                <h4>알고 계셨나요?</h4>
                <ul>
                  {loadingTips.map((tip, index) => (
                    <li key={index}>{tip}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
        
        {/* 결과 섹션 */}
        {result && (
          <div className="result-section">
            <div className="result-tabs">
              <button 
                className={activeResultTab === "content" ? "active" : ""} 
                onClick={() => setActiveResultTab("content")}
              >
                생성된 콘텐츠
              </button>
              <button 
                className={activeResultTab === "headlines" ? "active" : ""} 
                onClick={() => setActiveResultTab("headlines")}
              >
                추천 제목
              </button>
              <button 
                className={activeResultTab === "seo" ? "active" : ""} 
                onClick={() => setActiveResultTab("seo")}
              >
                SEO 분석
              </button>
              {isVip && (
                <button 
                  className={activeResultTab === "readability" ? "active" : ""} 
                  onClick={() => setActiveResultTab("readability")}
                >
                  가독성 점수
                </button>
              )}
            </div>
            
            <div className="result-content">
              {activeResultTab === "content" && (
                <div className="content-result">
                  <h3>생성된 콘텐츠</h3>
                  <div className="editor-actions">
                    <button className="editor-btn copy-btn">
                      복사
                    </button>
                    <button className="editor-btn download-btn">
                      다운로드
                    </button>
                  </div>
                  <div className="content-editor">
                    <div dangerouslySetInnerHTML={{ __html: result }}></div>
                  </div>
                </div>
              )}
              
              {activeResultTab === "headlines" && (
                <div className="headlines-result">
                  <h3>추천 제목</h3>
                  <p>클릭을 유도하는 효과적인 제목 옵션:</p>
                  <ul className="headlines-list">
                    {headlines.map((headline, index) => (
                      <li key={index} className="headline-item">
                        <div className="headline-text">{headline}</div>
                        <button className="headline-copy-btn">복사</button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {activeResultTab === "seo" && (
                <div className="seo-result">
                  <h3>SEO 분석</h3>
                  <div className="seo-metrics">
                    <div className="seo-metric">
                      <h4>키워드 밀도</h4>
                      <div className="metric-value">{seoAnalysis.keywordDensity || "계산 중..."}</div>
                    </div>
                    <div className="seo-metric">
                      <h4>가독성 점수</h4>
                      <div className="metric-value">{seoAnalysis.readabilityScore || "계산 중..."}</div>
                    </div>
                  </div>
                  <div className="seo-suggestions">
                    <h4>SEO 개선 제안</h4>
                    <ul>
                      {seoAnalysis.suggestions && seoAnalysis.suggestions.map((suggestion, index) => (
                        <li key={index}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              
              {activeResultTab === "readability" && (
                <div className="readability-content">
                  <h3>가독성 점수</h3>
                  {!isVip ? (
                    <div className="vip-restriction-message">
                      <p>가독성 점수 분석은 VIP 회원 전용 기능입니다.</p>
                      <button className="vip-upgrade-btn" onClick={() => setShowVipModal(true)}>
                        VIP 신청하기
                      </button>
                    </div>
                  ) : (
                    <div className="readability-details">
                      <div className="readability-score-display">
                        <div className="score-circle">
                          <span className="score-number">{readabilityScore || 85}</span>
                        </div>
                        <div className="score-label">우수함</div>
                      </div>
                      <button
                        className="toggle-details-btn"
                        onClick={() => setShowReadabilityDetails(!showReadabilityDetails)}
                      >
                        {showReadabilityDetails ? "상세 정보 닫기" : "상세 정보 보기"}
                      </button>
                      
                      {showReadabilityDetails && (
                        <div className="detailed-metrics">
                          <div className="metric-item">
                            <span className="metric-label">문장 수:</span>
                            <span className="metric-value">{readabilityDetails.sentenceCount || 15}</span>
                          </div>
                          <div className="metric-item">
                            <span className="metric-label">단어 수:</span>
                            <span className="metric-value">{readabilityDetails.wordCount || 250}</span>
                          </div>
                          <div className="metric-item">
                            <span className="metric-label">글자 수:</span>
                            <span className="metric-value">{readabilityDetails.characterCount || 1200}</span>
                          </div>
                          <div className="metric-item">
                            <span className="metric-label">키워드 밀도:</span>
                            <span className="metric-value">{readabilityDetails.keywordDensity || "2.5%"}</span>
                          </div>
                          
                          <div className="readability-suggestions">
                            <h4>개선 제안</h4>
                            <ul>
                              <li>문장을 더 짧게 작성하여 가독성을 높이세요.</li>
                              <li>전문 용어의 사용을 줄이고 쉬운 단어를 선택하세요.</li>
                              <li>단락을 나누어 시각적으로 읽기 쉽게 만드세요.</li>
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      
      {/* VIP 신청 모달 */}
      {showVipModal && (
        <div className="modal-overlay">
          <div className="modal vip-modal">
            <button className="close-btn" onClick={() => setShowVipModal(false)}>×</button>
            <h2>VIP 회원 신청</h2>
            <p>VIP 회원이 되어 모든 프리미엄 기능을 이용하세요!</p>
            
            <div className="vip-benefits">
              <h3>VIP 혜택</h3>
              <ul>
                <li>트렌드 키워드 분석</li>
                <li>경쟁자 콘텐츠 분석</li>
                <li>관련 이미지 추가</li>
                <li>고급 SEO 분석</li>
                <li>콘텐츠 가독성 분석</li>
              </ul>
            </div>
            
            <div className="vip-pricing">
              <h3>VIP 요금제</h3>
              <div className="price">월 9,900원</div>
              <p>첫 달 50% 할인: 4,950원</p>
            </div>
            
            {isLoggedIn ? (
              <form className="vip-request-form">
                <div className="form-group">
                  <label>입금자명</label>
                  <input 
                    type="text" 
                    value={depositName} 
                    onChange={(e) => setDepositName(e.target.value)} 
                    placeholder="입금자명을 입력하세요"
                  />
                </div>
                <div className="payment-info">
                  <p>계좌번호: 1234-567-890123 (신한은행)</p>
                  <p>예금주: 스마트콘텐츠</p>
                  <p>금액: 4,950원 (첫 달 할인가)</p>
                </div>
                <button 
                  className="submit-btn"
                  type="button"
                  onClick={() => {
                    alert('VIP 신청이 완료되었습니다. 관리자 승인 후 이용하실 수 있습니다.');
                    setVipRequestStatus('pending');
                    setShowVipModal(false);
                  }}
                >
                  VIP 신청하기
                </button>
              </form>
            ) : (
              <div className="login-prompt">
                <p>VIP 회원 신청을 위해 로그인해주세요.</p>
                <Link to="/login" className="login-btn" onClick={() => setShowVipModal(false)}>로그인하러 가기</Link>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* 스낵바 */}
      {showSnackbar && (
        <div className="snackbar">
          {snackbarMessage}
        </div>
      )}
    </div>
  );
}

export default App;
