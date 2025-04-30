import React, { useState } from 'react';
import { saveLinkToDatabase } from '../services/contentService';
import { useAuth } from '../contexts/LocalAuthContext';

/**
 * 링크 관리 컴포넌트
 * 사용자가 링크를 저장하고 관리할 수 있는 기능을 제공합니다.
 */
const LinkManager = ({ links, onLinkAdded, onLinkRemoved }) => {
  const [newLink, setNewLink] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [error, setError] = useState('');
  const { currentUser } = useAuth();

  // 링크 저장 함수
  const saveLink = async () => {
    // 입력값 유효성 검사
    if (!newLink) {
      setError('저장할 링크를 입력해주세요.');
      return;
    }

    try {
      // URL 형식 검증
      let url = newLink;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      // URL 객체 생성 시도 (유효한 URL인지 확인)
      new URL(url);

      // 타이틀이 비어있으면 URL을 타이틀로 사용
      const title = newTitle.trim() || url;

      // 링크 중복 검사
      const isDuplicate = links.some(link => link.url === url);
      if (isDuplicate) {
        setError('이미 저장된 링크입니다.');
        return;
      }

      // 새 링크 객체 생성
      const newLinkObject = {
        id: Date.now().toString(),
        url,
        title,
        date: new Date().toISOString(),
      };

      // 데이터베이스에 저장
      if (currentUser) {
        await saveLinkToDatabase(currentUser.username, newLinkObject);
      }

      // 상위 컴포넌트에 알림
      if (onLinkAdded) {
        onLinkAdded(newLinkObject);
      }

      // 입력 필드 초기화
      setNewLink('');
      setNewTitle('');
      setError('');
    } catch (error) {
      setError('유효하지 않은 URL입니다. 정확한 링크를 입력해주세요.');
      console.error('링크 저장 중 오류:', error);
    }
  };

  // 링크 삭제 함수
  const removeLink = (id) => {
    if (onLinkRemoved) {
      onLinkRemoved(id);
    }
  };

  return (
    <div className="link-manager">
      <h3>링크 관리</h3>
      
      <div className="form-group">
        <label>링크 URL:</label>
        <input
          type="text"
          value={newLink}
          onChange={(e) => setNewLink(e.target.value)}
          placeholder="https://example.com"
          className="form-control"
        />
      </div>
      
      <div className="form-group">
        <label>링크 제목 (선택사항):</label>
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="링크 제목"
          className="form-control"
        />
      </div>
      
      {error && <div className="alert alert-danger">{error}</div>}
      
      <button 
        onClick={saveLink} 
        className="btn btn-primary mt-2"
      >
        링크 저장
      </button>

      {links.length > 0 && (
        <div className="saved-links mt-4">
          <h4>저장된 링크</h4>
          <ul className="list-group">
            {links.map(link => (
              <li key={link.id} className="list-group-item d-flex justify-content-between align-items-center">
                <a href={link.url} target="_blank" rel="noopener noreferrer">
                  {link.title}
                </a>
                <button 
                  onClick={() => removeLink(link.id)} 
                  className="btn btn-sm btn-danger"
                >
                  삭제
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default LinkManager;
