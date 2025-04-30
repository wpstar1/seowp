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
    
    // 사용자 목록 조회 (GET)
    if (req.method === 'GET') {
      console.log('관리자 API: 모든 사용자 목록 조회 시도');
      
      try {
        // 전체 사용자 목록 조회 (Prisma 사용)
        const allUsers = await prisma.user.findMany({
          select: {
            username: true,
            membershipType: true,
            vipStatus: true,
            depositName: true,
            membershipExpiry: true,
            createdAt: true
          }
        });
        
        console.log(`관리자 API: Prisma로 ${allUsers.length}명의 사용자 목록 조회 성공:`, allUsers);
        
        // 대기 중인 VIP 요청 조회
        const pendingUsers = await prisma.user.findMany({
          where: { vipStatus: 'pending' },
          select: {
            username: true,
            depositName: true,
            createdAt: true
          }
        });
        
        console.log(`관리자 API: ${pendingUsers.length}명의 VIP 승인 대기 사용자 조회`);
        
        return res.status(200).json({ 
          success: true, 
          users: allUsers,
          requests: pendingUsers,
          apiUserCount: allUsers.length
        });
      } catch (dbError) {
        console.error('사용자 목록 조회 중 DB 오류:', dbError);
        
        return res.status(500).json({ 
          success: false, 
          message: '데이터베이스 조회 중 오류가 발생했습니다.',
          error: dbError.message
        });
      }
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
      message: '서버 오류가 발생했습니다.',
      error: error.message
    });
  }
};
