// 관리자 API - 모든 사용자 정보와 VIP 신청 정보를 가져옴
const prisma = require('./prisma');

module.exports = async (req, res) => {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // OPTIONS 요청 처리
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 관리자 인증 확인 (실제 환경에서는 더 강력한 인증이 필요)
  const { authorization } = req.headers;
  if (!authorization || authorization !== 'admin-token') {
    console.log('인증 실패:', authorization);
    return res.status(401).json({ error: '관리자 인증이 필요합니다.' });
  }

  try {
    console.log('관리자 API 호출됨: 사용자 목록 및 VIP 신청 조회 시작');
    
    // 개선된 오류 처리를 사용하여 데이터베이스에서 사용자 가져오기
    const allUsers = await prisma.$handleError(async () => {
      return await prisma.user.findMany({
        select: {
          id: true,
          username: true,
          email: true,
          membershipType: true,
          vipStatus: true,
          depositName: true,
          membershipExpiry: true,
          createdAt: true
        }
      });
    });

    console.log(`데이터베이스에서 ${allUsers.length}명의 사용자를 가져왔습니다.`);
    
    // 로컬 스토리지에서 사용자 가져오기 (fallback)
    let localUsers = [];
    try {
      // 로컬 스토리지 로직은 서버에서 사용할 수 없으므로 이 부분은 프론트엔드에서 처리해야 함
      console.log('로컬 스토리지에서 사용자를 가져오는 것은 서버에서 지원되지 않습니다.');
    } catch (localError) {
      console.error('로컬 스토리지 데이터 처리 중 오류:', localError);
    }
    
    // VIP 신청 목록 가져오기 (vipStatus가 'pending'인 사용자)
    const pendingVipRequests = allUsers.filter(user => user.vipStatus === 'pending');
    console.log(`${pendingVipRequests.length}개의 대기 중인 VIP 요청이 있습니다.`);
    
    // API 응답 구성
    const response = {
      success: true,
      users: allUsers,
      pendingVipRequests: pendingVipRequests.length,
      timestamp: new Date().toISOString()
    };
    
    console.log('관리자 API 응답 완료');
    return res.status(200).json(response);
  } catch (error) {
    console.error('관리자 API 오류:', error);
    
    // 자세한 오류 정보 반환 (개발 환경에서만 이렇게 하세요)
    return res.status(500).json({
      success: false,
      error: error.code || 'UNKNOWN_ERROR',
      message: error.message || '사용자 목록을 가져오는 중 오류가 발생했습니다.',
      stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
    });
  }
};
