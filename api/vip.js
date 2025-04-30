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
    // VIP 상태 확인 (GET)
    if (req.method === 'GET') {
      const { username } = req.query;
      
      if (!username) {
        return res.status(400).json({ 
          success: false, 
          message: '사용자명이 필요합니다.' 
        });
      }
      
      // 관리자 계정은 항상 VIP
      if (username === '1111') {
        return res.status(200).json({ 
          success: true, 
          isVip: true, 
          message: '관리자 계정입니다.' 
        });
      }
      
      // 사용자 조회
      const user = await prisma.user.findUnique({
        where: { username }
      });
      
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          isVip: false, 
          message: '사용자를 찾을 수 없습니다.' 
        });
      }
      
      // VIP 멤버십 상태 확인
      if (user.membershipType === 'vip' && user.vipStatus === 'approved') {
        // 만료일 확인
        if (user.membershipExpiry) {
          const now = new Date();
          const expiryDate = new Date(user.membershipExpiry);
          
          if (now > expiryDate) {
            // 만료된 경우 업데이트
            await prisma.user.update({
              where: { username },
              data: {
                membershipType: 'regular',
                vipStatus: null
              }
            });
            return res.status(200).json({ 
              success: true, 
              isVip: false, 
              message: 'VIP 멤버십이 만료되었습니다.' 
            });
          }
          
          // 만료되지 않음
          const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
          return res.status(200).json({ 
            success: true, 
            isVip: true, 
            message: `VIP 멤버십 사용 중 (${daysLeft}일 남음)`,
            expiryDate: user.membershipExpiry
          });
        }
        
        return res.status(200).json({ 
          success: true, 
          isVip: true, 
          message: 'VIP 멤버십 사용 중' 
        });
      }
      
      // VIP 신청 대기 중
      if (user.vipStatus === 'pending') {
        return res.status(200).json({ 
          success: true, 
          isVip: false, 
          isPending: true, 
          message: 'VIP 승인 대기 중입니다.' 
        });
      }
      
      // 일반 회원
      return res.status(200).json({ 
        success: true, 
        isVip: false, 
        message: '일반 회원입니다.' 
      });
    }
    
    // VIP 승인 처리 (POST) - 관리자용
    else if (req.method === 'POST') {
      const { username, status, approvedBy } = req.body;
      
      if (!username || !status || !approvedBy) {
        return res.status(400).json({ 
          success: false, 
          message: '모든 필수 필드를 입력해주세요.' 
        });
      }
      
      // 관리자 권한 확인
      if (approvedBy !== '1111') {
        return res.status(403).json({ 
          success: false, 
          message: '관리자 권한이 필요합니다.' 
        });
      }
      
      // 사용자 존재 확인
      const user = await prisma.user.findUnique({
        where: { username }
      });
      
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: '사용자를 찾을 수 없습니다.' 
        });
      }
      
      // 승인 상태에 따라 처리
      if (status === 'approved') {
        // 승인 처리
        await prisma.user.update({
          where: { username },
          data: {
            membershipType: 'vip',
            vipStatus: 'approved',
            membershipExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30일 후
          }
        });
        
        // VIP 요청 로그 업데이트
        await prisma.vipRequestLog.updateMany({
          where: { 
            username,
            status: 'pending'
          },
          data: {
            status: 'approved',
            approvedBy,
            responseDate: new Date()
          }
        });
        
        return res.status(200).json({ 
          success: true, 
          message: `${username} 사용자의 VIP 신청이 승인되었습니다.` 
        });
      } 
      else if (status === 'rejected') {
        // 거절 처리
        await prisma.user.update({
          where: { username },
          data: {
            vipStatus: 'rejected'
          }
        });
        
        // VIP 요청 로그 업데이트
        await prisma.vipRequestLog.updateMany({
          where: { 
            username,
            status: 'pending'
          },
          data: {
            status: 'rejected',
            approvedBy,
            responseDate: new Date()
          }
        });
        
        return res.status(200).json({ 
          success: true, 
          message: `${username} 사용자의 VIP 신청이 거절되었습니다.` 
        });
      }
      
      return res.status(400).json({ 
        success: false, 
        message: '잘못된 처리 상태입니다.' 
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
    console.error('VIP 처리 중 오류:', error);
    return res.status(500).json({ 
      success: false, 
      message: '서버 오류가 발생했습니다.' 
    });
  }
};
