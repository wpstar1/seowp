// Vercel 서버리스 함수 - VIP 승인/거절 처리
const admin = require('firebase-admin');
const { handleApproval } = require('../server/telegramBot');

// Firebase 초기화가 되어 있지 않은 경우에만 초기화
if (!admin.apps.length) {
  // 환경 변수에서 Firebase 설정을 가져와 초기화
  try {
    // Vercel 환경에서는 환경 변수에 저장된 서비스 계정 정보 사용
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (error) {
    console.error('Firebase 초기화 오류:', error);
  }
}

// Vercel 서버리스 함수 핸들러
module.exports = async (req, res) => {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONS 요청 처리 (프리플라이트 요청)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { requestId, action } = req.query;
    
    // 파라미터 유효성 검사
    if (!requestId || !action) {
      return res.status(400).json({ 
        success: false, 
        message: '필수 파라미터가 누락되었습니다.' 
      });
    }
    
    // 승인/거절 처리
    const isApproved = action === 'approve';
    await handleApproval(requestId, isApproved);
    
    // 처리 결과 반환
    return res.status(200).json({
      success: true,
      message: isApproved ? 'VIP 승인이 완료되었습니다.' : 'VIP 요청이 거절되었습니다.'
    });
  } catch (error) {
    console.error('승인 처리 중 오류:', error);
    
    return res.status(500).json({
      success: false,
      message: '처리 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};
