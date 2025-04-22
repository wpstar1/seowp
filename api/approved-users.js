// 승인된 VIP 사용자 목록을 관리하는 서버리스 API
// 이 파일은 Vercel 환경에서 /api/approved-users 경로로 접근할 수 있습니다

// 간단한 메모리 저장소 (Vercel 서버리스 환경에서는 재배포시 초기화됨)
// 실제 환경에서는 데이터베이스를 사용해야 하지만, 테스트를 위한 간단한 구현
let approvedUsers = [];

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
    // GET 요청 처리 - 승인된 사용자 목록 확인
    if (req.method === 'GET') {
      return res.status(200).json({ 
        success: true, 
        approvedUsers 
      });
    }
    
    // POST 요청 처리 - 새로운 승인 사용자 추가
    if (req.method === 'POST') {
      const { userId, approvalId, approvalStatus } = req.body;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: '사용자 ID가 필요합니다'
        });
      }
      
      // 이미 승인된 사용자인지 확인
      const existingIndex = approvedUsers.findIndex(user => user.userId === userId);
      
      if (existingIndex >= 0) {
        // 기존 사용자 정보 업데이트
        approvedUsers[existingIndex] = {
          userId,
          approvalId: approvalId || approvedUsers[existingIndex].approvalId,
          approvalStatus: approvalStatus || 'approved',
          approvedAt: new Date().toISOString()
        };
      } else {
        // 새 사용자 추가
        approvedUsers.push({
          userId,
          approvalId: approvalId || Date.now().toString(),
          approvalStatus: approvalStatus || 'approved',
          approvedAt: new Date().toISOString()
        });
      }
      
      return res.status(200).json({
        success: true,
        message: '사용자가 승인 목록에 추가되었습니다',
        user: approvedUsers.find(user => user.userId === userId)
      });
    }
    
    // 지원하지 않는 메서드
    return res.status(405).json({
      success: false,
      message: '지원하지 않는 요청 메서드입니다'
    });
    
  } catch (error) {
    console.error('승인된 사용자 처리 중 오류:', error);
    
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다',
      error: error.message
    });
  }
};
