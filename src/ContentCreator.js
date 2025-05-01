import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/SupabaseAuthContext';
import './App.css';

// API 키
const API_KEY = "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";

function ContentCreator() {
  // 인증 컨텍스트에서 사용자 정보 및 사용량 관련 함수 가져오기
  const { userProfile, checkAndUpdateUsage, incrementUsage } = useAuth();
  const navigate = useNavigate();

  // 상태 관리
  const [keyword, setKeyword] = useState('');
  const [link, setLink] = useState('');
  const [contentType, setContentType] = useState('블로그');
  const [styleType, setStyleType] = useState('전문적');
  const [writingTone, setWritingTone] = useState('친근한');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [uploadedImages, setUploadedImages] = useState([]);
  const [convertedLinks, setConvertedLinks] = useState([]);
  const [usageExceeded, setUsageExceeded] = useState(false);

  // 컴포넌트 마운트 시 사용량 확인
  useEffect(() => {
    const checkUsage = async () => {
      const canUse = await checkAndUpdateUsage();
      setUsageExceeded(!canUse);
    };
    
    if (userProfile) {
      checkUsage();
    }
  }, [userProfile, checkAndUpdateUsage]);

  // 이미지 업로드 핸들러
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const imagePromises = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve(e.target.result);
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(imagePromises).then((images) => {
      setUploadedImages(prevImages => [...prevImages, ...images]);
    });
  };

  // 이미지 삭제 핸들러
  const handleImageDelete = (index) => {
    setUploadedImages(prevImages => prevImages.filter((_, i) => i !== index));
  };

  // OpenAI API 호출 함수
  const callOpenAI = async (prompt) => {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 4000,
        }),
      });

      if (!response.ok) {
        throw new Error(`API 오류: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error("API 호출 중 오류 발생:", error);
      throw error;
    }
  };

  // 콘텐츠 생성 함수
  const generateContent = async () => {
    // 사용량 확인
    const canUse = await checkAndUpdateUsage();
    if (!canUse) {
      setUsageExceeded(true);
      toast.error('일일 사용 한도를 초과했습니다. VIP 회원으로 업그레이드하세요.');
      return;
    }

    if (!keyword) {
      toast.warning("키워드를 입력해주세요.");
      return;
    }

    setIsLoading(true);
    setLoadingMessage("SEO에 가장 적합한 글을 생성중입니다");

    try {
      // 콘텐츠 생성 요청 - 더 풍부하고 전문적인 콘텐츠를 위한 프롬프트 개선
      const contentPrompt = `
        다음 키워드로 ${contentType} 콘텐츠를 작성해주세요: ${keyword}
        
        작성 요구사항:
        - 스타일: ${styleType}
        - 톤: ${writingTone}
        ${link ? `- 참고할 링크: ${link} (이 링크는 콘텐츠 내에 1~3회 정도만 자연스럽게 포함해주세요)` : ''}
        - 2000단어 이상의 상세하고 깊이 있는 콘텐츠를 작성해주세요.
        - SEO 최적화를 위해 키워드를 자연스럽게 배치하되, 상위 노출에 유리한 구조로 작성해주세요.
        - 이해하기 쉬운 설명과 실용적인 예시를 반드시 포함해주세요.
        - H1, H2, H3 등의 태그를 적절히 사용한 구조화된 콘텐츠를 작성해주세요.
        - 독자가 깊게 읽고싶어 하는 전문적인 정보를 포함해주세요.
        - 결론 부분에서는 핵심 내용을 요약하고 행동 유도(CTA)를 포함해주세요.
        
        다음과 같은 HTML 형식으로 작성해주세요:
        1. <h1> 태그로 제목 작성
        2. <h2>, <h3> 태그로 섹션 구분
        3. <p> 태그로 문단 작성
        4. <ul>, <li> 태그로 목록 작성
        5. <strong> 태그로 중요 단어 강조
        6. <a href="..."> 태그로 관련 참고 링크 제공 (입력된 링크는 최대 3회까지만 포함)
        7. 이미지가 들어갈 자리는 <div class="image-placeholder"></div>로 5-6개 적절히 배치해주세요.
      `;
      
      // 로딩 메시지 업데이트
      setLoadingMessage("콘텐츠를 생성하고 최적화하는 중입니다...");
      
      const contentResult = await callOpenAI(contentPrompt);
      
      // 이미지가 포함된 최종 콘텐츠 생성 - 개선된 이미지 처리
      let finalContent = contentResult;
      
      // 링크 수 제한 처리 (최대 3회만 표시)
      if (link) {
        try {
          // 링크가 포함된 a 태그 찾기
          const linkRegex = new RegExp(`<a[^>]*href\\s*=\\s*["']?${link.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']?[^>]*>.*?<\/a>`, 'gi');
          const linkMatches = finalContent.match(linkRegex) || [];
          
          // 링크가 3개 이상이면 랜덤하게 3개만 유지
          if (linkMatches.length > 3) {
            // 링크 복사본 생성
            const linksCopy = [...linkMatches];
            
            // 남길 링크 3개 랜덤 선택 (Fisher-Yates 셔플 알고리즘)
            const randomLinks = [];
            for (let i = 0; i < 3; i++) {
              const randomIndex = Math.floor(Math.random() * linksCopy.length);
              randomLinks.push(linksCopy[randomIndex]);
              linksCopy.splice(randomIndex, 1);
            }
            
            // 각 링크 매치마다 확인
            let currentIndex = 0;
            finalContent = finalContent.replace(linkRegex, (match) => {
              // 선택된 3개 링크에 포함되면 유지, 아니면 텍스트만 추출
              if (randomLinks.includes(match)) {
                return match;
              } else {
                // a 태그에서 텍스트만 추출
                const textMatch = match.match(/>(.+?)<\/a>/);
                return textMatch ? textMatch[1] : match.replace(/<\/?a[^>]*>/g, '');
              }
            });
          }
        } catch (error) {
          console.error("링크 제한 처리 중 오류 발생:", error);
        }
      }
      
      // 이미지 자리표시자를 실제 이미지로 교체
      if (convertedLinks.length > 0) {
        // 이미지 플레이스홀더 찾기
        const placeholders = finalContent.match(/<div class="image-placeholder"><\/div>/g) || [];
        
        // 업로드된 이미지 개수만큼만 이미지 태그로 변환
        const imageCount = Math.min(convertedLinks.length, placeholders.length);
        
        // 이미지 삽입 처리
        for (let i = 0; i < imageCount; i++) {
          // i번째 이미지 태그 생성
          const imageTag = `<div class="content-image"><img src="${convertedLinks[i]}" alt="콘텐츠 이미지 ${i+1}" /></div>`;
          
          // 첫 번째 플레이스홀더를 이미지로 대체
          finalContent = finalContent.replace(/<div class="image-placeholder"><\/div>/, imageTag);
        }
      }
      
      // 최종 결과 설정
      setResult(finalContent);
      
      // 사용량 증가 기록
      await incrementUsage();
      
      // 성공 메시지
      toast.success("콘텐츠가 성공적으로 생성되었습니다!");
    } catch (error) {
      console.error("콘텐츠 생성 중 오류 발생:", error);
      toast.error("콘텐츠 생성 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  // Base64 이미지를 데이터 URL로 변환 (임시 처리)
  useEffect(() => {
    // 업로드된 이미지를 직접 사용
    setConvertedLinks(uploadedImages);
  }, [uploadedImages]);

  // 결과 콘텐츠 복사 핸들러 - 레거시 방식 사용
  const handleCopyContent = () => {
    try {
      // 복사할 HTML 컨텐츠를 가져오기
      const tempElement = document.createElement('div');
      tempElement.innerHTML = result;
      
      // HTML 태그 제거하고 순수 텍스트만 추출
      const plainText = tempElement.textContent || tempElement.innerText || "";
      
      // 임시 텍스트 영역 생성
      const textArea = document.createElement("textarea");
      textArea.value = plainText;
      
      // 화면에서 보이지 않게 스타일 설정
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      
      // 텍스트 선택 및 복사
      textArea.focus();
      textArea.select();
      
      // 복사 명령 실행
      const successful = document.execCommand('copy');
      
      // 임시 요소 제거
      document.body.removeChild(textArea);
      
      if (successful) {
        // 복사 성공 시 알림 표시
        const copyButton = document.querySelector('.copy-button');
        if (copyButton) {
          // 원래 텍스트 저장
          const originalText = copyButton.innerHTML;
          
          // 버튼 스타일 변경 및 텍스트 업데이트
          copyButton.classList.add('copied');
          copyButton.innerHTML = '✓ 복사됨';
          
          // 1초 후 원래 상태로 복원
          setTimeout(() => {
            copyButton.classList.remove('copied');
            copyButton.innerHTML = originalText;
          }, 1500);
        }
        
        // 토스트 메시지 표시
        toast.success('콘텐츠가 클립보드에 복사되었습니다!');
      } else {
        throw new Error("복사 명령 실행 실패");
      }
    } catch (error) {
      console.error('복사 처리 중 오류:', error);
      toast.error('복사 처리 중 오류가 발생했습니다');
    }
  };

  // 결과 콘텐츠 저장 핸들러
  const handleSaveContent = () => {
    try {
      // HTML 태그 제거하고 순수 텍스트만 추출
      const tempElement = document.createElement('div');
      tempElement.innerHTML = result;
      const plainText = tempElement.textContent || tempElement.innerText || "";
      
      // 새 Blob 객체 생성
      const blob = new Blob([plainText], {type: 'text/plain'});
      
      // Blob URL 생성
      const url = URL.createObjectURL(blob);
      
      // 가상 다운로드 링크 생성
      const a = document.createElement('a');
      a.href = url;
      a.download = `${keyword}-content.txt`;
      
      // 링크 클릭하여 다운로드 트리거
      document.body.appendChild(a);
      a.click();
      
      // 정리
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      // 알림 표시
      toast.success('콘텐츠가 저장되었습니다!');
    } catch (error) {
      console.error('저장 처리 중 오류:', error);
      toast.error('저장 처리 중 오류가 발생했습니다');
    }
  };

  return (
    <div className="app">
      {/* 로딩 오버레이 */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="spinner"></div>
            <p className="loading-message">{loadingMessage}</p>
          </div>
        </div>
      )}

      <div className="container">
        {/* 헤더 섹션 */}
        <div className="header-section">
          <h1 className="title">
            <span className="highlight">100% 품질의</span> AI 콘텐츠 생성기
          </h1>
          <p className="promo-description">
            <span className="highlight-red">검출되지 않는 자동화</span> - 
            고품질, SEO 최적화된 콘텐츠를 자동으로 생성하여 구글에 의해 감지되지 않습니다.
          </p>
          
          <div className="features-section">
            <div className="features-grid">
              {["통합 키워드 분석", "노출 최적화", "자연스러운 AI 글쓰기", "다중 플랫폼"].map((feature, idx) => (
                <div key={idx} className="feature-item">
                  <span className="feature-checkmark">✓</span>
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 회원 정보 배너 */}
        <div className={`membership-banner ${userProfile?.membershipType === 'vip' ? 'vip-banner' : ''}`}>
          <div className="membership-info">
            <span className="membership-type">
              {userProfile?.membershipType === 'vip' 
                ? '✨ VIP 회원' 
                : '일반 회원'}
            </span>
            {userProfile?.membershipType === 'vip' ? (
              <span className="membership-detail">
                무제한 콘텐츠 생성 가능
              </span>
            ) : (
              <span className="membership-detail">
                일일 사용 가능 횟수: {1 - (userProfile?.dailyUsageCount || 0)}/1
              </span>
            )}
          </div>
          {userProfile?.membershipType !== 'vip' && (
            <button 
              className="upgrade-button"
              onClick={() => navigate('/upgrade-vip')}
            >
              VIP 업그레이드
            </button>
          )}
        </div>

        {/* 사용량 초과 경고 */}
        {usageExceeded && (
          <div className="usage-warning">
            <h3>일일 사용 한도를 초과했습니다</h3>
            <p>일반 회원은 하루 1회만 콘텐츠를 생성할 수 있습니다.</p>
            <p>VIP 회원으로 업그레이드하여 무제한으로 사용하세요!</p>
            <button 
              className="upgrade-button large"
              onClick={() => navigate('/upgrade-vip')}
            >
              VIP 회원으로 업그레이드
            </button>
          </div>
        )}

        {/* 콘텐츠 생성 섹션 */}
        <div className="content-section">
          <h2>콘텐츠 생성</h2>
          
          <div className="input-group">
            <label>키워드</label>
            <input 
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="키워드를 입력하세요"
            />
          </div>

          <div className="input-group">
            <label>링크 (선택)</label>
            <input 
              type="text"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://blog.net"
            />
          </div>

          <div className="select-group">
            <label>콘텐츠 유형 선택</label>
            <div className="platform-grid">
              <label className={contentType === '블로그' ? 'selected' : ''}>
                <input 
                  type="radio" 
                  name="contentType" 
                  value="블로그" 
                  checked={contentType === '블로그'} 
                  onChange={() => setContentType('블로그')}
                />
                블로그
              </label>
              <label className={contentType === '소셜미디어' ? 'selected' : ''}>
                <input 
                  type="radio" 
                  name="contentType" 
                  value="소셜미디어" 
                  checked={contentType === '소셜미디어'} 
                  onChange={() => setContentType('소셜미디어')}
                />
                소셜미디어
              </label>
              <label className={contentType === '웹사이트' ? 'selected' : ''}>
                <input 
                  type="radio" 
                  name="contentType" 
                  value="웹사이트" 
                  checked={contentType === '웹사이트'} 
                  onChange={() => setContentType('웹사이트')}
                />
                웹사이트
              </label>
              <label className={contentType === '뉴스레터' ? 'selected' : ''}>
                <input 
                  type="radio" 
                  name="contentType" 
                  value="뉴스레터" 
                  checked={contentType === '뉴스레터'} 
                  onChange={() => setContentType('뉴스레터')}
                />
                뉴스레터
              </label>
            </div>
          </div>

          <div className="select-group">
            <label>스타일 선택</label>
            <div className="platform-grid">
              <label className={styleType === '전문적' ? 'selected' : ''}>
                <input 
                  type="radio" 
                  name="styleType" 
                  value="전문적" 
                  checked={styleType === '전문적'} 
                  onChange={() => setStyleType('전문적')}
                />
                전문적
              </label>
              <label className={styleType === '캐주얼' ? 'selected' : ''}>
                <input 
                  type="radio" 
                  name="styleType" 
                  value="캐주얼" 
                  checked={styleType === '캐주얼'} 
                  onChange={() => setStyleType('캐주얼')}
                />
                캐주얼
              </label>
              <label className={styleType === '교육적' ? 'selected' : ''}>
                <input 
                  type="radio" 
                  name="styleType" 
                  value="교육적" 
                  checked={styleType === '교육적'} 
                  onChange={() => setStyleType('교육적')}
                />
                교육적
              </label>
              <label className={styleType === '스토리텔링' ? 'selected' : ''}>
                <input 
                  type="radio" 
                  name="styleType" 
                  value="스토리텔링" 
                  checked={styleType === '스토리텔링'} 
                  onChange={() => setStyleType('스토리텔링')}
                />
                스토리텔링
              </label>
            </div>
          </div>

          <div className="select-group">
            <label>톤 선택</label>
            <div className="platform-grid">
              <label className={writingTone === '친근한' ? 'selected' : ''}>
                <input 
                  type="radio" 
                  name="writingTone" 
                  value="친근한" 
                  checked={writingTone === '친근한'} 
                  onChange={() => setWritingTone('친근한')}
                />
                친근한
              </label>
              <label className={writingTone === '권위있는' ? 'selected' : ''}>
                <input 
                  type="radio" 
                  name="writingTone" 
                  value="권위있는" 
                  checked={writingTone === '권위있는'} 
                  onChange={() => setWritingTone('권위있는')}
                />
                권위있는
              </label>
              <label className={writingTone === '유머러스' ? 'selected' : ''}>
                <input 
                  type="radio" 
                  name="writingTone" 
                  value="유머러스" 
                  checked={writingTone === '유머러스'} 
                  onChange={() => setWritingTone('유머러스')}
                />
                유머러스
              </label>
              <label className={writingTone === '감성적' ? 'selected' : ''}>
                <input 
                  type="radio" 
                  name="writingTone" 
                  value="감성적" 
                  checked={writingTone === '감성적'} 
                  onChange={() => setWritingTone('감성적')}
                />
                감성적
              </label>
            </div>
          </div>

          <div className="upload-section">
            <label>이미지 업로드 (선택)</label>
            <div className="upload-container">
              <input 
                type="file" 
                accept="image/*" 
                multiple 
                onChange={handleImageUpload} 
                className="file-input" 
                id="imageUpload"
              />
              <label htmlFor="imageUpload" className="upload-button">
                이미지 선택
              </label>
              <span className="upload-info">최대 5장, JPG/PNG</span>
            </div>
            
            {uploadedImages.length > 0 && (
              <div className="image-preview-container">
                {uploadedImages.map((image, index) => (
                  <div key={index} className="image-preview">
                    <img src={image} alt={`업로드 ${index + 1}`} />
                    <button 
                      className="delete-image"
                      onClick={() => handleImageDelete(index)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <button 
            className="generate-button" 
            onClick={generateContent}
            disabled={isLoading || usageExceeded}
          >
            {isLoading ? '생성 중...' : '콘텐츠 생성하기'}
          </button>

          {result && (
            <div className="result-section">
              <h2>생성된 콘텐츠</h2>
              <div className="action-buttons">
                <button className="copy-button" onClick={handleCopyContent}>
                  <span>📋 복사하기</span>
                </button>
                <button className="save-button" onClick={handleSaveContent}>
                  <span>💾 저장하기</span>
                </button>
              </div>
              <div className="content-result" dangerouslySetInnerHTML={{ __html: result }}></div>
            </div>
          )}
        </div>
      </div>

      {/* 푸터 */}
      <footer className="footer">
        <div className="footer-content">
          <p>© 2025 Smart Content Creator. All rights reserved.</p>
          <div className="footer-nav">
            <a href="/dashboard">대시보드</a>
            <a href="/upgrade-vip">VIP 업그레이드</a>
            <a href="/help">도움말</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default ContentCreator;
