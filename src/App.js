import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './App.css';
import { useAuth } from './contexts/SupabaseAuthContext';
import Header from './components/Header';
import DatabaseInitializer from './components/DatabaseInitializer';

// 환경 변수로 API 키 관리
const OPENAI_API_KEY = "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";

// 배열에서 무작위 항목을 선택하는 유틸리티 함수
const getRandomItem = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

function App() {
  // 인증 관련 변수
  const { currentUser, isAdmin, requestVipUpgrade } = useAuth();
  const isLoggedIn = !!currentUser;
  const isVip = currentUser && (currentUser.membershipType === 'vip' || currentUser.vipStatus === 'approved' || isAdmin);
  
  // 상태 관리
  const [keyword, setKeyword] = useState('');
  const [link, setLink] = useState('');
  const [anchorLinks, setAnchorLinks] = useState([]);
  const [contentType, setContentType] = useState('블로그');
  const [styleType, setStyleType] = useState('정보형');
  const [result, setResult] = useState('');
  const [headlines, setHeadlines] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showVipModal, setShowVipModal] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [images, setImages] = useState([]);
  const [additionalKeyword, setAdditionalKeyword] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const fileInputRef = useRef(null);
  
  // 링크와 키워드 함께 추가 함수
  const addAnchorLink = () => {
    if (link.trim() && additionalKeyword.trim()) {
      if (isVip) {
        setAnchorLinks([...anchorLinks, { 
          id: getRandomItem([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).toString(36).substr(2, 9),
          url: link.trim(), 
          text: additionalKeyword.trim() 
        }]);
        setLink('');
        setAdditionalKeyword('');
      } else {
        // VIP가 아닌 경우 VIP 신청 모달 표시
        setShowVipModal(true);
      }
    } else {
      alert('링크와 키워드를 모두 입력해주세요.');
    }
  };
  
  // 앵커 링크 삭제 함수
  const removeAnchorLink = (idToRemove) => {
    setAnchorLinks(anchorLinks.filter(item => item.id !== idToRemove));
  };
  
  // 이미지 업로드 처리 함수
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    if (!isVip) {
      // VIP가 아닌 경우 VIP 신청 모달 표시
      setShowVipModal(true);
      return;
    }
    
    if (files.length > 0) {
      files.forEach(file => {
        const reader = new FileReader();
        
        reader.onload = (event) => {
          const newImage = {
            id: getRandomItem([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).toString(36).substr(2, 9),
            name: file.name,
            dataUrl: event.target.result
          };
          
          setImages(prevImages => [...prevImages, newImage]);
        };
        
        reader.readAsDataURL(file);
      });
    }
    
    // 파일 입력 필드 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  // 이미지 삭제 함수
  const removeImage = (idToRemove) => {
    setImages(images.filter(image => image.id !== idToRemove));
  };
  
  // 콘텐츠 생성 함수
  const generateContent = async () => {
    if (!keyword.trim()) {
      alert('키워드를 입력해주세요.');
      return;
    }
    
    setIsLoading(true);
    setShowResult(false);
    
    try {
      if (isVip) {
        // VIP 회원용 OpenAI API 호출
        try {
          console.log("VIP 회원용 GPT 콘텐츠 생성 시작");
          
          // 제목 생성을 위한 프롬프트
          const headlinePrompt = `
키워드 "${keyword}"에 대한 SEO 최적화된 매력적인 블로그 제목 5개를 생성해주세요.
제목들은 클릭을 유도하면서도 전문적이고 신뢰할 수 있어야 합니다.
각 제목은 한 줄에 하나씩 작성해주세요.
`;

          // 본문 생성을 위한 프롬프트
          const contentPrompt = `
다음 키워드에 대한 SEO 최적화된 콘텐츠를 작성해주세요:

키워드: ${keyword}
콘텐츠 유형: ${contentType}
작성 스타일: ${styleType}

요구사항:
1. 전체적으로 ${keyword}에 대한 자연스러운 정보를 제공해야 합니다.
2. 마치 사람이 직접 작성한 것처럼 자연스러운 문체로 작성해주세요.
3. 구글 SEO에 최적화된 콘텐츠여야 합니다.
4. 키워드를 자연스럽게 통합하되 과도하게 사용하지 마세요.
5. 전문적이면서도 읽기 쉬운 어조를 유지하세요.
6. 글은 서론, 본론, 결론 구조를 가지고 있어야 합니다.
7. 마크다운 형식으로 제목, 소제목, 단락을 구분해주세요.
8. 글자 수는 최소 500자 이상이어야 합니다.
${anchorLinks.length > 0 ? `9. 다음 앵커 텍스트와 URL을 자연스럽게 본문에 통합해주세요:\n${anchorLinks.map(link => `   - 텍스트: ${link.text}, URL: ${link.url}`).join('\n')}` : ''}
`;

          // OpenAI API 호출 - 제목 생성
          const headlinesResponse = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
              model: "gpt-4",
              messages: [
                {"role": "system", "content": "당신은 SEO 최적화된 콘텐츠를 생성하는 전문가입니다."},
                {"role": "user", "content": headlinePrompt}
              ],
              temperature: 0.7,
              max_tokens: 500
            })
          });
          
          // OpenAI API 호출 - 본문 생성
          const contentResponse = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
              model: "gpt-4",
              messages: [
                {"role": "system", "content": "당신은 SEO 최적화된 콘텐츠를 생성하는 전문가입니다. 사람이 직접 작성한 것 같은 자연스러운 글을 작성하세요."},
                {"role": "user", "content": contentPrompt}
              ],
              temperature: 0.8,
              max_tokens: 3000
            })
          });
          
          if (!headlinesResponse.ok || !contentResponse.ok) {
            throw new Error("API 요청 중 오류가 발생했습니다.");
          }
          
          const headlinesData = await headlinesResponse.json();
          const contentData = await contentResponse.json();
          
          // 응답에서 제목과 본문 추출
          const headlinesText = headlinesData.choices[0].message.content;
          const contentText = contentData.choices[0].message.content;
          
          // 제목 목록 추출 (줄바꿈으로 구분된 제목들)
          const extractedHeadlines = headlinesText.split('\n').filter(line => line.trim() !== '');
          
          // 결과 설정
          setHeadlines(extractedHeadlines);
          setResult(contentText);
          setShowResult(true);
          setIsLoading(false);
          
        } catch (apiError) {
          console.error('GPT API 호출 중 오류:', apiError);
          // API 오류 시 기본 템플릿으로 폴백
          alert('AI 콘텐츠 생성에 실패했습니다. 기본 템플릿으로 생성합니다.');
          // 일반 템플릿 생성 코드 실행
          generateMockTemplateContent();
        }
      } else {
        // 일반 회원용 템플릿 기반 콘텐츠
        generateMockTemplateContent();
      }
    } catch (error) {
      console.error('콘텐츠 생성 중 오류 발생:', error);
      alert('콘텐츠 생성 중 오류가 발생했습니다.');
      setIsLoading(false);
    }
  };
  
  // 템플릿 기반 콘텐츠 생성 (일반 회원용)
  const generateMockTemplateContent = () => {
    if (!keyword.trim()) {
      alert('키워드를 입력해주세요.');
      return;
    }
    
    setIsLoading(true);
    setShowResult(false);
    
    try {
      // 목업 데이터 생성
      setTimeout(() => {
        // VIP 회원과 일반 회원을 위한 다른 스타일의 제목 생성
        let mockHeadlines = [];
        
        if (isVip) {
          // VIP 회원용 자연스러운 제목
          const vipHeadlineTemplates = [
            `내가 직접 경험해본 ${keyword}의 놀라운 효과`,
            `당신이 몰랐던 ${keyword}의 숨겨진 비밀`,
            `${keyword}? 전문가도 깜짝 놀란 최신 인사이트`,
            `${keyword}로 인생이 바뀐 사람들의 진짜 이야기`,
            `트렌드세터들이 선택한 ${keyword} - 실패 없는 활용법`
          ];
          
          mockHeadlines = vipHeadlineTemplates.map(headline => {
            // 약간의 변형을 주어 더 자연스럽게
            const randomSuffixes = ['!', '...', '', ' (최신 가이드)', ' - 전문가 분석'];
            const randomSuffix = getRandomItem(randomSuffixes);
            return headline + randomSuffix;
          });
        } else {
          // 일반 회원용 기본 제목
          mockHeadlines = [
            `${keyword}의 모든 것: 완벽 가이드`,
            `${keyword} 활용 방법 10가지`,
            `${keyword}로 당신의 비즈니스를 성장시키는 방법`,
            `초보자도 쉽게 배우는 ${keyword}`,
            `${keyword} 최신 트렌드 분석`
          ];
        }
        
        // 콘텐츠 유형에 따른 형식 설정 (VIP 회원용 특별 형식 추가)
        let titlePrefix = '';
        let contentFormat = '';
        
        // 일반 템플릿과 VIP 회원용 자연스러운 템플릿
        const templates = {
          블로그: {
            normal: `${keyword}에 대한 완벽 가이드`,
            vip: [
              `${keyword}에 관한 내 솔직한 생각`,
              `${keyword}: 알려주지 않는 진짜 이야기`,
              `내가 ${keyword}에 빠진 진짜 이유`
            ]
          },
          SNS: {
            normal: `#${keyword} 알고 계셨나요?`,
            vip: [
              `#${keyword} 요즘 이게 대세라는데 직접 써봤습니다`,
              `솔직히 #${keyword} 이거 완전 필수템임...`,
              `결국 다시 돌아온 #${keyword} 인생템!`
            ]
          },
          뉴스레터: {
            normal: `${keyword}, 업계 전문가들이 주목하는 이유`,
            vip: [
              `${keyword}가 바꾸는 판도, 이 흐름을 놓치지 마세요`,
              `주목! ${keyword}에 대한 오해와 진실`,
              `이번 주 핫토픽 ${keyword}, 전문가들의 진짜 평가는?`
            ]
          },
          보도자료: {
            normal: `${keyword} - 최신 동향 및 전망`,
            vip: [
              `충격! ${keyword}가 업계에 몰고 온 예상치 못한 변화`,
              `${keyword}에서 새 시장 기회 발견, 선점하는 기업들`,
              `${keyword} 분야 최고 전문가들이 예측한 향후 5년`
            ]
          }
        };
        
        // 콘텐츠 유형에 맞는 제목 선택
        if (isVip && templates[contentType]) {
          titlePrefix = getRandomItem(templates[contentType].vip);
        } else if (templates[contentType]) {
          titlePrefix = templates[contentType].normal;
        } else {
          titlePrefix = `${keyword}에 대한 완벽 가이드`;
        }
        
        // 작성 스타일에 따른 톤 설정 - VIP 회원은 더 자연스러운 표현
        const toneTemplates = {
          정보형: {
            normal: '객관적이고 정보 중심적인 톤',
            vip: [
              '전문가의 시선으로 제가 직접 정리한',
              '많은 자료를 분석해본 결과',
              '현장에서 직접 겪어본 바로는'
            ]
          },
          설득형: {
            normal: '독자의 행동을 유도하는 설득력 있는 톤',
            vip: [
              '솔직히 말하자면, 이거 안 해보면 정말 후회합니다',
              '제가 보장합니다, 이것만 따라하셔도',
              '처음엔 저도 반신반의했지만, 지금은 확신해요'
            ]
          },
          스토리텔링: {
            normal: '흥미로운 이야기로 풀어내는 스토리텔링 방식',
            vip: [
              '제 인생을 바꾼 그날의 경험을 나눠볼게요',
              '믿기지 않겠지만, 정말 있었던 일입니다',
              '누구에게도 말하지 않았던 비하인드 스토리'
            ]
          },
          재미있는: {
            normal: '유머와 재치가 있는 가벼운 톤',
            vip: [
              '웃음 포인트 3초 전... 진짜 웃겨요 ㅋㅋㅋ',
              '아니, 이건 진짜 황당해서 웃음밖에 안 나오는데요?',
              '와... 이거 실화냐? 라는 말이 절로 나올 겁니다'
            ]
          }
        };
        
        let contentTone = '';
        if (isVip && toneTemplates[styleType]) {
          contentTone = getRandomItem(toneTemplates[styleType].vip);
        } else if (toneTemplates[styleType]) {
          contentTone = toneTemplates[styleType].normal;
        } else {
          contentTone = '객관적이고 정보 중심적인 톤';
        }
        
        // 회원 유형에 따른 콘텐츠 길이 제한
        let contentLength = 0;
        if (isVip) {
          // VIP 회원: 1~2000자 랜덤 생성
          contentLength = Math.floor(Math.random() * 1800) + 200; // 200~2000자 랜덤
        } else {
          // 일반 회원: 최대 300자
          contentLength = 300;
        }
        
        // 콘텐츠 생성 - VIP 회원용 자연스러운 문체
        let mockContent = '';
        
        if (isVip) {
          // VIP 회원용 자연스러운 콘텐츠
          const personalIntros = [
            `안녕하세요! 오늘은 많은 분들이 궁금해하시는 ${keyword}에 대해 제 경험을 솔직하게 나눠볼게요.`,
            `요즘 SNS에서 핫한 ${keyword}, 과연 그 인기의 비결은 무엇일까요? 직접 사용해본 제 솔직한 후기를 들려드립니다.`,
            `${keyword}를 처음 접했을 때만 해도 별 기대 없었어요. 그런데 지금은? 제 라이프스타일을 완전히 바꿔놓았답니다.`,
            `처음에는 저도 ${keyword}에 대해 회의적이었어요. 하지만 몇 달간 깊이 연구하고 경험한 결과, 정말 놀라운 발견을 했습니다.`
          ];
          
          const midContents = [
            `많은 분들이 ${keyword}에 대해 궁금해하시는데, 정말 알면 알수록 매력적인 분야예요. 제가 직접 경험한 바로는, 처음에는 어렵게 느껴질 수 있지만 조금만 시간을 투자하면 누구나 쉽게 익힐 수 있어요.`,
            `제가 ${keyword}를 처음 접했을 때는 정말 무지했어요. 인터넷에 널린 정보도 대부분 피상적이거나 오래된 내용이더라고요. 그래서 직접 전문가들을 만나고, 관련 서적을 섭렵하며 진짜 노하우를 찾아 나섰습니다.`,
            `${keyword}에 관한 오해가 정말 많아요. 가장 큰 오해는 '너무 어렵다'는 것. 사실은 정확한 방법만 알면 누구나 쉽게 시작할 수 있습니다. 제가 찾은 효과적인 접근법을 공유해 드릴게요.`,
            `솔직히 말씀드리면, ${keyword}는 트렌드를 따라가는 것보다 본인에게 맞는 방식을 찾는 게 중요해요. 저는 여러 방법을 실험해보며 제게 가장 효과적인 방법을 찾았고, 그 과정에서 깨달은 인사이트를 나누고 싶습니다.`
          ];
          
          const tipContents = [
            `제가 ${keyword}를 통해 가장 크게 깨달은 점은 '꾸준함'의 중요성이에요. 단기간에 효과를 기대하기보다는 일관된 접근이 필요합니다. 처음에는 하루에 10분부터 시작해보세요.`,
            `${keyword}에 관한 제 최고의 팁은 바로 '실패를 두려워하지 말라'는 것입니다. 저도 처음에는 수없이 실패했어요. 하지만 그 실패가 지금의 전문성을 만들었죠. 여러분도 포기하지 않고 도전하세요!`,
            `많은 분들이 놓치는 ${keyword}의 핵심 포인트가 있어요. 바로 '디테일'에 있습니다. 큰 그림도 중요하지만, 작은 부분 하나하나가 모여 큰 차이를 만든다는 것을 잊지 마세요.`,
            `제가 ${keyword}를 마스터하면서 가장 도움이 된 습관은 '매일 기록하기'였습니다. 진전 상황을 눈으로 확인하면 동기부여가 되더라고요. 여러분도 작은 성취부터 기록해보세요.`
          ];
          
          const conclusionContents = [
            `결론적으로, ${keyword}는 우리 삶에 놀라운 변화를 가져다줄 수 있습니다. 저처럼 처음에는 의심했더라도, 열린 마음으로 접근해보세요. 분명 여러분의 삶도 풍요롭게 변화할 거예요.`,
            `이상으로 제가 직접 경험한 ${keyword}에 대한 모든 것을 나눠봤습니다. 도움이 되셨길 바라며, 언제든 궁금한 점이 있으시면 댓글로 남겨주세요. 제가 아는 한 상세히 답변 드리겠습니다!`,
            `지금까지 ${keyword}에 관한 제 여정을 솔직하게 나누어 봤습니다. 이 글이 여러분께 영감을 주었길 바라며, 여러분만의 ${keyword} 이야기도 만들어가시길 응원합니다!`,
            `${keyword}의 세계는 정말 깊고 넓습니다. 오늘 제가 공유한 경험이 여러분의 시작에 작은 도움이 되었으면 좋겠네요. 함께 배우고 성장해가는 여정을 계속해봐요!`
          ];
          
          // 최종 콘텐츠 조합 - 자연스러운 흐름으로
          mockContent = `# ${titlePrefix}\n\n`;
          mockContent += getRandomItem(personalIntros) + '\n\n';
          
          // 이미지 추가 (있는 경우)
          if (images.length > 0) {
            const randomImageIndex = getRandomItem([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
            mockContent += `![${images[randomImageIndex].name}](${images[randomImageIndex].dataUrl})\n`;
            mockContent += `*제가 직접 촬영한 ${keyword} 관련 이미지*\n\n`;
          }
          
          mockContent += `## 내가 발견한 ${keyword}의 진짜 모습\n\n`;
          mockContent += getRandomItem(midContents) + '\n\n';
          
          // 앵커 링크 자연스럽게 추가 (있는 경우)
          if (anchorLinks.length > 0) {
            const randomLinkIndex = getRandomItem([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
            const randomLink = anchorLinks[randomLinkIndex];
            mockContent += `얼마 전에 [${randomLink.text}](${randomLink.url})에서 정말 유용한 정보를 발견했어요. 정말 도움이 많이 됐답니다.\n\n`;
          }
          
          // 두 번째 이미지 추가 (있는 경우)
          if (images.length > 1) {
            const secondImageIndex = getRandomItem([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
            mockContent += `![${images[secondImageIndex].name}](${images[secondImageIndex].dataUrl})\n`;
            mockContent += `*${keyword}를 활용한 실제 사례*\n\n`;
          }
          
          mockContent += `## 내가 찾은 효과적인 ${keyword} 활용법\n\n`;
          mockContent += getRandomItem(tipContents) + '\n\n';
          
          // 추가 앵커 링크 (있는 경우)
          if (anchorLinks.length > 1) {
            const secondLinkIndex = getRandomItem([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
            const secondLink = anchorLinks[secondLinkIndex];
            mockContent += `참고로 [${secondLink.text}](${secondLink.url})에서 더 자세한 방법을 확인할 수 있어요. 제가 자주 참고하는 사이트입니다.\n\n`;
          }
          
          // 세 번째 이미지 추가 (있는 경우)
          if (images.length > 2) {
            const thirdImageIndex = getRandomItem([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
            mockContent += `![${images[thirdImageIndex].name}](${images[thirdImageIndex].dataUrl})\n`;
            mockContent += `*${keyword} 활용의 놀라운 결과*\n\n`;
          }
          
          mockContent += `## 마치며\n\n`;
          mockContent += getRandomItem(conclusionContents) + '\n\n';
          
          // 남은 앵커 링크 자연스럽게 추가
          if (anchorLinks.length > 2) {
            mockContent += `### 제가 추천하는 참고 자료\n\n`;
            for (let i = 2; i < Math.min(anchorLinks.length, 5); i++) {
              const link = anchorLinks[i];
              mockContent += `- [${link.text}](${link.url}) - 정말 유용한 정보가 많아요!\n`;
            }
            mockContent += '\n';
          }
          
          // 나머지 이미지 갤러리 형식으로 추가 (많은 경우)
          if (images.length > 3) {
            mockContent += `## 추가 이미지 갤러리\n\n`;
            for (let i = 3; i < Math.min(images.length, 6); i++) {
              const img = images[i];
              mockContent += `![${img.name}](${img.dataUrl})\n`;
              mockContent += `*${keyword}와 관련된 추가 이미지 ${i-2}*\n\n`;
            }
          }
          
          // 자연스러운 마무리
          const closings = [
            `이 글이 도움이 되셨다면 좋아요와 공유 부탁드려요! 다음에 더 유익한 정보로 찾아오겠습니다. 🙌`,
            `여러분의 ${keyword} 경험도 댓글로 공유해주세요! 서로 배우며 성장해요. 💪`,
            `다음 글에서는 ${keyword}의 심화 기술에 대해 다룰 예정이니 많은 기대 부탁드립니다! ✨`,
            `더 궁금한 점이 있으시면 언제든 문의해주세요. 아는 한도 내에서 성심성의껏 답변 드리겠습니다! 🙏`
          ];
          
          mockContent += getRandomItem(closings);
        } else {
          // 일반 회원용 기본 콘텐츠 (기존 코드 유지)
          // 섹션 배열 생성 (글과 이미지 번갈아 배치)
          const contentSections = [];
          
          // 서론 추가 - 유형과 스타일 반영
          contentSections.push(`
# ${titlePrefix}

## 서론
${contentType === 'SNS' ? '📱 ' : ''}${styleType === '재미있는' ? '😊 ' : ''}${keyword}는 현대 비즈니스와 일상생활에서 중요한 부분을 차지하고 있습니다. 이 ${contentFormat}의 글에서는 ${keyword}의 기본 개념부터 고급 활용법까지 ${contentTone}으로 알아보겠습니다.
`);
          
          // VIP 회원만 이미지 추가 가능
          if (isVip && images.length > 0) {
            contentSections.push(`
![${images[0].name}](${images[0].dataUrl})
*${keyword}에 관한 참고 이미지*
`);
          }
          
          // 특징 섹션 추가
          let featuresContent = `
## ${keyword}의 주요 특징
1. 효율성: ${keyword}를 활용하면 업무 효율성이 30% 이상 향상됩니다.
2. 접근성: 누구나 쉽게 배우고 활용할 수 있습니다.
3. 유연성: 다양한 환경과 상황에 맞게 조정이 가능합니다.
`;

          // VIP 회원만 앵커 링크 추가 가능
          if (isVip && anchorLinks.length > 0) {
            const randomLink = anchorLinks[Math.floor(Math.random() * anchorLinks.length)];
            featuresContent = featuresContent.replace(
              /2\. 접근성: .+?\./,
              `2. 접근성: [${randomLink.text}](${randomLink.url})를 통해 누구나 쉽게 배우고 활용할 수 있습니다.`
            );
          }
          
          contentSections.push(featuresContent);
          
          // VIP 회원만 두 번째 이미지 추가 가능
          if (isVip && images.length > 1) {
            contentSections.push(`
![${images[1].name}](${images[1].dataUrl})
*${keyword}의 활용 사례 예시*
`);
          }
          
          // 활용 방법 섹션 추가
          let usageContent = `
## ${keyword} 활용 방법
${keyword}를 효과적으로 활용하기 위한 방법을 알아보겠습니다. 먼저, 목표를 명확히 설정하는 것이 중요합니다. 그 다음, 적절한 도구와 리소스를 준비하세요.
`;

          // VIP 회원만 앵커 링크 추가 가능
          if (isVip && anchorLinks.length > 1) {
            const secondLink = anchorLinks[1 % anchorLinks.length];
            usageContent += `\n${keyword} 활용에 대한 더 자세한 정보는 [${secondLink.text}](${secondLink.url})에서 확인할 수 있습니다.\n`;
          }
          
          contentSections.push(usageContent);
          
          // VIP 회원만 이미지 추가 가능
          if (isVip && images.length > 2) {
            contentSections.push(`
![${images[2].name}](${images[2].dataUrl})
*${keyword} 활용을 위한 도구*
`);
          }
          
          // 전문가 조언 및 결론 추가
          let expertsContent = `
## 전문가들의 조언
업계 전문가들은 ${keyword}를 처음 시작할 때 기본기를 탄탄히 다질 것을 권장합니다. 또한, 지속적인 학습과 업데이트된 정보를 따라가는 것이 중요합니다.
`;

          // VIP 회원만 앵커 링크 추가 가능
          if (isVip && anchorLinks.length > 2) {
            const thirdLink = anchorLinks[2 % anchorLinks.length];
            expertsContent += `\n[${thirdLink.text}](${thirdLink.url})에 따르면, ${keyword}의 성공적인 활용을 위해서는 체계적인 접근이 필요합니다.\n`;
          }

          contentSections.push(expertsContent);

          // 결론
          let conclusionContent = `
## 결론
${keyword}는 앞으로도 계속해서 발전하고 중요성이 커질 것입니다. 지금 시작하여 ${keyword}의 장점을 최대한 활용해보세요.
`;

          // VIP 회원만 앵커 링크 추가 가능
          if (isVip && anchorLinks.length > 0) {
            conclusionContent += `\n### 추천 참고 자료\n`;
            anchorLinks.forEach(link => {
              conclusionContent += `- [${link.text}](${link.url})\n`;
            });
          }

          contentSections.push(conclusionContent);
          
          // VIP 회원만 나머지 이미지 추가 가능
          if (isVip && images.length > 3) {
            contentSections.push(`
## 추가 참고 이미지
${images.slice(3).map((img, index) => 
  `![${img.name}](${img.dataUrl})\n*추가 참고 이미지 ${index + 1}*\n`
).join('\n')}
`);
          }
          
          // 모든 섹션을 하나의 문자열로 결합
          mockContent = contentSections.join('\n');
        }
        
        // 콘텐츠 길이 제한 적용
        if (mockContent.length > contentLength) {
          // 길이 제한
          mockContent = mockContent.substring(0, contentLength);
          
          // 일반 회원인 경우 제한 메시지 추가
          if (!isVip) {
            mockContent += '\n\n... [더 사람같이 쓴 콘텐츠를 생성하려면 VIP 회원으로 업그레이드하세요] ...';
          }
        }
        
        setHeadlines(mockHeadlines);
        setResult(mockContent);
        setIsLoading(false);
        setShowResult(true);
      }, 2000);
      
    } catch (error) {
      console.error('콘텐츠 생성 중 오류 발생:', error);
      alert('콘텐츠 생성 중 오류가 발생했습니다.');
      setIsLoading(false);
    }
  };
  
  // VIP 신청 처리
  const handleVipRequest = () => {
    if (isLoggedIn) {
      setShowVipModal(true);
    } else {
      setShowLoginModal(true);
    }
  };
  
  // 컴포넌트 마운트 시 커스텀 이벤트 리스너 등록
  useEffect(() => {
    // VIP 신청 모달 이벤트 리스너
    const handleVipModalEvent = () => {
      if (isLoggedIn) {
        setShowVipModal(true);
      } else {
        setShowLoginModal(true);
      }
    };
    
    // 로그인 모달 이벤트 리스너
    const handleLoginModalEvent = () => {
      setShowLoginModal(true);
    };
    
    // 이벤트 리스너 등록
    window.addEventListener('openVipModal', handleVipModalEvent);
    window.addEventListener('openLoginModal', handleLoginModalEvent);
    
    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      window.removeEventListener('openVipModal', handleVipModalEvent);
      window.removeEventListener('openLoginModal', handleLoginModalEvent);
    };
  }, [isLoggedIn]);
  
  return (
    <div className="app">
      <Header />
      <DatabaseInitializer />
      
      {/* 로그인 유도 모달 */}
      {showLoginModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <button className="close-modal" onClick={() => setShowLoginModal(false)}>×</button>
            <h2>로그인이 필요합니다</h2>
            <p>VIP 서비스를 이용하기 위해서는 로그인이 필요합니다.</p>
            <div className="login-buttons">
              <Link to="/login" className="auth-button">로그인</Link>
              <Link to="/register" className="auth-button register-btn">회원가입</Link>
            </div>
            <p className="login-benefit">회원가입 후 VIP 결제 시 다양한 고급 기능을 이용할 수 있습니다.</p>
          </div>
        </div>
      )}
      
      {/* VIP 신청 모달 */}
      {showVipModal && isLoggedIn && (
        <div className="modal-overlay">
          <div className="modal-container">
            <button className="close-modal" onClick={() => setShowVipModal(false)}>×</button>
            <h2>VIP 회원 신청</h2>
            <p>VIP 회원이 되어 추가 기능을 사용해보세요!</p>
            
            <div className="vip-features-list">
              <div className="vip-feature-item">
                <span className="feature-icon">✓</span>
                <span>무제한 콘텐츠 생성</span>
              </div>
              <div className="vip-feature-item">
                <span className="feature-icon">✓</span>
                <span>고급 SEO 키워드 분석</span>
              </div>
              <div className="vip-feature-item">
                <span className="feature-icon">✓</span>
                <span>이미지 생성 및 통합</span>
              </div>
              <div className="vip-feature-item">
                <span className="feature-icon">✓</span>
                <span>우선 고객 지원</span>
              </div>
            </div>
            
            <div className="vip-payment-info">
              <h3>결제 정보</h3>
              <p>아래 계좌로 29,900원을 입금하신 후, VIP 신청 버튼을 클릭해주세요.</p>
              <div className="account-info">
                <div className="account-row">
                  <span className="account-label">은행명:</span>
                  <span className="account-value">카카오뱅크</span>
                </div>
                <div className="account-row">
                  <span className="account-label">계좌번호:</span>
                  <div className="account-number-container">
                    <span className="account-value">3333335201265 </span>
                    <button 
                      className="copy-account-btn"
                      onClick={() => {
                        navigator.clipboard.writeText('3333335201265 ');
                        alert('계좌번호가 복사되었습니다.');
                      }}
                    >
                      복사
                    </button>
                  </div>
                </div>
                <div className="account-row">
                  <span className="account-label">예금주:</span>
                  <span className="account-value">이경형</span>
                </div>
              </div>
            </div>
            
            <button 
              className="vip-request-btn"
              onClick={async () => {
                const result = await requestVipUpgrade(currentUser.username);
                if (result.success) {
                  alert('VIP 신청이 완료되었습니다. 예금주와 입금자명이 같아야 승인처리 됩니다');
                  setShowVipModal(false);
                } else {
                  alert(result.error || 'VIP 신청 중 오류가 발생했습니다.');
                }
              }}
            >
              VIP 신청하기
            </button>
            
            <p className="vip-note">* VIP 멤버십은 관리자 승인 후 30일간 유효합니다.</p>
          </div>
        </div>
      )}
      
      <main className="main-content">
        <section className="hero-section">
          <div className="hero-content">
            <h1>Smart Content Creator</h1>
            <p className="subtitle">AI로 최적화된 콘텐츠를 손쉽게 생성하세요</p>
            
            <div className="seo-banner">
              <div className="seo-content">
                <h2 className="seo-title">100% 품질의 AI 콘텐츠 생성기</h2>
                <p className="seo-description">
                  검출되지 않는 자동화 - 고품질, SEO 최적화된 콘텐츠를 자동으로 생성하여 구글에 의해 감지되지 않습니다.
                </p>
                
                <div className="seo-image-container">
                  <img 
                    src="https://i.ibb.co/nMBfbqLB/seo.webp" 
                    alt="구글 SEO 콘텐츠 생성기" 
                    className="seo-image" 
                  />
                </div>
                
                <div className="feature-list">
                  <div className="feature-item">
                    <span className="feature-check">✓</span>
                    <span className="feature-text">통합 키워드 분석</span>
                  </div>
                  <div className="feature-item">
                    <span className="feature-check">✓</span>
                    <span className="feature-text">노출 최적화</span>
                  </div>
                  <div className="feature-item">
                    <span className="feature-check">✓</span>
                    <span className="feature-text">자연스러운 AI 글쓰기</span>
                  </div>
                  <div className="feature-item">
                    <span className="feature-check">✓</span>
                    <span className="feature-text">다중 플랫폼</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="content-generator">
              <div className="search-container">
                <input 
                  type="text" 
                  className="keyword-input"
                  placeholder="키워드를 입력하세요" 
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
                <button 
                  className="generate-btn"
                  onClick={generateContent} 
                  disabled={isLoading}
                >
                  {isLoading ? '생성 중...' : '콘텐츠 생성'}
                </button>
              </div>
              
              <div className="options-grid">
                <div className="option-card">
                  <label htmlFor="content-type">콘텐츠 유형</label>
                  <select 
                    id="content-type"
                    className="select-box"
                    value={contentType} 
                    onChange={(e) => setContentType(e.target.value)}
                  >
                    <option value="블로그">블로그</option>
                    <option value="SNS">SNS</option>
                    <option value="뉴스레터">뉴스레터</option>
                    <option value="보도자료">보도자료</option>
                  </select>
                </div>
                
                <div className="option-card">
                  <label htmlFor="style-type">글쓰기 스타일</label>
                  <select 
                    id="style-type"
                    className="select-box"
                    value={styleType} 
                    onChange={(e) => setStyleType(e.target.value)}
                  >
                    <option value="정보형">정보형</option>
                    <option value="설득형">설득형</option>
                    <option value="스토리텔링">스토리텔링</option>
                    <option value="재미있는">재미있는</option>
                  </select>
                </div>
              </div>
            </div>
            
            {isLoggedIn && (
              <div className="premium-features">
                {/* 앵커 텍스트 추가 섹션 */}
                <div className="reference-links">
                  <h3>글에 추가할 링크와 키워드 {!isVip && <span className="vip-only-badge">VIP 전용</span>}</h3>
                  <p className="input-description">링크와 키워드를 함께 입력하면 글 내에 앵커 텍스트 형태로 자연스럽게 삽입되며 백링크 역활을 합니다.</p>
                  
                  <div className="link-inputs-container">
                    <div className="link-inputs">
                      <input 
                        type="text" 
                        className="link-input" 
                        placeholder="https://내도메인.com" 
                        value={link}
                        onChange={(e) => setLink(e.target.value)}
                      />
                      <input 
                        type="text" 
                        className="keyword-input-small" 
                        placeholder="노출할 키워드 입력"
                        value={additionalKeyword}
                        onChange={(e) => setAdditionalKeyword(e.target.value)}
                      />
                    </div>
                    <button 
                      className="add-link-btn"
                      onClick={addAnchorLink}
                    >
                      추가
                    </button>
                  </div>
                  
                  {!isVip && anchorLinks.length === 0 && (
                    <div className="vip-feature-notice">
                      <p><span className="vip-icon">⭐</span> 앵커 텍스트는 VIP 회원만 추가할 수 있습니다.</p>
                      <button className="vip-upgrade-btn" onClick={handleVipRequest}>VIP 신청하기</button>
                    </div>
                  )}
                  
                  {anchorLinks.length > 0 && (
                    <ul className="links-list">
                      {anchorLinks.map((item) => (
                        <li key={item.id} className="link-item">
                          <div className="link-content">
                            <span className="link-keyword">{item.text}</span>
                            <span className="link-url">{item.url}</span>
                          </div>
                          <button 
                            className="remove-link-btn"
                            onClick={() => removeAnchorLink(item.id)}
                          >
                            ×
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                
                {/* 이미지 추가 섹션 */}
                <div className="images-section">
                  <h3>이미지 추가 {!isVip && <span className="vip-only-badge">VIP 전용</span>}</h3>
                  <p className="input-description">이미지를 추가하면 글 내에 적절히 배치됩니다.</p>
                  
                  <div className="image-input-container">
                    <input 
                      type="file" 
                      id="image-upload" 
                      accept="image/*" 
                      multiple
                      onChange={handleImageUpload}
                      ref={fileInputRef}
                      className="image-input"
                    />
                    <label htmlFor="image-upload" className="image-upload-btn">
                      이미지 업로드
                    </label>
                  </div>
                  
                  {!isVip && images.length === 0 && (
                    <div className="vip-feature-notice">
                      <p><span className="vip-icon">⭐</span> 이미지는 VIP 회원만 추가할 수 있습니다.</p>
                      <button className="vip-upgrade-btn" onClick={handleVipRequest}>VIP 신청하기</button>
                    </div>
                  )}
                  
                  {images.length > 0 && (
                    <div className="images-preview">
                      {images.map((image) => (
                        <div key={image.id} className="image-preview-item">
                          <img src={image.dataUrl} alt={image.name} />
                          <button 
                            className="remove-image-btn"
                            onClick={() => removeImage(image.id)}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {!isLoggedIn && (
              <div className="login-notice">
                <p>VIP 기능을 이용하려면 <Link to="/login" className="login-link">로그인</Link> 해주세요.</p>
              </div>
            )}
          </div>
        </section>
        
        {showResult && (
          <section className="result-section">
            <div className="result-container">
              <div className="headlines-container">
                <h2>추천 제목</h2>
                <ul className="headlines-list">
                  {headlines.map((headline, index) => (
                    <li key={index} className="headline-item">
                      <span className="headline-number">{index + 1}</span>
                      <span className="headline-text">{headline}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="content-container">
                <h2>생성된 콘텐츠</h2>
                <div className="content-preview">
                  <div dangerouslySetInnerHTML={{ 
                    __html: result.replace(/\n/g, '<br>')
                      .replace(/# (.*)/g, '<h1>$1</h1>')
                      .replace(/## (.*)/g, '<h2>$1</h2>')
                      .replace(/\*\*(.*)\*\*/g, '<strong>$1</strong>')
                  }} />
                </div>
                
                <div className="content-actions">
                  <button 
                    className="copy-btn"
                    onClick={() => {
                      navigator.clipboard.writeText(result);
                      alert('콘텐츠가 클립보드에 복사되었습니다.');
                    }}
                  >
                    <i className="icon-copy"></i> 복사하기
                  </button>
                  <button 
                    className="download-btn"
                    onClick={() => {
                      const blob = new Blob([result], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${keyword}-content.md`;
                      a.click();
                    }}
                  >
                    <i className="icon-download"></i> 다운로드
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
