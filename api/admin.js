const prisma = require('./prisma');

module.exports = async (req, res) => {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // OPTIONS 요청 처리 (CORS preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // 관리자 권한 확인
    const { adminUsername } = req.query;
    if (!adminUsername || adminUsername !== '1111') {
      return res.status(403).json({ 
        success: false, 
        message: '관리자 권한이 필요합니다.' 
      });
    }
    
    // VIP 신청 목록 조회 (GET)
    if (req.method === 'GET') {
      // 대기 중인 VIP 요청 조회
      const pendingUsers = await prisma.user.findMany({
        where: { vipStatus: 'pending' },
        select: {
          username: true,
          depositName: true,
          createdAt: true
        }
      });
      
      return res.status(200).json({ 
        success: true, 
        requests: pendingUsers 
      });
    }
    
    // 지원하지 않는 메소드
    else {
      return res.status(405).json({ 
        success: false, 
        message: '허용되지 않는 메소드입니다.' 
      });
    }
  } catch (error) {
    console.error('관리자 처리 중 오류:', error);
    return res.status(500).json({ 
      success: false, 
      message: '서버 오류가 발생했습니다.' 
    });
  }
};
