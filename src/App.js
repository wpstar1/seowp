import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
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
  const [showCompetitorAnalysis, setShowCompetitorAnalysis] = useState(false);
  const [isMobileOptimized, setIsMobileOptimized] = useState(true); // 기본값은 모바일 최적화 활성화
  const [isLoadingKeywords, setIsLoadingKeywords] = useState(false);
  const [todaysKeyword, setTodaysKeyword] = useState("");  // 오늘의 키워드 상태 추가
  const [previousKeywords, setPreviousKeywords] = useState([]); // 과거 사용 키워드 추가
  const [recentKeywords, setRecentKeywords] = useState([]); // 최근 사용 키워드 기반 추천
  const [similarKeywords, setSimilarKeywords] = useState([]); // 현재 입력 키워드 기반 추천
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showVipModal, setShowVipModal] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authError, setAuthError] = useState('');
  
  // VIP 신청 정보
  const [depositName, setDepositName] = useState('');
  const [vipRequestStatus, setVipRequestStatus] = useState(''); // 'pending', 'approved', 'rejected'
  const [isVip, setIsVip] = useState(false);  // VIP 상태 추가

  // 가독성 점수 관련 상태 추가
  const [readabilityScore, setReadabilityScore] = useState(null);
  const [showReadabilityDetails, setShowReadabilityDetails] = useState(false);
  const [readabilityDetails, setReadabilityDetails] = useState({
    sentenceLength: 0,
    paragraphCount: 0,
    readingDifficulty: 0,
    keywordDensity: 0,
    suggestions: []
  });

  // 스낵바 관련 상태 추가
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // 로컬 스토리지에서 사용자 정보 로드
  useEffect(() => {
    const currentUser = localStorage.getItem('smart_content_current_user');
    
    if (currentUser) {
      setIsLoggedIn(true);
      setUsername(currentUser);
      
      // 사용자 데이터 로드 - 대소문자 구분 없이 사용자 찾기
      const users = JSON.parse(localStorage.getItem('smart_content_users') || '[]');
      const user = users.find(u => u.username.toLowerCase() === currentUser.toLowerCase());
      
      if (user) {
        console.log('초기 로딩: 사용자 데이터 확인', user);
        
        // VIP 상태 확인 및 설정
        if (user.membershipType === 'vip' && user.vipStatus === 'approved') {
          console.log('초기 로딩: 사용자는 VIP 회원입니다.');
          setIsVip(true);
        } else {
          console.log('초기 로딩: 사용자는 일반 회원입니다.');
          setIsVip(false);
        }
        
        // 저장된 링크 로드
        if (user.savedLinks) {
          setLinks(user.savedLinks);
        }
        
        // 과거 사용 키워드 로드
        if (user.previousKeywords) {
          setPreviousKeywords(user.previousKeywords);
        }
      }
    }

    // 오늘의 키워드 설정
    setTodaysKeyword(getRandomKeywordForToday());
  }, []);

  // 승인된 사용자 목록을 정기적으로 확인하고 VIP 상태를 업데이트하는 기능 추가
  useEffect(() => {
    const checkApprovedUsers = async () => {
      if (!username) return;
      
      console.log('VIP 상태 확인 중...', username);
      try {
        // API 호출 전 로컬 스토리지 상태 확인
        const initialUsers = JSON.parse(localStorage.getItem('smart_content_users') || '[]');
        const initialUser = initialUsers.find(u => u.username === username);
        console.log('API 호출 전 사용자 상태:', initialUser);
        
        const response = await fetch('https://seo-beige.vercel.app/api/approved-users');
        if (!response.ok) {
          console.error('API 응답 오류:', response.status);
          return;
        }
        
        const data = await response.json();
        console.log('API 응답 데이터:', data);
        
        if (data.success && Array.isArray(data.approvedUsers)) {
          // 대소문자 구분 없이 비교
          const approvedUser = data.approvedUsers.find(u => 
            u.userId.toLowerCase() === username.toLowerCase()
          );
          console.log('승인된 사용자 찾기 결과:', approvedUser);
          
          if (approvedUser && approvedUser.approvalStatus === 'approved') {
            console.log('VIP 승인 상태 확인됨:', approvedUser);
            
            // 현재 사용자가 VIP가 아니라면 업데이트
            const users = JSON.parse(localStorage.getItem('smart_content_users') || '[]');
            // 대소문자 구분 없이 사용자 찾기
            const userIndex = users.findIndex(u => u.username.toLowerCase() === username.toLowerCase());
            console.log('사용자 인덱스:', userIndex);
            
            if (userIndex !== -1) {
              // 사용자 VIP 상태 업데이트
              const today = new Date();
              const expiryDate = new Date(today);
              expiryDate.setDate(today.getDate() + 30); // 30일 후
              
              // 기존 사용자 데이터 백업
              const beforeUpdate = {...users[userIndex]};
              console.log('업데이트 전 사용자 데이터:', beforeUpdate);
              
              users[userIndex].membershipType = 'vip';
              users[userIndex].vipStatus = 'approved';
              users[userIndex].membershipExpiry = expiryDate.toISOString();
              users[userIndex].updatedAt = new Date().toISOString();
              
              console.log('업데이트 후 사용자 데이터:', users[userIndex]);
              
              // 로컬 스토리지 업데이트
              localStorage.setItem('smart_content_users', JSON.stringify(users));
              console.log('로컬 스토리지 업데이트 완료');
              
              // 현재 사용자 정보 업데이트
              const updatedUser = {...users[userIndex]};
              
              setIsLoggedIn(true);
              setUsername(updatedUser.username);
              setIsVip(true);  // VIP 상태 업데이트
              console.log('React 상태 업데이트 완료: isVip =', true);
              
              // 상태 변경 후 강제로 UI 업데이트를 위한 추가 처리
              setTimeout(() => {
                // 상태가 제대로 반영되었는지 다시 확인
                console.log('타임아웃 후 VIP 상태 다시 확인:', isVip);
                
                // 상태가 false로 남아있다면 강제로 다시 설정
                if (!isVip) {
                  console.log('강제 VIP 상태 업데이트 적용');
                  setIsVip(true);
                }
              }, 500);
            }
          }
        }
      } catch (error) {
        console.error('승인 상태 확인 중 오류:', error);
      }
    };
    
    // 페이지 로드 시 즉시 확인
    checkApprovedUsers();
    
    // 1분마다 주기적으로 확인
    const intervalId = setInterval(checkApprovedUsers, 60000);
    
    return () => {
      clearInterval(intervalId); // 컴포넌트 언마운트 시 인터벌 제거
    };
  }, [username]);

  // 과거 사용 키워드 기반 추천 키워드 생성
  const generateRecentKeywordRecommendations = () => {
    const currentUser = localStorage.getItem('smart_content_current_user');
    if (!currentUser) return;
    
    const users = JSON.parse(localStorage.getItem('smart_content_users') || '[]');
    const user = users.find(u => u.username === currentUser);
    
    if (user && user.previousKeywords && user.previousKeywords.length > 0) {
      // 최근 3개의 키워드를 가져옴
      const recent = user.previousKeywords.slice(0, Math.min(3, user.previousKeywords.length));
      
      // 추천 키워드 생성 (각 최근 키워드당 1개의 추천 키워드)
      const recommendations = recent.map(keyword => {
        const suffixes = [' 추천', ' 가이드', ' 방법', ' 리뷰', ' 트렌드', ' 2025'];
        const randomSuffix = suffixes[Math.floor(Math.random() * suffixes.length)];
        return keyword + randomSuffix;
      });
      
      setRecentKeywords(recommendations);
    }
  };

  // 오늘의 키워드 추천 생성
  const getRandomKeywordForToday = () => {
    // 기본 키워드 목록
    const defaultKeywords = [
      "디지털마케팅", "SNS마케팅", "콘텐츠제작", "블로그운영", "인스타그램", 
      "유튜브마케팅", "AI활용법", "이커머스", "온라인광고", "웹사이트제작"
    ];
    
    // 날짜를 시드로 사용해 매일 같은 키워드 추천 (더 복잡한 구현도 가능)
    const today = new Date().toLocaleDateString();
    const seed = today.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    return defaultKeywords[seed % defaultKeywords.length];
  };
  
  // 오늘의 키워드 적용
  const applyTodaysKeyword = () => {
    setKeyword(todaysKeyword);
  };
  
  // 추천 키워드 적용
  const applyRecommendedKeyword = (recommendedKeyword) => {
    setKeyword(recommendedKeyword);
  };

  // 구글 트렌드 API를 통한 실시간 키워드 제안 가져오기
  const fetchTrendingKeywords = async (baseKeyword) => {
    if (!baseKeyword) return;
    
    setIsLoadingKeywords(true);
    
    try {
      // 실제 구현에서는 Google Trends API를 사용할 것입니다.
      // 지금은 데모 데이터로 가정합니다.
      // const response = await fetch(`https://trends.google.com/trends/api/dailytrends?hl=ko&geo=KR&ns=15`);
      
      // 여기서는 실제 API 대신 시뮬레이션된 응답을 사용합니다.
      
      setTimeout(() => {
        // 입력된 키워드 기반으로 트렌드 키워드 생성
        const simulatedTrends = [
          `${baseKeyword} 추천`,
          `${baseKeyword} 가격`,
          `${baseKeyword} 후기`,
          `${baseKeyword} 사용법`,
          `${baseKeyword} 비교`,
          `${baseKeyword} 최신`,
          `${baseKeyword} 트렌드`,
          `최신 ${baseKeyword}`,
          `인기 ${baseKeyword}`,
          `${baseKeyword} 2025`
        ];
        setTrendingKeywords(simulatedTrends);
        setIsLoadingKeywords(false);
        setShowTrendingKeywords(true);
      }, 1000);
    } catch (error) {
      console.error('트렌드 키워드 가져오기 오류:', error);
      alert('트렌드 키워드를 가져오는 중 오류가 발생했습니다.');
      setIsLoadingKeywords(false);
    }
  };

  // 경쟁 키워드 분석 함수
  const analyzeCompetition = async (targetKeyword) => {
    if (!targetKeyword) return;
    
    setIsLoadingKeywords(true);
    
    try {
      // 실제 구현에서는 SEO API를 사용할 것입니다.
      // 지금은 데모 데이터로 가정합니다.
      setTimeout(() => {
        const simulatedCompetition = [
          { keyword: `${targetKeyword} 추천`, difficulty: '낮음', volume: '월 3,400회', cpc: '₩1,200' },
          { keyword: `${targetKeyword} 가격`, difficulty: '중간', volume: '월 5,200회', cpc: '₩1,800' },
          { keyword: `${targetKeyword} 후기`, difficulty: '높음', volume: '월 8,100회', cpc: '₩2,500' },
          { keyword: `${targetKeyword} 사용법`, difficulty: '낮음', volume: '월 2,800회', cpc: '₩900' },
          { keyword: `${targetKeyword} 비교`, difficulty: '중간', volume: '월 4,500회', cpc: '₩1,600' }
        ];
        setCompetitorKeywords(simulatedCompetition);
        setIsLoadingKeywords(false);
        setShowCompetitorAnalysis(true);
      }, 1500);
    } catch (error) {
      console.error('경쟁 키워드 분석 오류:', error);
      alert('경쟁 키워드를 분석하는 중 오류가 발생했습니다.');
      setIsLoadingKeywords(false);
    }
  };

  // OpenAI API 호출 함수
  const callOpenAI = async (prompt, model = "gpt-3.5-turbo") => {
    try {
      const API_KEY = process.env.REACT_APP_OPENAI_API_KEY;
      
      // 실제 API 호출 코드 (현재는 시뮬레이션으로 대체)
      /*
      const response = await fetch("https://api.together.xyz/v1/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          model: model,
          prompt: prompt,
          max_tokens: 4000,
          temperature: 0.7,
          top_p: 0.9,
          stop: ["###"]
        })
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message || "API 호출 중 오류가 발생했습니다.");
      }
      
      return data.choices[0].text;
      */
      
      // 시뮬레이션된 응답
      return `시뮬레이션된 결과: ${prompt.substring(0, 50)}...`;
    } catch (error) {
      console.error("OpenAI API 오류:", error);
      throw error;
    }
  };

  // 이미지 파일을 Base64로 변환하는 함수
  const convertImageToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // 콘텐츠 생성 함수
  const generateContent = async () => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    
    if (!keyword) {
      alert("키워드를 입력해주세요.");
      return;
    }
    
    // 키워드를 과거 사용 키워드에 저장
    saveKeywordToHistory(keyword);
    
    setIsLoading(true);
    setLoadingMessage("SEO에 가장 적합한 글을 생성중입니다");
    
    setLoadingStep(1);
    setLoadingProgress(0);
    
    // SEO 및 블로그 팁 설정
    const tips = [
      "구글 검색엔진은 콘텐츠의 품질과 관련성을 가장 중요시합니다.",
      "네이버는 한국 사용자 맞춤형 콘텐츠와 내부 플랫폼 활용도를 중요시합니다.",
      "구글 SEO에서는 백링크의 품질이 양보다 중요합니다.",
      "네이버 블로그는 꾸준한 포스팅과 체류시간이 검색 노출에 영향을 줍니다.",
      "구글은 모바일 친화적인 웹사이트를 우선적으로 노출합니다.",
      "네이버는 내부 서비스(지식인, 카페 등)와의 연계가 중요합니다.",
      "구글 SEO에서는 페이지 로딩 속도가 중요한 랭킹 요소입니다.",
      "네이버에서는 콘텐츠의 신뢰도와 정확성이 중요합니다.",
      "구글은 자연스러운 키워드 사용을 선호하며 과도한 키워드 밀도는 불이익을 줍니다.",
      "네이버는 검색어 최적화를 위한 제목 설정이 중요합니다."
    ];
    setLoadingTips(tips);
    
    try {
      // 이미지를 Base64 인코딩으로 변환하여 복사해도 깨지지 않게 함
      const convertedLinks = [];
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        try {
          // 이미지를 Base64로 변환
          const base64 = await convertImageToBase64(img);
          convertedLinks.push(base64);
        } catch (error) {
          console.error("이미지 변환 오류:", error);
          // 실패 시 원래 방식으로 URL 생성
          convertedLinks.push(URL.createObjectURL(img));
        }
      }
      setImageLinks(convertedLinks);
      
      // 진행 단계 시뮬레이션
      setLoadingStep(2);
      setLoadingProgress(30);
      setLoadingMessage("키워드를 분석하여 최적의 콘텐츠 구조를 설계중입니다");
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setLoadingStep(3);
      setLoadingProgress(60);
      setLoadingMessage("콘텐츠를 생성하고 SEO 최적화를 적용중입니다");
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 예시 결과 생성
      const exampleResult = generateContentWithRandomLinks();
      
      // 예시 헤드라인 생성
      const exampleHeadlines = [
        `${keyword} 완벽 가이드: 초보자도 쉽게 이해하는 방법`,
        `2025년 ${keyword} 트렌드와 전망은?`,
        `당신이 몰랐던 ${keyword}의 5가지 놀라운 비밀`,
        `${keyword} 전문가가 알려주는 핵심 팁 10가지`,
        `왜 모두가 ${keyword}에 주목하고 있을까?`
      ];
      
      setLoadingStep(4);
      setLoadingProgress(90);
      setLoadingMessage("최종 콘텐츠를 검수하고 있습니다");
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 결과 설정
      setResult(exampleResult);
      setHeadlines(exampleHeadlines);
      
      // SEO 분석 예시 데이터
      const exampleSEOAnalysis = {
        주요_키워드: [`${keyword}`, `${keyword} 가이드`, `${keyword} 방법`, `${keyword} 팁`, `최신 ${keyword}`],
        경쟁도: `중간 - ${keyword}는 경쟁이 있지만 틈새시장을 공략할 수 있는 키워드입니다.`,
        검색_볼륨: `중간 - 월 평균 3,000-5,000회 검색되는 키워드입니다.`,
        추천_태그: [`${keyword}`, `${keyword} 가이드`, `${keyword} 방법`, `${keyword} 팁`, `${keyword} 트렌드`, `${keyword} 전문가`, `${keyword} 최신`],
        키워드_트렌드: `상승 - 최근 6개월간 꾸준히 검색량이 증가하고 있는 추세입니다.`,
        콘텐츠_전략: [
          `${keyword}에 대한 초보자 가이드를 작성하세요.`,
          `${keyword} 관련 전문가 인터뷰나 사례 연구를 포함하세요.`,
          `${keyword}에 대한 자주 묻는 질문(FAQ)을 포함하세요.`
        ]
      };
      setSeoAnalysis(exampleSEOAnalysis);
      
      setLoadingProgress(100);
      setIsLoading(false);
      
      // 결과 영역으로 자동 스크롤
      setTimeout(() => {
        const resultSection = document.querySelector('.result-section');
        if (resultSection) {
          resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 500);
      
      // VIP 회원인 경우 트렌드 및 경쟁 키워드 분석 시작
      const currentUser = localStorage.getItem('smart_content_current_user');
      if (currentUser) {
        const users = JSON.parse(localStorage.getItem('smart_content_users') || '[]');
        const user = users.find(u => u.username === currentUser);
        
        if (user && user.membershipType === 'vip' && user.vipStatus === 'approved') {
          fetchTrendingKeywords(keyword);
          analyzeCompetition(keyword);
        }
      }
      
      // 가독성 점수 계산
      const readabilityScore = calculateReadabilityScore(exampleResult);
      setReadabilityScore(readabilityScore);
    } catch (error) {
      console.error("콘텐츠 생성 오류:", error);
      setIsLoading(false);
      alert("콘텐츠 생성 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
  };

  // 콘텐츠 생성 함수 (링크 포함)
  const generateContentWithRandomLinks = () => {
    // 링크가 있는지 확인
    const hasLinks = links && links.length > 0;
    const hasImages = imageLinks && imageLinks.length > 0;
    
    // 기본 콘텐츠 템플릿 생성
    let contentTemplate = generateBaseContent();
    
    // 콘텐츠를 여러 섹션으로 분할 (마지막 '참고자료' 부분 분리)
    const contentParts = contentTemplate.split('## 결론');
    const mainContent = contentParts[0];
    const conclusion = contentParts.length > 1 ? contentParts[1] : '';
    
    // 본문을 여러 단락으로 나누기
    const paragraphs = mainContent.split('\n\n').filter(p => p.trim().length > 0);
    const totalParagraphs = paragraphs.length;
    
    // === 링크 삽입 로직 ===
    if (hasLinks) {
      const randomLinksCount = Math.min(Math.floor(Math.random() * 3) + 1, links.length); // 1~3개 랜덤으로
      
      // 랜덤으로 선택된 링크 (중복 없이)
      const selectedLinkIndices = [];
      while (selectedLinkIndices.length < randomLinksCount) {
        const randomIndex = Math.floor(Math.random() * links.length);
        if (!selectedLinkIndices.includes(randomIndex)) {
          selectedLinkIndices.push(randomIndex);
        }
      }
      
      const selectedLinks = selectedLinkIndices.map(index => links[index]);
      
      // 링크를 삽입할 위치 결정 (서로 너무 가깝지 않게)
      const linkInsertPositions = [];
      
      if (randomLinksCount === 1) {
        // 1개일 경우 중간 부분에 삽입
        linkInsertPositions.push(Math.floor(totalParagraphs / 2));
      } else {
        // 2~3개일 경우 균등하게 분포
        const gap = Math.floor(totalParagraphs / (randomLinksCount + 1));
        for (let i = 1; i <= randomLinksCount; i++) {
          const pos = i * gap;
          if (pos < totalParagraphs) {
            linkInsertPositions.push(pos);
          }
        }
      }
      
      // 링크 소개 문구 다양하게 제공
      const getLinkIntroText = (linkKeyword) => {
        const introTexts = [
          `💡 더 알아보기: `,
          `📚 참고자료: `,
          `🔗 관련 정보: `,
          `👉 함께 보면 좋은 자료: `,
          `📖 추천 읽을거리: `,
          `🌐 추가 정보: `,
          `✨ ${linkKeyword}에 대한 더 자세한 내용: `,
          `⭐ 이 주제에 관심 있다면: `
        ];
        return introTexts[Math.floor(Math.random() * introTexts.length)];
      };
      
      // 링크 삽입
      linkInsertPositions.forEach((pos, idx) => {
        if (idx < selectedLinks.length && pos < paragraphs.length) {
          const link = selectedLinks[idx];
          const introText = getLinkIntroText(link.keyword);
          paragraphs[pos] += `\n\n> ${introText}[${link.keyword}](${link.url})`;
        }
      });
      
      // 모든 참고자료 목록 (나중에 추가)
      var referencesSection = '\n\n## 참고자료\n\n';
      selectedLinks.forEach((link, index) => {
        // 다양한 참고자료 형식 제공
        const referenceFormats = [
          `${index + 1}. [${link.keyword}](${link.url})`,
          `- [${link.keyword}](${link.url})`,
          `* "${link.keyword}" - [바로가기](${link.url})`,
          `• ${link.keyword}: [링크](${link.url})`,
          `[${link.keyword}](${link.url})`,
        ];
        const randomFormat = Math.floor(Math.random() * referenceFormats.length);
        referencesSection += referenceFormats[randomFormat] + '\n';
      });
    }
    
    // === 이미지 삽입 로직 ===
    if (hasImages) {
      // 이미지 개수에 따라 삽입할 위치 결정
      const imageCount = imageLinks.length;
      const imageInsertPositions = [];
      
      // 이미지 삽입 위치 결정 - 균등하게 분포하되 링크와 겹치지 않게
      if (imageCount === 1) {
        // 한 개일 경우 1/3 지점에 삽입
        imageInsertPositions.push(Math.floor(totalParagraphs / 3));
      } else if (imageCount === 2) {
        // 두 개일 경우 1/4, 3/4 지점에 삽입
        imageInsertPositions.push(Math.floor(totalParagraphs / 4));
        imageInsertPositions.push(Math.floor(totalParagraphs * 3 / 4));
      } else {
        // 세 개 이상일 경우 균등하게 분포
        for (let i = 1; i <= Math.min(imageCount, 5); i++) {
          const pos = Math.floor((i * totalParagraphs) / (Math.min(imageCount, 5) + 1));
          if (pos < totalParagraphs && pos > 0) {
            imageInsertPositions.push(pos);
          }
        }
      }
      
      // 이미지 캡션 생성
      const getImageCaption = (index) => {
        const captions = [
          `그림 ${index + 1}: ${keyword} 관련 이미지`,
          `${keyword}의 실제 적용 사례`,
          `${keyword} 시각화 자료`,
          `${keyword} 관련 참고 이미지 ${index + 1}`,
          `${keyword}에 대한 이해를 돕는 이미지`
        ];
        return captions[Math.floor(Math.random() * captions.length)];
      };
      
      // 이미지 삽입
      imageInsertPositions.forEach((pos, idx) => {
        if (idx < imageLinks.length && pos < paragraphs.length) {
          const imageUrl = imageLinks[idx];
          const caption = getImageCaption(idx);
          paragraphs[pos] += `\n\n<div class="content-image-container">
            <img src="${imageUrl}" alt="${caption}" class="content-image" />
            <p class="image-caption">${caption}</p>
          </div>`;
        }
      });
    }
    
    // 콘텐츠 재조립
    const contentWithMedias = paragraphs.join('\n\n');
    
    // 결론 부분 추가
    let resultContent = contentWithMedias;
    if (conclusion) {
      resultContent += '\n\n## 결론' + conclusion;
    }
    
    // 참고자료 섹션 추가 (링크가 있는 경우)
    if (hasLinks) {
      resultContent += referencesSection;
    }
    
    return resultContent;
  };

  // 기본 콘텐츠 생성 함수 (링크 없는 버전)
  const generateBaseContent = () => {
    // 자연스러운 이모티콘 목록
    const emojis = ['😊', '👍', '✨', '💡', '🔥', '👉', '👏', '💪', '😄', '🎉', '✅', '⭐', '💯', '🙌', '🤔', '💕', '🌟', '🎯', '📌', '🚀', '😎', '👀', '💬', '🌈', '💼', '📱', '💻', '📚', '⏰', '🎧'];
    
    // 이모티콘 전체 개수 제한 (1~10개 랜덤)
    const totalEmojiLimit = Math.floor(Math.random() * 10) + 1;
    let emojiCount = 0;
    
    // 랜덤 이모티콘 가져오기
    const getRandomEmoji = () => {
      return emojis[Math.floor(Math.random() * emojis.length)];
    };
    
    // 랜덤 확률로 이모티콘 추가
    const addEmojiWithProbability = (text, probability = 0.4) => {
      if (Math.random() < probability && emojiCount < totalEmojiLimit) {
        emojiCount++;
        return `${getRandomEmoji()} ${text}`;
      }
      return text;
    };
    
    // 예시 결과 생성 - 더 자연스러운 스타일로
    const exampleResult = `
      # ${addEmojiWithProbability(keyword + '에 대한 솔직한 이야기')}

오늘은 ${keyword}에 대해 제가 알고 있는 정보들을 솔직하게 풀어볼게요. ${getRandomEmoji()} 이 글을 쓰게 된 이유는 제가 ${keyword}에 대해 찾아보면서 정말 도움 됐던 내용들을 정리하고 싶었거든요!

## ${addEmojiWithProbability(keyword + '란 뭘까요?')}

${keyword}은(는) 요즘 정말 핫한 주제인데요, 주변에서도 많이들 물어보시더라고요. ${getRandomEmoji()} 간단히 말하자면 ${keyword}은(는) 우리 일상에 점점 더 많은 영향을 주고 있는 분야예요.

제가 ${keyword}에 관심을 갖게 된 건 약 3년 전이었어요. 우연히 유튜브에서 관련 영상을 보고 푹 빠져버렸죠. 그때부터 틈틈이 공부해왔는데, 여러분에게도 도움이 됐으면 해서 글로 정리해봤어요~

### ${addEmojiWithProbability('어떻게 시작되었을까요?')}

${keyword}의 역사는 생각보다 오래됐어요. ${getRandomEmoji()}

1950년대: 아주 기초적인 형태로 처음 등장
1980년대: 산업계에서 조금씩 활용되기 시작
2000년대: 인터넷 발달과 함께 대중화
2020년대: 완전히 새로운 모습으로 진화 중!

요즘엔 정말 어디서나 ${keyword} 이야기가 나오는 것 같아요. 특히 2023년부터는 성장세가 더 가파라졌어요. 제 주변에서도 관심 있어하는 사람들이 많아졌고요~

## ${addEmojiWithProbability(keyword + '의 장점')} 

${keyword}의 가장 좋은 점은 뭐니뭐니해도 이런 것들이에요:

1. **시간 절약**: 기존보다 30-50% 정도 시간을 아낄 수 있어요. 저도 처음엔 반신반의했는데, 직접 해보니 확실히 달라요!

2. **다양한 상황에 적용 가능**: 작은 취미부터 대기업 시스템까지... 정말 어디든 활용할 수 있어요. ${getRandomEmoji()} 저는 주로 개인 프로젝트에 쓰고 있는데 정말 편해요.

3. **진입장벽이 낮아요**: 전문지식 없이도 시작할 수 있어요. 요즘은 좋은 입문서도 많고, 유튜브에도 친절한 강의가 많아서 배우기 쉬워요.

4. **비용 효율적**: 초기 투자 비용이 있긴 하지만, 장기적으로 보면 정말 이득이에요. 제 경우엔 6개월 만에 원금 회수했어요. ${getRandomEmoji()}

## ${addEmojiWithProbability('제가 직접 해본 ' + keyword + ' 활용법')}

제가 실제로 ${keyword}을(를) 활용했던 방법들을 공유해드릴게요!

### 1. 기본적인 방법

처음 시작하시는 분들에게 추천하는 방법이에요:

- 목표를 확실히 정하기 (저는 처음에 목표 설정을 대충했다가 헤맸어요...)
- 필요한 것들 미리 체크하기
- 기초 설정에 시간 투자하기 (이게 진짜 중요해요!)
- 작은 거부터 테스트하면서 시작하기

처음부터 너무 큰 걸 시도하면 좌절할 수 있어요. 저도 그랬거든요... ${getRandomEmoji()} 작은 거부터 차근차근 해보세요!

### 2. 조금 더 깊이 들어가기

어느 정도 익숙해지셨다면 이런 것도 시도해보세요:

- 자동화 루틴 만들기 (이게 진짜 꿀팁이에요~)
- 데이터 분석 활용하기
- 다른 도구들과 연결해서 사용하기
- 성능 튜닝하기

제가 처음 자동화를 적용했을 때 정말 놀랐어요. 매일 1-2시간씩 절약되는 거 실감했거든요! ${getRandomEmoji()}

### 3. 색다른 아이디어

남들과 다르게 활용하면 더 큰 효과를 볼 수 있어요:

- 전혀 다른 분야와 접목해보기
- 예술/문화 영역에 적용해보기
- 교육에 활용하기
- 지속가능한 모델 구축하기

제가 취미로 하는 그림 그리기에 ${keyword} 개념을 접목해봤는데, 생각보다 재밌는 결과가 나왔어요. 생각지도 못한 분야에서 빛을 발하더라고요! ${getRandomEmoji()}

## ${addEmojiWithProbability('실제 성공 사례들')}

### A씨의 이야기

제 친구 A는 작은 카페를 운영하는데, ${keyword}을(를) 도입한 후 매출이 42% 늘었대요. 처음엔 반신반의했지만, 꾸준히 6개월 정도 적용했더니 확실한 차이가 났다고 해요. 특히 단골손님이 확실히 늘었다고 하더라고요! ${getRandomEmoji()}

### B씨의 경우

또 다른 지인 B는 프리랜서로 일하는데, ${keyword}을(를) 활용해서 작업 시간을 40% 단축했대요. 덕분에 더 많은 프로젝트를 진행할 수 있게 됐고, 수입도 크게 늘었다고 해요. 요즘은 저에게도 계속 도입하라고 추천하고 있어요~ ${getRandomEmoji()}

## ${addEmojiWithProbability('앞으로의 전망')}

${keyword}의 미래는 정말 밝아 보여요. 앞으로 이런 변화가 예상돼요:

- AI와 더 깊게 연결될 거예요 (이미 조금씩 보이고 있어요)
- 보안이 더 강화될 거예요
- 사용자 경험이 더 편리해질 거예요
- 국제 표준이 생길 수도 있을 것 같아요

전문가들 말로는 2030년까지 ${keyword} 시장이 지금의 3배는 될 거라고 해요. 지금 시작하면 정말 좋은 타이밍인 것 같아요! ${getRandomEmoji()}

## ${addEmojiWithProbability('자주 묻는 질문들')}

### Q: ${keyword} 입문자는 뭐부터 시작해야 할까요?
A: 기초 지식부터 쌓는 걸 추천해요! 유튜브에 좋은 입문 영상이 많으니 찾아보세요. 저도 그렇게 시작했어요. 처음엔 이론보다 실습이 중요해요. 작은 프로젝트로 시작해보세요! ${getRandomEmoji()}

### Q: 어떤 분야에 가장 효과적인가요?
A: 정말 다양한 분야에 적용할 수 있어요. IT, 마케팅, 교육, 의료 분야에서 특히 활발해요. 하지만 사실 어떤 분야든 창의적으로 접근하면 활용할 수 있어요. 저는 취미 분야에도 적용해서 좋은 결과를 봤어요!

### Q: 비용이 많이 들까요?
A: 초기 비용은 있지만, 장기적으로 보면 정말 이득이에요. 요즘은 무료로 시작할 수 있는 도구들도 많아요. 저는 무료 버전으로 시작해서 효과를 본 다음에 유료로 업그레이드했어요. ${getRandomEmoji()}

### Q: 혼자 배우기 어렵지 않을까요?
A: 생각보다 독학하기 좋은 분야예요! 온라인 커뮤니티도 활발하고, 자료도 많아요. 저도 독학했는데, 질문할 곳만 잘 찾아두면 충분히 가능해요. 요즘은 한국어 자료도 많이 늘어서 더 배우기 쉬워졌어요~

### Q: 어디서 더 배울 수 있을까요?
A: 유데미, 코세라 같은 플랫폼에 좋은 강의가 많아요. 국내 사이트로는 인프런이나 클래스101도 추천해요. 저는 책 몇 권과 유튜브로 시작해서 나중에 온라인 강의로 심화학습했어요. ${getRandomEmoji()}

${keyword}에 대해 더 알고 싶으시면 언제든 댓글 남겨주세요! 제가 아는 한 도움드릴게요~ 이 글이 도움 되셨다면 구독과 좋아요도 부탁드려요! ${getRandomEmoji()} 다음에 더 유익한 내용으로 찾아올게요~
`;
      
      return exampleResult;
  };

  // 콘텐츠에 이미지를 삽입하는 함수
  const insertImagesIntoContent = (content, imageLinks) => {
    if (!imageLinks || imageLinks.length === 0) {
      return content;
    }

    // 콘텐츠를 문단으로 분리
    const paragraphs = content.split('\n\n');
    
    // 이미지를 몇 개의 문단마다 삽입할지 계산
    const insertInterval = Math.max(2, Math.floor(paragraphs.length / (imageLinks.length + 1)));
    
    // 이미지 캡션 생성 함수
    const generateImageCaption = (index) => {
      const captions = [
        `${keyword}에 관한 이미지입니다.`,
        `${keyword}을(를) 시각적으로 보여주는 참고자료입니다.`,
        `${keyword}의 실제 적용 사례를 보여주는 이미지입니다.`,
        `${keyword}에 대한 이해를 돕는 시각자료입니다.`,
        `${keyword}와 관련된 중요한 시각적 정보입니다.`
      ];
      return captions[index % captions.length];
    };
    
    // 이미지 삽입
    let imageIndex = 0;
    const resultParagraphs = [];
    
    for (let i = 0; i < paragraphs.length; i++) {
      resultParagraphs.push(paragraphs[i]);
      
      // 적절한 간격으로 이미지 삽입 (첫 두 문단 이후부터)
      if (i > 1 && i % insertInterval === 0 && imageIndex < imageLinks.length) {
        const imgMarkdown = `\n<p><img src="${imageLinks[imageIndex]}" alt="${keyword} 이미지 ${imageIndex + 1}" class="content-image" /></p>\n<p><em>${generateImageCaption(imageIndex)}</em></p>\n`;
        resultParagraphs.push(imgMarkdown);
        imageIndex++;
      }
    }
    
    // 남은 이미지가 있으면 마지막에 추가
    while (imageIndex < imageLinks.length) {
      const imgMarkdown = `\n<p><img src="${imageLinks[imageIndex]}" alt="${keyword} 이미지 ${imageIndex + 1}" class="content-image" /></p>\n<p><em>${generateImageCaption(imageIndex)}</em></p>\n`;
      resultParagraphs.push(imgMarkdown);
      imageIndex++;
    }
    
    return resultParagraphs.join('\n\n');
  };

  // 앵커 텍스트로 사용할 다양한 텍스트 옵션들
  const anchorTextOptions = [
    "관련 자세한 정보",
    "더 알아보기",
    "참고자료",
    "클릭하여 상세정보 확인",
    "전문가 의견 보기",
    "추천 읽을거리",
    "여기에서 더 보기",
    "관련 통계 확인",
    "사례 연구 보기",
    "최신 트렌드 확인",
    "실제 적용 사례",
    "성공 전략 살펴보기",
    "전문가 팁 확인하기",
    "유용한 팁 모음",
    "흥미로운 통계 보기"
  ];

  // 콘텐츠에 링크를 삽입하는 함수
  const insertLinksIntoContent = (content, links) => {
    if (!links || links.length === 0) {
      return content;
    }
    
    let result = content;
    const linkWords = [...keyword.split(' ')];
    
    // 키워드와 관련된 단어들에 링크 추가
    links.forEach((link, index) => {
      // 유효한 URL인지 확인 및 문자열로 변환
      if (!link) return; // 링크가 없는 경우 스킵
      
      let url = String(link); // 문자열로 변환하여 startsWith 메서드 사용 가능하게 함
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      
      // 키워드에서 랜덤으로 단어 선택
      const word = linkWords[index % linkWords.length];
      if (!word) return;
      
      // 랜덤한 단어 선택 (너무 짧은 단어는 피함)
      const safeWord = word.length > 2 ? word : keyword;
      
      // 다양한 앵커 텍스트 형식 생성
      const formatOptions = [
        safeWord,
        `${safeWord}에 대해 ${anchorTextOptions[Math.floor(Math.random() * anchorTextOptions.length)]}`,
        `${safeWord} ${anchorTextOptions[Math.floor(Math.random() * anchorTextOptions.length)]}`,
        `${anchorTextOptions[Math.floor(Math.random() * anchorTextOptions.length)]} - ${safeWord}`,
        anchorTextOptions[Math.floor(Math.random() * anchorTextOptions.length)]
      ];
      
      const anchorText = formatOptions[Math.floor(Math.random() * formatOptions.length)];
      
      // HTML 앵커 태그 생성 (새 창에서 열림)
      const linkHtml = `<a href="${url}" target="_blank" rel="noopener noreferrer">${anchorText}</a>`;
      
      // 콘텐츠에서 단어를 찾아 링크로 교체 (첫 번째 발견된 단어만)
      const regex = new RegExp(`\\b${safeWord}\\b`, 'i');
      if (regex.test(result)) {
        result = result.replace(regex, linkHtml);
      } else {
        // 단어를 찾지 못한 경우, 무작위 위치에 추가
        const paragraphs = result.split('\n\n');
        if (paragraphs.length > 3) {
          // 첫 단락과 마지막 단락을 제외한 무작위 위치 선택
          const randomParagraphIndex = Math.floor(Math.random() * (paragraphs.length - 3)) + 1;
          const paragraph = paragraphs[randomParagraphIndex];
          
          // 문단 내 무작위 위치에 삽입 (문장 끝에)
          const sentences = paragraph.split('.');
          if (sentences.length > 1) {
            const randomSentenceIndex = Math.floor(Math.random() * (sentences.length - 1));
            sentences[randomSentenceIndex] += `. ${linkHtml}`;
            paragraphs[randomParagraphIndex] = sentences.join('.');
          } else {
            // 문장이 하나뿐이면 끝에 추가
            paragraphs[randomParagraphIndex] += ` ${linkHtml}`;
          }
          
          result = paragraphs.join('\n\n');
        } else {
          // 단락이 적으면 마지막 단락에 추가
          if (paragraphs.length > 0) {
            paragraphs[paragraphs.length - 1] += ` ${linkHtml}`;
            result = paragraphs.join('\n\n');
          }
        }
      }
    });
    
    return result;
  };

  // 가독성 점수 계산 함수
  const calculateReadabilityScore = (text) => {
    if (!text) return null;
    
    // 문장 및 단어 분석
    const sentences = text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0);
    const paragraphs = text.split('\n\n').filter(paragraph => paragraph.trim().length > 0);
    const words = text.split(/\s+/).filter(word => word.trim().length > 0);
    
    const sentenceCount = sentences.length;
    const wordCount = words.length;
    const charCount = text.replace(/\s+/g, '').length;
    const paragraphCount = paragraphs.length;
    
    // 기본 측정값
    const averageSentenceLength = wordCount / sentenceCount;
    const averageWordLength = charCount / wordCount;
    
    // 가독성 점수 계산 (Flesch-Kincaid 읽기 용이성 점수 변형)
    // 점수가 높을수록 읽기 쉬움 (0-100)
    let readabilityScore = 206.835 - (1.015 * averageSentenceLength) - (84.6 * (averageWordLength / 5));
    
    // 0-100 범위로 조정
    readabilityScore = Math.max(0, Math.min(100, readabilityScore));
    
    // 키워드 밀도 계산
    const keywordRegex = new RegExp(keyword, 'gi');
    const keywordMatches = text.match(keywordRegex) || [];
    const keywordDensity = (keywordMatches.length / wordCount) * 100;
    
    // 문장 길이 분포 분석
    const longSentences = sentences.filter(s => s.split(/\s+/).length > 20).length;
    const longSentencesPercentage = (longSentences / sentenceCount) * 100;
    
    // 읽기 난이도 계산 (낮을수록 좋음, 0-100)
    const readingDifficulty = Math.min(100, (averageSentenceLength * 3 + longSentencesPercentage) / 4);
    
    // 개선 제안 생성
    const suggestions = [];
    
    if (averageSentenceLength > 15) {
      suggestions.push("문장의 평균 길이가 너무 깁니다. 더 짧은 문장으로 나누는 것이 좋습니다.");
    }
    
    if (longSentencesPercentage > 20) {
      suggestions.push(`문장의 ${longSentencesPercentage.toFixed(1)}%가 너무 깁니다. 긴 문장을 더 작은 단위로 나누세요.`);
    }
    
    if (paragraphs.length > 0 && wordCount / paragraphs.length > 100) {
      suggestions.push("문단이 너무 깁니다. 더 작은 문단으로 분리하세요.");
    }
    
    if (keywordDensity < 1) {
      suggestions.push("키워드 밀도가 낮습니다. 주요 키워드를 자연스럽게 더 많이 사용하세요.");
    } else if (keywordDensity > 5) {
      suggestions.push("키워드 밀도가 너무 높습니다. 자연스러운 글쓰기를 위해 키워드 사용을 줄이세요.");
    }
    
    // 세부 정보 저장
    setReadabilityDetails({
      sentenceLength: averageSentenceLength.toFixed(1),
      paragraphCount: paragraphCount,
      readingDifficulty: readingDifficulty.toFixed(1),
      keywordDensity: keywordDensity.toFixed(2),
      suggestions: suggestions.length > 0 ? suggestions : ["콘텐츠가 가독성 측면에서 잘 최적화되어 있습니다."]
    });
    
    return readabilityScore;
  };

  // 결과 콘텐츠 복사 핸들러
  const handleCopyContent = () => {
    try {
      // 복사할 HTML 콘텐츠 준비
      const rawContent = insertImagesIntoContent(insertLinksIntoContent(result, links), imageLinks);
      
      // 문단 사이에 명시적 간격 추가 (단순 줄바꿈이 아닌 완전한 문단 구분)
      const contentWithParagraphs = rawContent
        .split('\n\n')
        .map(paragraph => {
          // 이미 HTML 태그가 있는 경우(이미지, 링크 등) 건너뛰기
          if (paragraph.trim().startsWith('<') && paragraph.includes('>')) {
            return paragraph;
          }
          // 일반 텍스트인 경우 <p> 태그로 감싸기
          if (paragraph.trim()) {
            return `<p>${paragraph.trim()}</p>`;
          }
          return '';
        })
        .filter(Boolean)
        .join('\n\n');
      
      // 워드프레스 호환성을 위한 스타일 추가
      const styledContent = `
        <div style="font-family: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.8; color: #333; font-size: 16px;">
          <style>
            p { margin-bottom: 1.5em !important; line-height: 1.8 !important; display: block !important; }
            h1, h2, h3, h4, h5, h6 { margin-top: 1.5em !important; margin-bottom: 0.8em !important; line-height: 1.4 !important; display: block !important; }
            h1 { font-size: 26px !important; color: #333 !important; }
            h2 { font-size: 22px !important; color: #444 !important; }
            h3 { font-size: 20px !important; color: #555 !important; }
            ul, ol { margin-left: 20px !important; margin-bottom: 1.5em !important; display: block !important; }
            li { margin-bottom: 0.8em !important; display: list-item !important; }
            img { max-width: 100% !important; height: auto !important; display: block !important; margin: 15px 0 !important; }
            a { color: #3b82f6 !important; text-decoration: none !important; }
            blockquote { border-left: 4px solid #ddd !important; padding: 0.8em 1em !important; margin: 1.2em 0 !important; background-color: #f9f9f9 !important; display: block !important; }
            br { display: block !important; content: "" !important; margin-top: 0.8em !important; }
            div, section { margin-bottom: 1em !important; }
            * { white-space: normal !important; }
          </style>
          ${contentWithParagraphs}
        </div>
      `;

      // 텍스트 버전 준비 (일반 텍스트로 붙여넣기할 경우 대비)
      const plainTextVersion = rawContent
        .split('\n\n')
        .map(paragraph => paragraph.trim())
        .filter(Boolean)
        .join('\n\n\n'); // 문단 사이 공백 추가

      // 이미지가 포함된 HTML을 클립보드에 복사
      const htmlType = "text/html";
      const textType = "text/plain";
      
      // 두 가지 형식 모두 클립보드에 저장
      const htmlBlob = new Blob([styledContent], { type: htmlType });
      const textBlob = new Blob([plainTextVersion], { type: textType });
      
      const data = [
        new ClipboardItem({
          [htmlType]: htmlBlob,
          [textType]: textBlob
        })
      ];

      // clipboard API 사용
      navigator.clipboard.write(data)
        .then(() => {
          setSnackbarMessage("콘텐츠가 클립보드에 복사되었습니다.");
          setShowSnackbar(true);
          setTimeout(() => setShowSnackbar(false), 3000);
        })
        .catch(err => {
          console.error("HTML 복사 실패, 텍스트 모드로 시도합니다:", err);
          // 대체 방법으로 텍스트 복사 시도
          fallbackCopyTextOnly(plainTextVersion);
        });
    } catch (error) {
      console.error("이미지 복사 오류:", error);
      // 대체 방법으로 텍스트 복사 시도
      fallbackCopyTextOnly();
    }
  };

  // 텍스트만 복사하는 대체 함수
  const fallbackCopyTextOnly = (textContent) => {
    try {
      let content = textContent;
      
      // 텍스트 콘텐츠가 전달되지 않은 경우 생성
      if (!content) {
        const rawContent = insertImagesIntoContent(insertLinksIntoContent(result, links), imageLinks);
        // 태그 제거 및 문단 사이 공백 추가
        const tempElement = document.createElement('div');
        tempElement.innerHTML = rawContent;
        content = tempElement.innerText || tempElement.textContent;
        
        // 문단 구분 개선
        content = content
          .split('\n')
          .map(line => line.trim())
          .filter(Boolean)
          .join('\n\n');
      }
      
      navigator.clipboard.writeText(content)
        .then(() => {
          setSnackbarMessage("콘텐츠가 텍스트로만 복사되었습니다 (이미지 제외)");
          setShowSnackbar(true);
          setTimeout(() => setShowSnackbar(false), 3000);
        })
        .catch(err => {
          console.error("텍스트 복사 실패:", err);
          alert("콘텐츠 복사 중 오류가 발생했습니다.");
        });
    } catch (error) {
      console.error("텍스트 복사 오류:", error);
      alert("콘텐츠 복사 중 오류가 발생했습니다.");
    }
  };

  // 결과 콘텐츠 저장 핸들러
  const handleSaveContent = () => {
    const tempElement = document.createElement('div');
    tempElement.innerHTML = result;
    
    // HTML 태그 제거하고 순수 텍스트만 추출
    const plainText = tempElement.textContent || tempElement.innerText || "";
    
    const blob = new Blob([plainText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${keyword}-content.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('콘텐츠가 저장되었습니다.');
  };

  // 이미지 업로드 핸들러
  const handleImageUpload = (event) => {
    // VIP 회원 체크
    const currentUser = localStorage.getItem('smart_content_current_user');
    if (currentUser) {
      const users = JSON.parse(localStorage.getItem('smart_content_users') || '[]');
      const user = users.find(u => u.username === currentUser);
      
      if (!user || user.membershipType !== 'vip') {
        alert('승인된 VIP 회원만 이미지를 추가할 수 있습니다.\n이미지를 추가하면 SEO 최적화에 도움이 됩니다!\nVIP 회원으로 업그레이드하시면 더 많은 기능을 이용하실 수 있습니다.');
        setShowVipModal(true);
        // 파일 선택 대화상자 초기화
        event.target.value = '';
        return;
      }
    } else {
      alert('로그인 후 이용해주세요.');
      setShowLoginModal(true);
      event.target.value = '';
      return;
    }
    
    const files = Array.from(event.target.files);
    if (files.length > 0) {
      // 최대 5개까지만 허용
      const selectedFiles = files.slice(0, 5);
      setImages(prev => {
        const combined = [...prev, ...selectedFiles];
        return combined.slice(0, 5); // 최대 5개로 제한
      });
    }
  };
  
  // 이미지 제거 핸들러
  const handleRemoveImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // 로그인 함수
  const handleLogin = () => {
    setAuthError('');
    
    if (!username || !password) {
      setAuthError('아이디와 비밀번호를 모두 입력해주세요');
      return;
    }
    
    // 사용자 정보 확인 - 대소문자 구분 없이 사용자명 비교
    const users = JSON.parse(localStorage.getItem('smart_content_users') || '[]');
    const user = users.find(u => 
      u.username.toLowerCase() === username.toLowerCase() && 
      u.password === password
    );
    
    if (!user) {
      setAuthError('아이디 또는 비밀번호가 올바르지 않습니다');
      return;
    }
    
    // 로그인 성공
    localStorage.setItem('smart_content_current_user', user.username); // 정확한 대소문자 사용
    setIsLoggedIn(true);
    setShowLoginModal(false);
    
    // VIP 상태 확인 및 설정
    if (user.membershipType === 'vip' && user.vipStatus === 'approved') {
      console.log('로그인: 사용자는 VIP 회원입니다.');
      setIsVip(true);
    } else {
      console.log('로그인: 사용자는 일반 회원입니다.');
      setIsVip(false);
    }
    
    setAuthError("");
  };
  
  // 회원가입 함수
  const handleRegister = () => {
    setAuthError('');
    
    if (!username || !password) {
      setAuthError('아이디와 비밀번호를 모두 입력해주세요');
      return;
    }
    
    if (password !== confirmPassword) {
      setAuthError('비밀번호가 일치하지 않습니다');
      return;
    }
    
    if (username.length < 3) {
      setAuthError('아이디는 3자 이상이어야 합니다');
      return;
    }
    
    if (password.length < 4) {
      setAuthError('비밀번호는 4자 이상이어야 합니다');
      return;
    }
    
    // 로컬 스토리지에서 사용자 목록 가져오기
    const users = JSON.parse(localStorage.getItem('smart_content_users') || '[]');
    
    // 이미 존재하는 아이디인지 확인
    if (users.some(u => u.username === username)) {
      setAuthError('이미 사용 중인 아이디입니다');
      return;
    }
    
    // 새 사용자 생성
    const newUser = {
      id: Date.now().toString(),
      username,
      password,
      membershipType: 'regular',
      dailyUsageCount: 0,
      lastUsageDate: null,
      createdAt: new Date().toISOString()
    };
    
    // 사용자 저장
    users.push(newUser);
    localStorage.setItem('smart_content_users', JSON.stringify(users));
    
    // 자동 로그인
    localStorage.setItem('smart_content_current_user', username);
    setIsLoggedIn(true);
    setShowRegisterModal(false);
    
    // 입력 필드 초기화
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    
    alert('회원가입이 완료되었습니다!');
  };
  
  // 로그아웃 함수
  const handleLogout = () => {
    localStorage.removeItem('smart_content_current_user');
    setIsLoggedIn(false);
  };

  // VIP 회원 여부 확인 함수
  const checkVipStatus = () => {
    const currentUser = localStorage.getItem('smart_content_current_user');
    if (currentUser) {
      const users = JSON.parse(localStorage.getItem('smart_content_users') || '[]');
      // 대소문자 구분 없이 사용자 찾기
      const user = users.find(u => u.username.toLowerCase() === currentUser.toLowerCase());
      
      const isUserVip = user && user.membershipType === 'vip' && user.vipStatus === 'approved';
      console.log('VIP 상태 체크 결과:', isUserVip, user);
      
      return isUserVip;
    }
    return false;
  };

  // VIP 회원 신청 정보 저장 함수
  const saveVipRequestInfo = (depositName) => {
    const currentUser = localStorage.getItem('smart_content_current_user');
    if (currentUser) {
      const users = JSON.parse(localStorage.getItem('smart_content_users') || '[]');
      const userIndex = users.findIndex(u => u.username === currentUser);
      
      if (userIndex >= 0) {
        users[userIndex] = {
          ...users[userIndex],
          vipRequest: {
            status: 'pending',
            depositName: depositName,
            requestDate: new Date().toISOString()
          }
        };
        
        localStorage.setItem('smart_content_users', JSON.stringify(users));
      }
    }
  };

  // VIP 회원 신청 승인 함수
  const approveVipRequest = (username) => {
    const users = JSON.parse(localStorage.getItem('smart_content_users') || '[]');
    const userIndex = users.findIndex(u => u.username === username);
    
    if (userIndex >= 0) {
      users[userIndex] = {
        ...users[userIndex],
        vipStatus: 'approved',
        vipRequest: {
          ...users[userIndex].vipRequest,
          status: 'approved'
        }
      };
      
      localStorage.setItem('smart_content_users', JSON.stringify(users));
    }
  };

  // VIP 회원 신청 거절 함수
  const rejectVipRequest = (username) => {
    const users = JSON.parse(localStorage.getItem('smart_content_users') || '[]');
    const userIndex = users.findIndex(u => u.username === username);
    
    if (userIndex >= 0) {
      users[userIndex] = {
        ...users[userIndex],
        vipStatus: 'rejected',
        vipRequest: {
          ...users[userIndex].vipRequest,
          status: 'rejected'
        }
      };
      
      localStorage.setItem('smart_content_users', JSON.stringify(users));
    }
  };

  // 링크 추가 함수
  const addLink = () => {
    try {
      if (!link || !currentLinkKeyword) {
        alert("링크와 키워드를 모두 입력해주세요.");
        return;
      }
      
      // URL 자동 포맷팅 (http:// 또는 https:// 없으면 추가)
      let formattedLink = link;
      if (!formattedLink.startsWith('http://') && !formattedLink.startsWith('https://')) {
        formattedLink = 'https://' + formattedLink;
      }
      
      const newLink = {
        url: formattedLink,
        keyword: currentLinkKeyword
      };
      
      // 링크 추가 및 상태 업데이트
      const updatedLinks = [...links, newLink];
      setLinks(updatedLinks);
      setLink("");
      setCurrentLinkKeyword("");
      
      // 링크를 로컬 스토리지에 자동 저장
      saveLinksToLocalStorage(updatedLinks);
      
      // 스낵바 표시
      setSnackbarMessage("링크가 추가되었습니다.");
      setShowSnackbar(true);
      setTimeout(() => setShowSnackbar(false), 3000);
    } catch (error) {
      console.error("링크 추가 오류:", error);
      alert("링크 추가 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
  };
  
  // 링크 삭제 함수
  const removeLink = (index) => {
    const updatedLinks = [...links];
    updatedLinks.splice(index, 1);
    setLinks(updatedLinks);
    
    // 링크를 로컬 스토리지에 저장
    saveLinksToLocalStorage(updatedLinks);
    
    // 스낵바 표시
    setSnackbarMessage("링크가 삭제되었습니다.");
    setShowSnackbar(true);
    setTimeout(() => setShowSnackbar(false), 3000);
  };
  
  // 링크를 로컬 스토리지에 저장하는 함수
  const saveLinksToLocalStorage = (updatedLinks) => {
    const currentUser = localStorage.getItem('smart_content_current_user');
    if (!currentUser) return;
    
    const users = JSON.parse(localStorage.getItem('smart_content_users') || '[]');
    const userIndex = users.findIndex(u => u.username === currentUser);
    
    if (userIndex >= 0) {
      users[userIndex] = {
        ...users[userIndex],
        savedLinks: updatedLinks
      };
      
      localStorage.setItem('smart_content_users', JSON.stringify(users));
    }
  };
  
  // 키워드를 과거 사용 키워드에 저장하는 함수
  const saveKeywordToHistory = (newKeyword) => {
    const currentUser = localStorage.getItem('smart_content_current_user');
    if (!currentUser) return;
    
    const users = JSON.parse(localStorage.getItem('smart_content_users') || '[]');
    const userIndex = users.findIndex(u => u.username === currentUser);
    
    if (userIndex >= 0) {
      // 이전 키워드 목록 가져오기
      const previousKeywords = users[userIndex].previousKeywords || [];
      
      // 이미 있으면 제거
      const filteredKeywords = previousKeywords.filter(k => k !== newKeyword);
      
      // 새로운 키워드를 맨 앞에 추가 (최대 10개만 유지)
      const updatedKeywords = [newKeyword, ...filteredKeywords].slice(0, 10);
      
      // 사용자 데이터 업데이트
      users[userIndex] = {
        ...users[userIndex],
        previousKeywords: updatedKeywords
      };
      
      // 로컬 스토리지에 저장
      localStorage.setItem('smart_content_users', JSON.stringify(users));
      
      // 상태 업데이트
      setPreviousKeywords(updatedKeywords);
      
      // 추천 키워드 업데이트
      setTimeout(() => generateRecentKeywordRecommendations(), 500);
    }
  };

  // 키워드 입력시 유사 키워드 생성 
  useEffect(() => {
    if (keyword && keyword.length > 1) {  // 최소 2글자 이상 입력되었을 때
      generateSimilarKeywords(keyword);
    }
  }, [keyword]);

  // 입력된 키워드 기반으로 유사 키워드 생성 (3개)
  const generateSimilarKeywords = (inputKeyword) => {
    if (!inputKeyword) return;
    
    // 다양한 추천 키워드 접미사/접두사 패턴
    const patterns = [
      { prefix: "", suffix: " 추천" },
      { prefix: "", suffix: " 가이드" },
      { prefix: "", suffix: " 방법" },
      { prefix: "", suffix: " 리뷰" },
      { prefix: "", suffix: " 순위" },
      { prefix: "", suffix: " 비교" },
      { prefix: "최신 ", suffix: "" },
      { prefix: "인기 ", suffix: "" },
      { prefix: "추천 ", suffix: "" },
      { prefix: "", suffix: " 2025" },
      { prefix: "", suffix: " 트렌드" },
      { prefix: "", suffix: " 사용법" },
      { prefix: "", suffix: " 후기" },
    ];
    
    // 랜덤하게 3개의 패턴 선택
    const shuffledPatterns = [...patterns].sort(() => 0.5 - Math.random());
    const selectedPatterns = shuffledPatterns.slice(0, 3);
    
    // 선택된 패턴으로 키워드 생성
    const newSimilarKeywords = selectedPatterns.map(pattern => 
      `${pattern.prefix}${inputKeyword}${pattern.suffix}`
    );
    
    setSimilarKeywords(newSimilarKeywords);
  };

  return (
    <div className="app">
      <header className="header">
        <div className="logo">
          <span className="logo-dot">🟣</span>
          <span>워프스타 Content Creator v5</span>
        </div>
        <div className="header-info">
          <span>모바일 AI 콘텐츠 생성기</span>
        </div>
        {isLoggedIn ? (
          <div className="header-actions">
            {!isVip && (  // VIP가 아닌 경우만 VIP 신청 버튼 표시
              <button 
                className="vip-button"
                onClick={() => setShowVipModal(true)}
              >
                VIP 신청
              </button>
            )}
            <button 
              className="login-button"
              onClick={handleLogout}
            >
              로그아웃
            </button>
          </div>
        ) : (
          <div className="header-actions">
            <button 
              className="login-button"
              onClick={() => setShowLoginModal(true)}
            >
              로그인
            </button>
            <button 
              className="register-button"
              onClick={() => setShowRegisterModal(true)}
            >
              회원가입
            </button>
          </div>
        )}
      </header>

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
        <div className="promo-section">
          <h1>
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

        {/* 콘텐츠 생성 섹션 */}
        <div className="content-section">
          <h2>콘텐츠 생성</h2>
          
          <div className="keyword-input">
            {isLoggedIn && (
              <div className="todays-keyword">
                <h3>오늘의 추천 키워드</h3>
                <div className="keyword-card" onClick={applyTodaysKeyword}>
                  {todaysKeyword}
                </div>
              </div>
            )}
            
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="키워드를 입력하세요 (예: 디지털 마케팅, 건강 식품, 여행 팁)"
            />
            <div className="keyword-buttons">
              <button 
                className="keyword-analyze-btn"
                onClick={() => {
                  // VIP 회원 체크
                  const currentUser = localStorage.getItem('smart_content_current_user');
                  if (currentUser) {
                    const users = JSON.parse(localStorage.getItem('smart_content_users') || '[]');
                    const user = users.find(u => u.username === currentUser);
                    
                    if (!user || user.membershipType !== 'vip' || user.vipStatus !== 'approved') {
                      alert('트렌드 키워드 분석은 VIP 회원 전용 기능입니다.\nVIP 회원으로 업그레이드하시면 더 많은 기능을 이용하실 수 있습니다.');
                      setShowVipModal(true);
                      return;
                    }
                    
                    // VIP 회원인 경우 트렌드 키워드 가져오기
                    fetchTrendingKeywords(keyword);
                  } else {
                    // 로그인 안 된 경우
                    alert('로그인 후 이용해주세요.');
                    setShowLoginModal(true);
                  }
                }}
                disabled={!keyword || isLoadingKeywords}
              >
                {isLoadingKeywords ? '로딩 중...' : '트렌드 키워드 보기 (VIP 전용)'}
              </button>
              <button 
                className="keyword-analyze-btn"
                onClick={() => {
                  // VIP 회원 체크
                  const currentUser = localStorage.getItem('smart_content_current_user');
                  if (currentUser) {
                    const users = JSON.parse(localStorage.getItem('smart_content_users') || '[]');
                    const user = users.find(u => u.username === currentUser);
                    
                    if (!user || user.membershipType !== 'vip' || user.vipStatus !== 'approved') {
                      alert('경쟁 키워드 분석은 VIP 회원 전용 기능입니다.\nVIP 회원으로 업그레이드하시면 더 많은 기능을 이용하실 수 있습니다.');
                      setShowVipModal(true);
                      return;
                    }
                    
                    // VIP 회원인 경우 경쟁 키워드 분석
                    analyzeCompetition(keyword);
                  } else {
                    // 로그인 안 된 경우
                    alert('로그인 후 이용해주세요.');
                    setShowLoginModal(true);
                  }
                }}
                disabled={!keyword || isLoadingKeywords}
              >
                {isLoadingKeywords ? '로딩 중...' : '경쟁 분석 (VIP 전용)'}
              </button>
            </div>
          </div>
          
          {/* 트렌드 키워드 제안 */}
          {showTrendingKeywords && trendingKeywords.length > 0 && (
            <div className="trending-keywords">
              <h4>트렌드 키워드 제안:</h4>
              <div className="keyword-chips">
                {trendingKeywords.map((trendKeyword, index) => (
                  <div key={index} className="keyword-chip"
                    onClick={() => setKeyword(trendKeyword)}
                  >
                    {trendKeyword}
                  </div>
                ))}
              </div>
              <button 
                className="close-trends-btn"
                onClick={() => setShowTrendingKeywords(false)}
              >
                닫기
              </button>
            </div>
          )}
          
          {/* 경쟁 키워드 분석 */}
          {showCompetitorAnalysis && competitorKeywords.length > 0 && (
            <div className="competitor-keywords">
              <h4>경쟁 키워드 분석:</h4>
              <div className="keyword-table">
                <table>
                  <thead>
                    <tr>
                      <th>키워드</th>
                      <th>난이도</th>
                      <th>검색량</th>
                      <th>CPC</th>
                      <th>선택</th>
                    </tr>
                  </thead>
                  <tbody>
                    {competitorKeywords.map((item, index) => (
                      <tr key={index}>
                        <td>{item.keyword}</td>
                        <td>
                          <span className={`difficulty ${item.difficulty === '낮음' ? 'low' : item.difficulty === '중간' ? 'medium' : 'high'}`}>
                            {item.difficulty}
                          </span>
                        </td>
                        <td>{item.volume}</td>
                        <td>{item.cpc}</td>
                        <td>
                          <button 
                            className="use-keyword-btn"
                            onClick={() => setKeyword(item.keyword)}
                          >
                            사용
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button 
                className="close-trends-btn"
                onClick={() => setShowCompetitorAnalysis(false)}
              >
                닫기
              </button>
            </div>
          )}
          
          {/* 추천 키워드 섹션 */}
          <div className="recommendation-section">
            <div className="recommendation-item">
              <button 
                className="recommendation-button" 
                onClick={applyTodaysKeyword} 
                title="오늘의 추천 키워드"
              >
                <span className="recommendation-icon">✨</span> 오늘의 키워드: {todaysKeyword}
              </button>
            </div>
            
            {/* 현재 입력 키워드 기반 추천 (최대 3개) */}
            {similarKeywords.length > 0 && (
              <div className="keyword-recommendations">
                <div className="recommended-keywords">
                  {similarKeywords.map((recKeyword, index) => (
                    <div className="recommendation-item" key={`similar-${index}`}>
                      <button 
                        className="recommendation-button" 
                        onClick={() => applyRecommendedKeyword(recKeyword)}
                      >
                        <span className="recommendation-icon">💡</span> {recKeyword}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="input-group">
            <label>링크 (추가를 꼭 눌러주세요)</label>
            <div className="link-input-container">
              <input 
                type="text" 
                placeholder="https://site.com"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                onClick={(e) => {
                  // VIP 회원 체크
                  const currentUser = localStorage.getItem('smart_content_current_user');
                  if (currentUser) {
                    const users = JSON.parse(localStorage.getItem('smart_content_users') || '[]');
                    const user = users.find(u => u.username === currentUser);
                    
                    if (!user || user.membershipType !== 'vip') {
                      e.preventDefault(); // 입력 방지
                      alert('링크 추가는 VIP 회원 전용 기능입니다!\nVIP 회원으로 업그레이드하시면 더 많은 콘텐츠 생성 기능을 사용하실 수 있습니다.');
                      setShowVipModal(true);
                      e.target.blur(); // 포커스 제거
                    }
                  }
                }}
              />
              <button 
                className="add-link-btn"
                onClick={addLink}
              >
                추가
              </button>
            </div>
          </div>
          
          <div className="input-group">
            <label>링크 키워드 (선택)</label>
            <input 
              type="text" 
              placeholder="링크 키워드를 입력하세요"
              value={currentLinkKeyword}
              onChange={(e) => setCurrentLinkKeyword(e.target.value)}
              onClick={(e) => {
                // VIP 회원 체크
                const currentUser = localStorage.getItem('smart_content_current_user');
                if (currentUser) {
                  const users = JSON.parse(localStorage.getItem('smart_content_users') || '[]');
                  const user = users.find(u => u.username === currentUser);
                  
                  if (!user || user.membershipType !== 'vip') {
                    e.preventDefault(); // 입력 방지
                    alert('링크 추가는 VIP 회원 전용 기능입니다!\nVIP 회원으로 업그레이드하시면 더 많은 콘텐츠 생성 기능을 사용하실 수 있습니다.');
                    setShowVipModal(true);
                    e.target.blur(); // 포커스 제거
                  }
                }
              }}
            />
          </div>
          
          {/* 추가된 링크와 키워드 목록 표시 */}
          {Array.isArray(links) && links.length > 0 && (
            <div className="added-links-container">
              <label>추가된 링크</label>
              <div className="added-links-list">
                {links.map((item, index) => (
                  <div key={index} className="added-link-item">
                    <span className="link-keyword">{item.keyword}</span>
                    <span className="link-url">{item.url}</span>
                    <button 
                      className="remove-link-btn"
                      onClick={() => removeLink(index)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
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
              <label className={contentType === '홈페이지' ? 'selected' : ''}>
                <input
                  type="radio"
                  name="contentType"
                  value="홈페이지"
                  checked={contentType === '홈페이지'}
                  onChange={() => setContentType('홈페이지')}
                />
                홈페이지
              </label>
            </div>
          </div>

          <div className="select-group">
            <label>글씨 스타일</label>
            <div className="style-grid">
              <label className={styleType === '정보형' ? 'selected' : ''}>
                <input
                  type="radio"
                  name="styleType"
                  value="정보형"
                  checked={styleType === '정보형'}
                  onChange={() => setStyleType('정보형')}
                />
                정보형
              </label>
              <label className={styleType === '후기형' ? 'selected' : ''}>
                <input
                  type="radio"
                  name="styleType"
                  value="후기형"
                  checked={styleType === '후기형'}
                  onChange={() => setStyleType('후기형')}
                />
                후기형
              </label>
              <label className={styleType === '비교형' ? 'selected' : ''}>
                <input
                  type="radio"
                  name="styleType"
                  value="비교형"
                  checked={styleType === '비교형'}
                  onChange={() => setStyleType('비교형')}
                />
                비교형
              </label>
              <label className={styleType === 'Q&A형' ? 'selected' : ''}>
                <input
                  type="radio"
                  name="styleType"
                  value="Q&A형"
                  checked={styleType === 'Q&A형'}
                  onChange={() => setStyleType('Q&A형')}
                />
                Q&A형
              </label>
              <label className={styleType === '하우투' ? 'selected' : ''}>
                <input
                  type="radio"
                  name="styleType"
                  value="하우투"
                  checked={styleType === '하우투'}
                  onChange={() => setStyleType('하우투')}
                />
                하우투
              </label>
              <label className={styleType === '체험기' ? 'selected' : ''}>
                <input
                  type="radio"
                  name="styleType"
                  value="체험기"
                  checked={styleType === '체험기'}
                  onChange={() => setStyleType('체험기')}
                />
                체험기
              </label>
              <label className={styleType === '클릭 유도' ? 'selected' : ''}>
                <input
                  type="radio"
                  name="styleType"
                  value="클릭 유도"
                  checked={styleType === '클릭 유도'}
                  onChange={() => setStyleType('클릭 유도')}
                />
                클릭 유도
              </label>
              <label className={styleType === '질문형' ? 'selected' : ''}>
                <input
                  type="radio"
                  name="styleType"
                  value="질문형"
                  checked={styleType === '질문형'}
                  onChange={() => setStyleType('질문형')}
                />
                질문형
              </label>
              <label className={styleType === '감성형' ? 'selected' : ''}>
                <input
                  type="radio"
                  name="styleType"
                  value="감성형"
                  checked={styleType === '감성형'}
                  onChange={() => setStyleType('감성형')}
                />
                감성형
              </label>
              <label className={styleType === '숫자 활용' ? 'selected' : ''}>
                <input
                  type="radio"
                  name="styleType"
                  value="숫자 활용"
                  checked={styleType === '숫자 활용'}
                  onChange={() => setStyleType('숫자 활용')}
                />
                숫자 활용
              </label>
            </div>
          </div>

          <div className="select-group">
            <label>헤드라인 스타일</label>
            <div className="style-grid">
              <label className={headlineStyle === '클릭 유도' ? 'selected' : ''}>
                <input
                  type="radio"
                  name="headlineStyle"
                  value="클릭 유도"
                  checked={headlineStyle === '클릭 유도'}
                  onChange={() => setHeadlineStyle('클릭 유도')}
                />
                클릭 유도
              </label>
              <label className={headlineStyle === '질문형' ? 'selected' : ''}>
                <input
                  type="radio"
                  name="headlineStyle"
                  value="질문형"
                  checked={headlineStyle === '질문형'}
                  onChange={() => setHeadlineStyle('질문형')}
                />
                질문형
              </label>
              <label className={headlineStyle === '감성형' ? 'selected' : ''}>
                <input
                  type="radio"
                  name="headlineStyle"
                  value="감성형"
                  checked={headlineStyle === '감성형'}
                  onChange={() => setHeadlineStyle('감성형')}
                />
                감성형
              </label>
              <label className={headlineStyle === '정보형' ? 'selected' : ''}>
                <input
                  type="radio"
                  name="headlineStyle"
                  value="정보형"
                  checked={headlineStyle === '정보형'}
                  onChange={() => setHeadlineStyle('정보형')}
                />
                정보형
              </label>
              <label className={headlineStyle === '숫자 활용' ? 'selected' : ''}>
                <input
                  type="radio"
                  name="headlineStyle"
                  value="숫자 활용"
                  checked={headlineStyle === '숫자 활용'}
                  onChange={() => setHeadlineStyle('숫자 활용')}
                />
                숫자 활용
              </label>
            </div>
          </div>

          <div className="select-group">
            <label>AI 작가 설정</label>
            <div className="style-grid">
              <label className={writingTone === '말투 튜닝' ? 'selected' : ''}>
                <input
                  type="radio"
                  name="writingTone"
                  value="말투 튜닝"
                  checked={writingTone === '말투 튜닝'}
                  onChange={() => setWritingTone('말투 튜닝')}
                />
                말투 튜닝
              </label>
              <label className={writingTone === '감성 보정' ? 'selected' : ''}>
                <input
                  type="radio"
                  name="writingTone"
                  value="감성 보정"
                  checked={writingTone === '감성 보정'}
                  onChange={() => setWritingTone('감성 보정')}
                />
                감성 보정
              </label>
              <label className={writingTone === '전문성 강화' ? 'selected' : ''}>
                <input
                  type="radio"
                  name="writingTone"
                  value="전문성 강화"
                  checked={writingTone === '전문성 강화'}
                  onChange={() => setWritingTone('전문성 강화')}
                />
                전문성 강화
              </label>
              <label className={writingTone === '요약' ? 'selected' : ''}>
                <input
                  type="radio"
                  name="writingTone"
                  value="요약"
                  checked={writingTone === '요약'}
                  onChange={() => setWritingTone('요약')}
                />
                요약
              </label>
            </div>
          </div>

          <div className="select-group">
            <label>이미지 업로드 (이미지는 3개등록 추천 , 이미지에 키워드 자동 등록 되서 seo에 적합하게 제작됩니다  )</label>
            <div className="image-upload-container">
              {isLoggedIn ? (() => {
                // VIP 회원 확인
                const currentUser = localStorage.getItem('smart_content_current_user');
                const users = JSON.parse(localStorage.getItem('smart_content_users') || '[]');
                const user = users.find(u => u.username === currentUser);
                const isApprovedVip = user && user.membershipType === 'vip' && user.vipStatus === 'approved';
                
                return isApprovedVip ? (
                  // 승인된 VIP 회원용 업로드 버튼
                  <label className="image-upload-button">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                    />
                    <span>이미지 선택</span>
                  </label>
                ) : (
                  // 일반 회원 또는 승인 대기 중인 VIP 회원용 버튼
                  <button 
                    className="image-upload-button vip-required-button"
                    onClick={() => {
                      alert('승인된 VIP 회원만 이미지를 추가할 수 있습니다.\n이미지를 추가하면 SEO 최적화에 도움이 됩니다!\nVIP 회원으로 업그레이드하시면 더 많은 기능을 이용하실 수 있습니다.');
                      setShowVipModal(true);
                    }}
                  >
                    <span>이미지 선택 (VIP 전용)</span>
                  </button>
                );
              })() : (
                // 로그인 안 된 경우
                <button 
                  className="image-upload-button vip-required-button"
                  onClick={() => {
                    alert('로그인 후 이용해주세요.');
                    setShowLoginModal(true);
                  }}
                >
                  <span>이미지 선택 (로그인 필요)</span>
                </button>
              )}
              
              <div className="image-preview-container">
                {images.map((img, index) => (
                  <div key={index} className="image-preview-item">
                    <img src={URL.createObjectURL(img)} alt={`미리보기 ${index}`} />
                    <button 
                      className="image-remove-button"
                      onClick={() => handleRemoveImage(index)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="select-group mobile-optimization">
            <label>모바일 최적화</label>
            <div className="toggle-wrapper">
              <label className="toggle-container">
                <input
                  type="checkbox"
                  checked={isMobileOptimized}
                  onChange={() => setIsMobileOptimized(!isMobileOptimized)}
                />
                <span className="toggle-slider"></span>
              </label>
              <span className="toggle-text">{isMobileOptimized ? '활성화됨' : '비활성화됨'}</span>
            </div>
            <small className="description-text">
              모바일 최적화를 활성화하면 모바일 기기에서 보기 좋은 콘텐츠가 생성됩니다. (짧은 문단, 적절한 이미지 크기, 터치 친화적 요소)
            </small>
          </div>

          <button className="generate-button" onClick={generateContent}>
            콘텐츠 생성하기
          </button>
        </div>

        {/* 왜 우리 서비스를 사용해야 하는가? */}
        <div className="why-us-section">
          <h2>스마트 콘텐츠 생성기의 특별함</h2>
          <div className="why-us-grid">
            <div className="why-us-item">
              <div className="why-us-icon">⚡</div>
              <h3>빠른 콘텐츠 생성</h3>
              <p>복잡한 리서치 없이 단 몇 분 만에 고품질 콘텐츠를 생성할 수 있습니다.</p>
            </div>
            <div className="why-us-item">
              <div className="why-us-icon">🔍</div>
              <h3>SEO 최적화</h3>
              <p>검색 엔진에서 더 높은 순위를 얻을 수 있도록 최적화된 콘텐츠를 제공합니다.</p>
            </div>
            <div className="why-us-item">
              <div className="why-us-icon">🌐</div>
              <h3>다양한 플랫폼 지원</h3>
              <p>블로그, 소셜 미디어 등 다양한 플랫폼에 맞춤 콘텐츠를 생성합니다.</p>
            </div>
            <div className="why-us-item">
              <div className="why-us-icon">🔒</div>
              <h3>100% AI 감지 회피</h3>
              <p>인간이 작성한 것처럼 자연스러운 콘텐츠로 AI 감지를 완벽하게 회피합니다.</p>
            </div>
          </div>
        </div>

        {/* 사용 사례 */}
        <div className="use-cases-section">
          <h2>스마트 콘텐츠 생성기 활용 사례</h2>
          <div className="use-cases-grid">
            <div className="use-case-item">
              <h3>블로거 및 콘텐츠 크리에이터</h3>
              <p>정기적인 콘텐츠 발행과 독자 참여도를 높이는 고품질 콘텐츠 생성</p>
            </div>
            <div className="use-case-item">
              <h3>마케팅 담당자</h3>
              <p>다양한 마케팅 채널을 위한 맞춤형 콘텐츠로 브랜드 인지도 향상</p>
            </div>
            <div className="use-case-item">
              <h3>소셜 미디어 매니저</h3>
              <p>각 플랫폼에 최적화된 참여도 높은 포스트 자동 생성</p>
            </div>
            <div className="use-case-item">
              <h3>온라인 쇼핑몰 운영자</h3>
              <p>제품 설명, 리뷰, 프로모션 텍스트를 빠르고 효과적으로 작성</p>
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="loading-overlay">
            <div className="loading-modal">
              <h2 className="loading-title">AI 포스팅 진행 중</h2>
              
              <div className="loading-steps">
                <div className={`loading-step ${loadingStep >= 1 ? 'active' : ''}`}>
                  <span className="step-number">1</span>
                  <span className="step-text">키워드 분석</span>
                </div>
                <div className="loading-step-line"></div>
                <div className={`loading-step ${loadingStep >= 2 ? 'active' : ''}`}>
                  <span className="step-number">2</span>
                  <span className="step-text">콘텐츠 생성</span>
                </div>
                <div className="loading-step-line"></div>
                <div className={`loading-step ${loadingStep >= 3 ? 'active' : ''}`}>
                  <span className="step-number">3</span>
                  <span className="step-text">이미지 추가</span>
                </div>
                <div className="loading-step-line"></div>
                <div className={`loading-step ${loadingStep >= 4 ? 'active' : ''}`}>
                  <span className="step-number">4</span>
                  <span className="step-text">완료</span>
                </div>
              </div>
              
              <div className="loading-spinner-container">
                <div className="loading-spinner">
                  <div className="spinner-inner"></div>
                </div>
              </div>
              
              <div className="loading-message">
                <h3>{loadingMessage}</h3>
              </div>
              
              <div className="loading-progress-bar-container">
                <div 
                  className="loading-progress-bar" 
                  style={{ width: `${loadingProgress}%` }}
                ></div>
              </div>
              
              <div className="loading-console">
                {loadingStep >= 1 && <p>{'>>'} 콘텐츠 업로드 중 . . .</p>}
                {loadingStep >= 2 && <p>{'>>'} 메타데이터 설정 중 . . .</p>}
                {loadingStep >= 3 && <p>{'>>'} 포스팅 완료!</p>}
              </div>
              
              <div className="loading-tip">
                <p>
                  {loadingTips[Math.floor(Math.random() * loadingTips.length)]}
                </p>
                <p className="loading-tip-percentage">
                  워드프레스 전 세계 웹사이트의 43%를 구동하고 있습니다.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {result && (
          <div className="result-section">
            <div className="result-tabs">
              <button 
                className={activeResultTab === "content" ? "active" : ""} 
                onClick={() => setActiveResultTab("content")}
              >
                콘텐츠
              </button>
              <button 
                className={activeResultTab === "headlines" ? "active" : ""} 
                onClick={() => setActiveResultTab("headlines")}
              >
                추천 헤드라인
              </button>
              <button 
                className={activeResultTab === "seo" ? "active" : ""} 
                onClick={() => setActiveResultTab("seo")}
              >
                SEO 분석
              </button>
              {checkVipStatus() && (
                <button 
                  className={activeResultTab === "readability" ? "active" : ""} 
                  onClick={() => setActiveResultTab("readability")}
                >
                  가독성 점수 (VIP 전용)
                </button>
              )}
            </div>
            
            {activeResultTab === "content" && (
              <>
                <div className="result-content" dangerouslySetInnerHTML={{ __html: insertImagesIntoContent(insertLinksIntoContent(result, links), imageLinks) }}></div>
                
                <div className="result-actions">
                  <button className="action-button copy-button" onClick={handleCopyContent}>
                    <span className="action-icon">📋</span>
                    복사하기
                  </button>
                  <button className="action-button" onClick={handleSaveContent}>
                    <span className="action-icon">💾</span>
                    저장하기
                  </button>
                  <button className="action-button">
                    <span className="action-icon">🔗</span>
                    공유하기
                  </button>
                </div>
              </>
            )}
            
            {activeResultTab === "headlines" && (
              <div className="headlines-content">
                <h3>추천 헤드라인</h3>
                {headlines.length > 0 ? (
                  <ul className="headline-list">
                    {headlines.map((headline, index) => (
                      <li key={index} className="headline-item">
                        <span className="headline-number">{index + 1}</span>
                        <span className="headline-text">{headline}</span>
                        <button 
                          className="headline-copy-btn"
                          onClick={() => {
                            navigator.clipboard.writeText(headline);
                            alert('헤드라인이 복사되었습니다.');
                          }}
                        >
                          복사
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="no-data-message">콘텐츠를 생성하면 추천 헤드라인이 표시됩니다.</p>
                )}
              </div>
            )}
            
            {activeResultTab === "seo" && (
              <div className="seo-content">
                <h3>SEO 분석</h3>
                {Object.keys(seoAnalysis).length > 0 ? (
                  <div className="seo-analysis">
                    <div className="seo-section">
                      <h4>주요 키워드</h4>
                      <div className="seo-tags">
                        {seoAnalysis.주요_키워드?.map((keyword, index) => (
                          <span key={index} className="seo-tag">{keyword}</span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="seo-section">
                      <h4>경쟁도</h4>
                      <p>{seoAnalysis.경쟁도}</p>
                    </div>
                    
                    <div className="seo-section">
                      <h4>검색 볼륨</h4>
                      <p>{seoAnalysis.검색_볼륨}</p>
                    </div>
                    
                    <div className="seo-section">
                      <h4>추천 태그</h4>
                      <div className="seo-tags">
                        {seoAnalysis.추천_태그?.map((tag, index) => (
                          <span key={index} className="seo-tag">{tag}</span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="seo-section">
                      <h4>키워드 트렌드</h4>
                      <p>{seoAnalysis.키워드_트렌드}</p>
                    </div>
                    
                    <div className="seo-section">
                      <h4>콘텐츠 전략</h4>
                      <ul className="strategy-list">
                        {seoAnalysis.콘텐츠_전략?.map((strategy, index) => (
                          <li key={index} className="strategy-item">{strategy}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <p className="no-data-message">콘텐츠를 생성하면 SEO 분석 결과가 표시됩니다.</p>
                )}
              </div>
            )}
            
            {activeResultTab === "readability" && (
              <div className="readability-content">
                <h3>가독성 점수</h3>
                {!checkVipStatus() ? (
                  <div className="vip-restriction-message">
                    <p>가독성 점수 분석은 VIP 회원 전용 기능입니다.</p>
                    <button className="vip-upgrade-btn" onClick={() => setShowVipModal(true)}>
                      VIP 멤버십 업그레이드
                    </button>
                  </div>
                ) : readabilityScore !== null ? (
                  <div className="readability-score-container">
                    <div className="readability-score">
                      <p>가독성 점수: {readabilityScore.toFixed(1)}</p>
                      <button 
                        className="readability-details-btn"
                        onClick={() => setShowReadabilityDetails(!showReadabilityDetails)}
                      >
                        {showReadabilityDetails ? '간략히 보기' : '자세히 보기'}
                      </button>
                    </div>
                    
                    <div className={`readability-meter ${
                      readabilityScore >= 70 ? 'readability-meter-good' : 
                      readabilityScore >= 50 ? 'readability-meter-average' : 
                      'readability-meter-poor'}`}
                    >
                      <div 
                        className="readability-meter-fill" 
                        style={{ width: `${readabilityScore}%` }}
                      ></div>
                    </div>
                    <div className="readability-meter-label">
                      <span>어려움</span>
                      <span>보통</span>
                      <span>쉬움</span>
                    </div>
                    
                    {showReadabilityDetails && (
                      <div className="readability-details">
                        <h4>가독성 세부 정보</h4>
                        <ul>
                          <li>
                            <strong>평균 문장 길이:</strong> {readabilityDetails.sentenceLength} 단어
                          </li>
                          <li>
                            <strong>문단 수:</strong> {readabilityDetails.paragraphCount} 개
                          </li>
                          <li>
                            <strong>읽기 난이도:</strong> {readabilityDetails.readingDifficulty}%
                            <div className="readability-meter readability-meter-poor">
                              <div 
                                className="readability-meter-fill" 
                                style={{ width: `${readabilityDetails.readingDifficulty}%` }}
                              ></div>
                            </div>
                          </li>
                          <li>
                            <strong>키워드 밀도:</strong> {readabilityDetails.keywordDensity}%
                            <div className={`readability-meter ${
                              readabilityDetails.keywordDensity >= 1 && readabilityDetails.keywordDensity <= 5 
                                ? 'readability-meter-good' 
                                : 'readability-meter-poor'}`}
                            >
                              <div 
                                className="readability-meter-fill" 
                                style={{ width: `${Math.min(readabilityDetails.keywordDensity * 10, 100)}%` }}
                              ></div>
                            </div>
                          </li>
                        </ul>
                        
                        <h4>개선 제안</h4>
                        <ul>
                          {readabilityDetails.suggestions.map((suggestion, index) => (
                            <li key={index}>{suggestion}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="no-data-message">콘텐츠를 생성하면 가독성 점수가 표시됩니다.</p>
                )}
              </div>
            )}
          </div>
        )}
      </main>
      
      {/* 로그인 모달 */}
      {showLoginModal && (
        <div className="modal-overlay">
          <div className="auth-modal">
            <div className="modal-header">
              <h2>로그인</h2>
              <button 
                className="close-button"
                onClick={() => setShowLoginModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              {authError && <div className="auth-error">{authError}</div>}
              
              <div className="form-group">
                <label htmlFor="username">아이디</label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="아이디"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="password">비밀번호</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호"
                />
              </div>
              
              <button 
                className="auth-button"
                onClick={handleLogin}
              >
                로그인
              </button>
              
              <div className="auth-links">
                <p>계정이 없으신가요? 
                  <a href="#" onClick={(e) => {
                    e.preventDefault();
                    setShowLoginModal(false);
                    setShowRegisterModal(true);
                  }}>회원가입</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 회원가입 모달 */}
      {showRegisterModal && (
        <div className="modal-overlay">
          <div className="auth-modal">
            <div className="modal-header">
              <h2>회원가입</h2>
              <button 
                className="close-button"
                onClick={() => setShowRegisterModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              {authError && <div className="auth-error">{authError}</div>}
              
              <div className="form-group">
                <label htmlFor="reg-username">아이디</label>
                <input
                  id="reg-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="아이디 (3자 이상)"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="reg-password">비밀번호</label>
                <input
                  id="reg-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호 (4자 이상)"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="confirm-password">비밀번호 확인</label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="비밀번호 확인"
                />
              </div>
              
              <button 
                className="auth-button"
                onClick={handleRegister}
              >
                회원가입
              </button>
              
              <div className="auth-links">
                <p>이미 계정이 있으신가요? 
                  <a href="#" onClick={(e) => {
                    e.preventDefault();
                    setShowRegisterModal(false);
                    setShowLoginModal(true);
                  }}>로그인</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* VIP 모달 */}
      {showVipModal && (
        <div className="modal-overlay">
          <div className="vip-modal auth-modal">
            <div className="modal-header">
              <h2>VIP 회원 업그레이드</h2>
              <button 
                className="close-button"
                onClick={() => setShowVipModal(false)}
                style={{ padding: '8px 12px', fontSize: '18px' }}  // 모바일에서 더 큰 X 버튼
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <div className="vip-info">
                <h3>VIP 회원 혜택</h3>
                <ul>
                  <li>하루 사용 횟수 무제한 (일반 회원은 1회만 가능)</li>
                  <li>고급 콘텐츠 템플릿 사용 가능</li>
                  <li>우선 기술 지원</li>
                </ul>
                
                <h3>VIP 회원 가격</h3>
                <p className="vip-price">19,900원 / 30일</p>
                
                <div className="payment-info">
                  <h4>입금 정보</h4>
                  <div className="account-info">
                    <p>입금 계좌: 카카오뱅크 3333335201265</p>
                    <button 
                      className="copy-button"
                      onClick={() => {
                        navigator.clipboard.writeText('3333335201265')
                          .then(() => alert('계좌번호가 복사되었습니다!'))
                          .catch(err => alert('복사에 실패했습니다: ' + err));
                      }}
                    >
                      복사
                    </button>
                  </div>
                  <p>예금주: 이경형</p>
                  <p>입금 후 아래 버튼을 클릭하여 신청하세요.</p>
                  <p className="test-mode-notice">* 입금시 예금자명을 예금주와 아이디를 모두써서 보내주세요</p>
                </div>
                
                <div className="vip-upgrade-form">
                  <div className="form-group">
                    <label>예금주와 id</label>
                    <input 
                      type="text" 
                      value={depositName} 
                      onChange={(e) => setDepositName(e.target.value)} 
                      placeholder="예금주와 id 입력하세요"
                    />
                  </div>
                </div>
                
                <div className="vip-upgrade-options">
                  <button 
                    className="auth-button"
                    disabled={!depositName.trim()}
                    onClick={(event) => {
                      if (!depositName.trim()) {
                        alert('예금주와 id 입력해주세요.');
                        return;
                      }
                      
                      // 확인 팝업 표시
                      if (window.confirm(`예금주와 금액이 정확한지 확인해주세요.\n\n예금주: ${depositName}\n금액: 29,000원\n\nVIP 신청을 진행하시겠습니까?`)) {
                        // 버튼 애니메이션 효과
                        const button = event.target;
                        button.classList.add('button-pressed');
                        setTimeout(() => button.classList.remove('button-pressed'), 300);
                      
                        // 텔레그램으로 알림 전송
                        const currentUser = localStorage.getItem('smart_content_current_user');
                        if (currentUser) {
                          // 텔레그램 메시지 전송
                          const approvalId = Date.now().toString(); // 고유 승인 ID 생성
                          
                          // 메시지에 승인 링크 포함
                          const message = `💰 VIP 신청 요청\n\n사용자: ${currentUser}\n예금주: ${depositName}\n날짜: ${new Date().toLocaleString()}\n금액: 29,000원\n\n승인하려면 아래 링크를 클릭하세요:\nhttps://seo-beige.vercel.app/api/approve?requestId=${approvalId}&action=approve&userId=${encodeURIComponent(currentUser)}&email=${encodeURIComponent(depositName)}`;
                          
                          const TELEGRAM_BOT_TOKEN = "7937435896:AAEOi8fVqPyBiWf0BhJJvUv5F8V6DtQ67TM";
                          const TELEGRAM_CHAT_ID = "455532741";
                          
                          // URL 인코딩하여 메시지 전송 (CORS 문제를 피하기 위해 proxy 서버를 통해 하는 것이 좋습니다)
                          // 이 예제에서는 직접 호출합니다
                          fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage?chat_id=${TELEGRAM_CHAT_ID}&text=${encodeURIComponent(message)}`)
                            .then(response => response.json())
                            .then(data => {
                              if (data.ok) {
                                setVipRequestStatus('pending');
                                // 로컬 스토리지에 VIP 신청 정보 저장
                                const users = JSON.parse(localStorage.getItem('smart_content_users') || '[]');
                                const userIndex = users.findIndex(u => u.username === currentUser);
                                
                                if (userIndex >= 0) {
                                  const updatedUsers = [...users];
                                  updatedUsers[userIndex] = {
                                    ...updatedUsers[userIndex],
                                    vipRequest: {
                                      status: 'pending',
                                      depositName: depositName,
                                      requestDate: new Date().toISOString()
                                    }
                                  };
                                  
                                  localStorage.setItem('smart_content_users', JSON.stringify(updatedUsers));
                                  alert('VIP 신청이 완료되었습니다. 입금 확인 후 승인됩니다.');
                                  setShowVipModal(false);
                                }
                              }
                            })
                            .catch(error => {
                              console.error('텔레그램 알림 전송 실패:', error);
                              alert('현재 서버 연결에 문제가 있습니다. 나중에 다시 시도해주세요.');
                            });
                        }
                      }
                    }}
                  >
                    VIP 신청하기
                  </button>
                  
                  {depositName && depositName.trim() === '' && (
                    <p className="error-message">예금주 이름을 입력해주세요.</p>
                  )}
                  
                  {vipRequestStatus === 'pending' && (
                    <p className="pending-message">VIP 신청이 처리 중입니다. 입금 확인 후 승인됩니다.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 스낵바 */}
      {showSnackbar && (
        <div className="snackbar">
          <p>{snackbarMessage}</p>
          <button 
            className="close-snackbar-button"
            onClick={() => setShowSnackbar(false)}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

export default App;