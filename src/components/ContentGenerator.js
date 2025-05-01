import React, { useState, useEffect } from 'react';
import { addEmojiWithProbability, getRandomEmoji } from '../utils/emojiUtils';
import { saveGeneratedContent } from '../services/contentService';
import { useAuth } from '../contexts/SupabaseAuthContext';

/**
 * 컨텐츠 생성기 컴포넌트
 * 키워드를 기반으로 컨텐츠를 생성하는 기능을 담당합니다.
 */
const ContentGenerator = ({ keyword, onContentGenerated }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('블로그');
  const [generatedContent, setGeneratedContent] = useState('');
  const [generatedTitle, setGeneratedTitle] = useState('');
  const { currentUser } = useAuth();

  // 컨텐츠 생성 함수
  const generateContent = async () => {
    if (!keyword) {
      alert('키워드를 입력해주세요.');
      return;
    }

    setIsGenerating(true);

    try {
      // 컨텐츠 템플릿 생성 로직
      const title = `${keyword}에 대한 ${selectedTemplate} 포스팅`;
      let content = '';

      switch (selectedTemplate) {
        case '블로그':
          content = generateBlogContent(keyword);
          break;
        case '뉴스레터':
          content = generateNewsletterContent(keyword);
          break;
        case 'SNS':
          content = generateSnsContent(keyword);
          break;
        default:
          content = generateBlogContent(keyword);
      }

      setGeneratedTitle(title);
      setGeneratedContent(content);

      // 생성된 컨텐츠 콜백 통해 상위 컴포넌트에 전달
      if (onContentGenerated) {
        onContentGenerated({ title, content });
      }

      // 생성 히스토리 저장
      if (currentUser) {
        await saveGeneratedContent(currentUser.username, keyword, title, content);
      }
    } catch (error) {
      console.error('컨텐츠 생성 중 오류:', error);
      alert('컨텐츠 생성에 실패했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  // 블로그 포스팅 템플릿 생성
  const generateBlogContent = (keyword) => {
    return `# ${addEmojiWithProbability(keyword + '에 대해 알아보자')} 

## ${addEmojiWithProbability('소개')}

${keyword}는 최근 많은 관심을 받고 있는 주제입니다. 이 글에서는 ${keyword}에 대한 모든 것을 다루어 보겠습니다.

${keyword}는 다양한 상황에서 활용할 수 있으며, 특히 다음과 같은 장점이 있습니다:

1. **효율성 증대**: ${keyword}를 활용하면 업무 효율이 30% 이상 증가합니다.
2. **사용자 경험 향상**: 고객 만족도를 크게 높일 수 있습니다.
3. **비용 절감**: 장기적으로 운영 비용을 절감하는 효과가 있습니다.

## ${addEmojiWithProbability('실제 활용 사례')}

### 사례 1: A기업의 성공 스토리

A기업은 ${keyword}를 도입한 후 매출이 42% 증가했습니다. 특히 고객 유지율이 크게 향상되었습니다. ${getRandomEmoji()}

### 사례 2: B씨의 경험담

프리랜서 B씨는 ${keyword}를 통해 작업 시간을 절반으로 줄였습니다. 덕분에 더 많은 프로젝트를 수주할 수 있게 되었죠. ${getRandomEmoji()}

## ${addEmojiWithProbability('시작하는 방법')}

${keyword}를 시작하는 방법은 생각보다 간단합니다:

1. 목표 설정하기
2. 리서치 진행하기
3. 실행 계획 세우기
4. 점진적으로 도입하기
5. 결과 분석 및 개선하기

## ${addEmojiWithProbability('마치며')}

${keyword}는 앞으로도 계속해서 발전할 것입니다. 지금 시작한다면, 미래의 변화에 한발 앞서 준비할 수 있을 것입니다. ${getRandomEmoji()}

더 많은 정보가 필요하시면 언제든 문의해주세요!`;
  };

  // 뉴스레터 템플릿 생성
  const generateNewsletterContent = (keyword) => {
    return `# 📰 ${keyword} 뉴스레터 - 이번 주 소식

안녕하세요, ${keyword} 뉴스레터 구독자 여러분!

이번 주에도 ${keyword}에 관한 중요한 소식들을 모아왔습니다.

## ${addEmojiWithProbability('주요 소식')}

1. **${keyword} 산업, 올해 30% 성장 예상**
   최근 발표된 시장 보고서에 따르면, ${keyword} 관련 산업이 올해 30% 이상 성장할 것으로 예상됩니다.

2. **글로벌 기업들의 ${keyword} 투자 확대**
   애플, 구글, 마이크로소프트 등 주요 기업들이 ${keyword} 분야에 대한 투자를 대폭 확대하고 있습니다.

## ${addEmojiWithProbability('유용한 팁')}

${keyword}를 효과적으로 활용하는 3가지 팁:

- **일관성 유지하기**: 매일 조금씩이라도 꾸준히 실천하세요.
- **커뮤니티 참여하기**: 같은 관심사를 가진 사람들과 정보를 공유하세요.
- **최신 트렌드 팔로우하기**: 블로그, 팟캐스트, 뉴스레터를 구독하세요.

## ${addEmojiWithProbability('이벤트 소식')}

오는 6월, 서울에서 ${keyword} 콘퍼런스가 개최됩니다. 조기 등록 시 20% 할인 혜택을 놓치지 마세요!

다음 뉴스레터에서 더 많은 소식으로 찾아뵙겠습니다. ${getRandomEmoji()}

구독해 주셔서 감사합니다!
`;
  };

  // SNS 포스팅 템플릿 생성
  const generateSnsContent = (keyword) => {
    return `#${keyword.replace(/\s+/g, '')} 

${keyword}에 대해 알고 계셨나요? 🤔

✅ ${keyword}는 우리 일상을 더 편리하게 만들어 줍니다.
✅ 전문가들은 ${keyword}가 미래 시장을 주도할 것으로 예측합니다.
✅ 지금 시작하면 앞서갈 수 있습니다!

저희와 함께 ${keyword}의 세계를 탐험해보세요! 👇
더 많은 정보는 프로필 링크를 확인해주세요.

#트렌드 #혁신 #미래기술 #${keyword.replace(/\s+/g, '')}전문가 #함께해요`;
  };

  return (
    <div className="content-generator">
      <h3>컨텐츠 생성</h3>
      
      <div className="form-group">
        <label>템플릿 선택:</label>
        <select 
          value={selectedTemplate} 
          onChange={(e) => setSelectedTemplate(e.target.value)}
          className="form-control"
        >
          <option value="블로그">블로그 포스팅</option>
          <option value="뉴스레터">뉴스레터</option>
          <option value="SNS">SNS 포스팅</option>
        </select>
      </div>
      
      <button 
        onClick={generateContent} 
        disabled={isGenerating || !keyword}
        className="btn btn-primary mt-2"
      >
        {isGenerating ? '생성 중...' : '컨텐츠 생성하기'}
      </button>
      
      {generatedContent && (
        <div className="generated-content mt-4">
          <h4>{generatedTitle}</h4>
          <div className="content-preview">
            <pre>{generatedContent}</pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentGenerator;
