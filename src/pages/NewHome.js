import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../App.css';
import { useAuth } from '../contexts/LocalAuthContext';
import Header from '../components/Header';
import DatabaseInitializer from '../components/DatabaseInitializer';

function NewHome() {
  // 인증 관련 변수
  const { currentUser, isAdmin } = useAuth();
  const isLoggedIn = !!currentUser;
  const isVip = currentUser && (currentUser.membershipType === 'vip' || currentUser.vipStatus === 'approved');
  
  // 상태 관리
  const [keyword, setKeyword] = useState('');
  const [link, setLink] = useState('');
  const [links, setLinks] = useState([]);
  const [contentType, setContentType] = useState('블로그');
  const [styleType, setStyleType] = useState('정보형');
  const [result, setResult] = useState('');
  const [headlines, setHeadlines] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showVipModal, setShowVipModal] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showGeneratedContent, setShowGeneratedContent] = useState(false);
  
  // 샘플 이미지 갤러리
  const sampleImages = [
    'https://images.unsplash.com/photo-1661956601349-f61c959a8fd4',
    'https://images.unsplash.com/photo-1597589827317-4c6d6e0a90bd',
    'https://images.unsplash.com/photo-1598128558393-70ff21433be0',
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c',
    'https://images.unsplash.com/photo-1517694712202-14dd9538aa97',
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085'
  ];
  
  // 링크 추가 함수
  const addLink = () => {
    if (link.trim()) {
      setLinks([...links, link.trim()]);
      setLink('');
    }
  };
  
  // 링크 삭제 함수
  const removeLink = (indexToRemove) => {
    setLinks(links.filter((_, index) => index !== indexToRemove));
  };
  
  // 콘텐츠 생성 함수
  const generateContent = async () => {
    if (!keyword.trim()) {
      alert('키워드를 입력해주세요.');
      return;
    }
    
    setIsLoading(true);
    setShowGeneratedContent(false);
    
    try {
      // 목업 데이터 생성
      setTimeout(() => {
        const mockHeadlines = [
          `${keyword}의 모든 것: 완벽 가이드`,
          `${keyword} 활용 방법 10가지`,
          `${keyword}로 당신의 비즈니스를 성장시키는 방법`,
          `초보자도 쉽게 배우는 ${keyword}`,
          `${keyword} 최신 트렌드 분석`
        ];
        
        const mockContent = `
# ${keyword}에 대한 완벽 가이드

## 서론
${keyword}는 현대 비즈니스와 일상생활에서 중요한 부분을 차지하고 있습니다. 이 글에서는 ${keyword}의 기본 개념부터 고급 활용법까지 상세히 알아보겠습니다.

## ${keyword}의 주요 특징
1. 효율성: ${keyword}를 활용하면 업무 효율성이 30% 이상 향상됩니다.
2. 접근성: 누구나 쉽게 배우고 활용할 수 있습니다.
3. 유연성: 다양한 환경과 상황에 맞게 조정이 가능합니다.

## ${keyword} 활용 방법
${keyword}를 효과적으로 활용하기 위한 방법을 알아보겠습니다. 먼저, 목표를 명확히 설정하는 것이 중요합니다. 그 다음, 적절한 도구와 리소스를 준비하세요.

${selectedImage ? '![관련 이미지]('+selectedImage+')' : ''}

## 전문가들의 조언
업계 전문가들은 ${keyword}를 처음 시작할 때 기본기를 탄탄히 다질 것을 권장합니다. 또한, 지속적인 학습과 업데이트된 정보를 따라가는 것이 중요합니다.

## 결론
${keyword}는 앞으로도 계속해서 발전하고 중요성이 커질 것입니다. 지금 시작하여 ${keyword}의 장점을 최대한 활용해보세요.

${links.length > 0 ? '## 참고 링크\n' + links.map(link => `- [참고자료](${link})`).join('\n') : ''}
        `;
        
        setHeadlines(mockHeadlines);
        setResult(mockContent);
        setIsLoading(false);
        setShowGeneratedContent(true);
      }, 2000);
      
    } catch (error) {
      console.error('콘텐츠 생성 중 오류 발생:', error);
      alert('콘텐츠 생성 중 오류가 발생했습니다.');
      setIsLoading(false);
    }
  };
  
  // 이미지 선택 함수
  const selectImage = (imageUrl) => {
    setSelectedImage(imageUrl);
    setShowGallery(false);
  };
  
  return (
    <div className="app">
      <Header />
      <DatabaseInitializer />
      
      <main className="main-content">
        {/* 메인 배너 */}
        <section className="hero-section">
          <div className="hero-container">
            <h1>강력한 AI 콘텐츠 생성기</h1>
            <p>키워드만 입력하면 SEO 최적화된 고품질 콘텐츠를 자동으로 생성해 드립니다.</p>
            <div className="hero-badges">
              <span className="badge">자연스러운 AI 글쓰기</span>
              <span className="badge">SEO 최적화</span>
              <span className="badge">트렌드 키워드</span>
              <span className="badge">이미지 통합</span>
            </div>
          </div>
        </section>
        
        {/* 콘텐츠 생성 섹션 */}
        <section className="content-generator">
          <div className="tools-container">
            <div className="input-group">
              <label htmlFor="keyword">키워드</label>
              <input
                id="keyword"
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="생성할 콘텐츠의 키워드를 입력하세요"
                className="primary-input"
              />
            </div>
            
            <div className="options-row">
              <div className="select-group">
                <label htmlFor="contentType">콘텐츠 타입</label>
                <select
                  id="contentType"
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value)}
                  className="select-input"
                >
                  <option value="블로그">블로그</option>
                  <option value="SNS">SNS</option>
                  <option value="기사">기사</option>
                  <option value="제품설명">제품설명</option>
                </select>
              </div>
              
              <div className="select-group">
                <label htmlFor="styleType">스타일</label>
                <select
                  id="styleType"
                  value={styleType}
                  onChange={(e) => setStyleType(e.target.value)}
                  className="select-input"
                >
                  <option value="정보형">정보형</option>
                  <option value="설득형">설득형</option>
                  <option value="스토리텔링">스토리텔링</option>
                  <option value="재미있는">재미있는</option>
                </select>
              </div>
            </div>
            
            <div className="link-group">
              <label>참고 링크</label>
              <div className="link-input-row">
                <input
                  type="text"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://example.com"
                  className="link-input"
                />
                <button onClick={addLink} className="add-button">추가</button>
              </div>
              
              {links.length > 0 && (
                <div className="links-list">
                  {links.map((link, index) => (
                    <div key={index} className="link-item">
                      <span className="link-text">{link}</span>
                      <button onClick={() => removeLink(index)} className="remove-button">
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="image-group">
              <label>이미지 추가</label>
              <div className="image-buttons">
                <button 
                  onClick={() => setShowGallery(!showGallery)} 
                  className="image-button"
                >
                  {selectedImage ? '이미지 변경' : '이미지 선택'}
                </button>
                {selectedImage && (
                  <button 
                    onClick={() => setSelectedImage(null)} 
                    className="remove-image-button"
                  >
                    이미지 제거
                  </button>
                )}
              </div>
              
              {selectedImage && (
                <div className="selected-image-container">
                  <img src={selectedImage} alt="선택된 이미지" className="selected-image" />
                </div>
              )}
              
              {showGallery && (
                <div className="image-gallery">
                  {sampleImages.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`샘플 이미지 ${index + 1}`}
                      className="gallery-image"
                      onClick={() => selectImage(image)}
                    />
                  ))}
                </div>
              )}
            </div>
            
            <button
              onClick={generateContent}
              disabled={isLoading}
              className="generate-button"
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  콘텐츠 생성 중...
                </>
              ) : (
                '콘텐츠 생성하기'
              )}
            </button>
          </div>
          
          {/* VIP 기능 섹션 */}
          {!isVip && (
            <div className="vip-section">
              <div className="vip-card">
                <h3>VIP 기능으로 업그레이드</h3>
                <ul className="vip-features">
                  <li>무제한 콘텐츠 생성</li>
                  <li>트렌드 키워드 분석</li>
                  <li>경쟁사 콘텐츠 분석</li>
                  <li>AI 글 퀄리티 향상</li>
                </ul>
                <button 
                  onClick={() => setShowVipModal(true)} 
                  className="vip-button"
                >
                  VIP 신청하기
                </button>
              </div>
            </div>
          )}
        </section>
        
        {/* 생성된 콘텐츠 표시 섹션 */}
        {showGeneratedContent && (
          <section className="generated-content">
            <div className="content-container">
              <h2>생성된 콘텐츠</h2>
              
              <div className="headlines-section">
                <h3>추천 제목</h3>
                <ul className="headlines-list">
                  {headlines.map((headline, index) => (
                    <li key={index} className="headline-item">{headline}</li>
                  ))}
                </ul>
              </div>
              
              <div className="content-output">
                <div className="content-preview">
                  <div dangerouslySetInnerHTML={{ 
                    __html: result.replace(/\n/g, '<br>').replace(/# (.*)/g, '<h2>$1</h2>').replace(/## (.*)/g, '<h3>$1</h3>').replace(/\*\*(.*)\*\*/g, '<strong>$1</strong>').replace(/- (.*)/g, '<li>$1</li>').replace(/!\[(.*)\]\((.*)\)/g, '<img src="$2" alt="$1" class="content-image">')
                  }} />
                </div>
                
                <div className="content-actions">
                  <button className="copy-button" onClick={() => {
                    navigator.clipboard.writeText(result);
                    alert('콘텐츠가 클립보드에 복사되었습니다.');
                  }}>
                    클립보드에 복사
                  </button>
                  <button className="download-button" onClick={() => {
                    const blob = new Blob([result], { type: 'text/markdown' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${keyword}-content.md`;
                    a.click();
                  }}>
                    마크다운으로 다운로드
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}
        
        {/* VIP 신청 모달 */}
        {showVipModal && (
          <div className="modal-overlay">
            <div className="modal-container">
              <button className="modal-close" onClick={() => setShowVipModal(false)}>×</button>
              <h2>VIP 회원 신청</h2>
              <p>VIP 회원이 되어 모든 고급 기능을 이용해보세요.</p>
              
              <div className="vip-plan">
                <h3>월 정액제</h3>
                <div className="price">30,000원 / 월</div>
                <ul className="plan-features">
                  <li>무제한 콘텐츠 생성</li>
                  <li>트렌드 키워드 분석</li>
                  <li>경쟁사 콘텐츠 분석</li>
                  <li>AI 글 퀄리티 향상</li>
                  <li>우선 지원</li>
                </ul>
                
                <div className="payment-info">
                  <p>계좌번호: 1002-xxx-xxxxxx (우리은행)</p>
                  <p>입금자명을 입력하시면 관리자 확인 후 VIP로 승격됩니다.</p>
                  <input
                    type="text"
                    placeholder="입금자명"
                    className="payment-input"
                    value={currentUser?.username || ''}
                    disabled={!isLoggedIn}
                  />
                  <button 
                    className="apply-button" 
                    disabled={!isLoggedIn}
                    onClick={() => {
                      alert('VIP 신청이 완료되었습니다. 관리자 확인 후 승인됩니다.');
                      setShowVipModal(false);
                    }}
                  >
                    {isLoggedIn ? 'VIP 신청하기' : '로그인 필요'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      
      <footer className="footer">
        <div className="footer-content">
          <p>© 2024 Smart Content Creator. All rights reserved.</p>
          {isAdmin && (
            <Link to="/admin-dashboard" className="admin-link">관리자 페이지</Link>
          )}
        </div>
      </footer>
    </div>
  );
}

export default NewHome;
