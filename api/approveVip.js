// VIP 승인 API
const prisma = require('./prisma');

module.exports = async (req, res) => {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // OPTIONS 요청 처리
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // POST 요청만 허용
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: '허용되지 않는 메소드입니다. POST만 사용 가능합니다.' 
    });
  }
  
  // 관리자 인증 확인
  const { authorization } = req.headers;
  if (!authorization || authorization !== 'admin-token') {
    console.log('인증 실패:', authorization);
    return res.status(401).json({ 
      success: false, 
      error: 'UNAUTHORIZED', 
      message: '관리자 인증이 필요합니다.' 
    });
  }

  try {
    // 요청 본문에서 사용자 이름 추출
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ 
        success: false, 
        error: 'MISSING_USERNAME', 
        message: '사용자 이름이 필요합니다.' 
      });
    }
    
    console.log(`VIP 승인 요청: ${username}`);
    
    // 개선된 오류 처리를 사용하여 사용자 업데이트
    const updatedUser = await prisma.$handleError(async () => {
      // 현재 날짜를 기준으로 30일 후의 날짜 계산
      const now = new Date();
      const expiry = new Date();
      expiry.setDate(now.getDate() + 30);
      
      return await prisma.user.update({
        where: { username },
        data: {
          vipStatus: 'approved',
          membershipType: 'vip',
          membershipExpiry: expiry,
          updatedAt: now
        }
      });
    });
    
    console.log(`VIP 승인 완료: ${username}, 만료일: ${updatedUser.membershipExpiry}`);
    
    // 성공 응답
    return res.status(200).json({
      success: true,
      message: `${username} 사용자의 VIP 승인이 완료되었습니다.`,
      user: {
        username: updatedUser.username,
        membershipType: updatedUser.membershipType,
        vipStatus: updatedUser.vipStatus,
        membershipExpiry: updatedUser.membershipExpiry
      }
    });
  } catch (error) {
    console.error('VIP 승인 중 오류:', error);
    
    // 사용자를 찾을 수 없는 경우
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: '해당 사용자를 찾을 수 없습니다.'
      });
    }
    
    // 기타 오류
    return res.status(500).json({
      success: false,
      error: error.code || 'UNKNOWN_ERROR',
      message: error.message || '서버 오류가 발생했습니다.',
      stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
    });
  }
};
