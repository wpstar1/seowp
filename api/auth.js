const prisma = require('./prisma');

// 사용자 로그인 API
module.exports = async (req, res) => {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // OPTIONS 요청 처리 (CORS preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // POST 요청이 아닌 경우 에러 반환
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '허용되지 않는 메소드입니다.' });
  }
  
  try {
    const { action, username, password, confirmPassword, depositName } = req.body;
    
    // 로그인 처리
    if (action === 'login') {
      if (!username || !password) {
        return res.status(400).json({ 
          success: false, 
          message: '사용자명과 비밀번호를 모두 입력해주세요.' 
        });
      }
      
      // 사용자 조회
      const user = await prisma.user.findUnique({
        where: { username }
      });
      
      if (!user || user.password !== password) {
        return res.status(401).json({ 
          success: false, 
          message: '아이디 또는 비밀번호가 올바르지 않습니다.' 
        });
      }
      
      // VIP 멤버십 기간 확인
      if (user.membershipType === 'vip' && user.membershipExpiry) {
        const now = new Date();
        const expiryDate = new Date(user.membershipExpiry);
        
        // 만료되었으면 멤버십 타입 변경
        if (now > expiryDate) {
          await prisma.user.update({
            where: { username },
            data: {
              membershipType: 'regular',
              vipStatus: null
            }
          });
          user.membershipType = 'regular';
          user.vipStatus = null;
        }
      }
      
      // 관리자 계정 특별 처리 (1111)
      if (username === '1111') {
        await prisma.user.update({
          where: { username },
          data: {
            membershipType: 'vip',
            vipStatus: 'approved'
          }
        });
        user.membershipType = 'vip';
        user.vipStatus = 'approved';
      }
      
      // 비밀번호 제외하고 응답
      const userWithoutPassword = {
        username: user.username,
        membershipType: user.membershipType,
        vipStatus: user.vipStatus,
        depositName: user.depositName,
        membershipExpiry: user.membershipExpiry
      };
      
      return res.status(200).json({
        success: true,
        user: userWithoutPassword
      });
    }
    
    // 회원가입 처리
    else if (action === 'register') {
      // 입력 유효성 검증
      if (!username || !password || !confirmPassword) {
        return res.status(400).json({ 
          success: false, 
          message: '모든 필드를 입력해주세요.' 
        });
      }
      
      if (password !== confirmPassword) {
        return res.status(400).json({ 
          success: false, 
          message: '비밀번호가 일치하지 않습니다.' 
        });
      }
      
      // 사용자명 길이 검증
      if (username.length < 3) {
        return res.status(400).json({ 
          success: false, 
          message: '사용자명은 3자 이상이어야 합니다.' 
        });
      }
      
      // 비밀번호 길이 검증
      if (password.length < 4) {
        return res.status(400).json({ 
          success: false, 
          message: '비밀번호는 4자 이상이어야 합니다.' 
        });
      }
      
      // 이미 존재하는 사용자인지 확인
      const existingUser = await prisma.user.findUnique({
        where: { username }
      });
      
      if (existingUser) {
        return res.status(400).json({ 
          success: false, 
          message: '이미 존재하는 사용자명입니다.' 
        });
      }
      
      // 새 사용자 생성
      const newUser = await prisma.user.create({
        data: {
          username,
          password,
          membershipType: 'regular'
        }
      });
      
      const userWithoutPassword = {
        username: newUser.username,
        membershipType: newUser.membershipType
      };
      
      return res.status(201).json({
        success: true,
        message: '회원가입이 완료되었습니다.',
        user: userWithoutPassword
      });
    }
    
    // VIP 신청 처리
    else if (action === 'request-vip') {
      if (!username || !depositName) {
        return res.status(400).json({ 
          success: false, 
          message: '사용자명과 입금자명을 모두 입력해주세요.' 
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
      
      // 이미 VIP이거나 대기 중인 경우
      if (user.membershipType === 'vip') {
        return res.status(400).json({ 
          success: false, 
          message: '이미 VIP 회원입니다.' 
        });
      }
      
      if (user.vipStatus === 'pending') {
        return res.status(400).json({ 
          success: false, 
          message: '이미 VIP 승인 대기 중입니다.' 
        });
      }
      
      // VIP 신청 상태로 업데이트
      await prisma.user.update({
        where: { username },
        data: {
          vipStatus: 'pending',
          depositName
        }
      });
      
      // VIP 요청 로그 생성
      await prisma.vipRequestLog.create({
        data: {
          username,
          status: 'pending',
          depositName,
          requestDate: new Date()
        }
      });
      
      return res.status(200).json({ 
        success: true, 
        message: 'VIP 신청이 완료되었습니다. 관리자 승인 후 사용 가능합니다.' 
      });
    }
    
    // 지원하지 않는 액션
    else {
      return res.status(400).json({ 
        success: false, 
        message: '지원하지 않는 작업입니다.' 
      });
    }
  } catch (error) {
    console.error('인증 처리 중 오류:', error);
    return res.status(500).json({ 
      success: false, 
      message: '서버 오류가 발생했습니다.' 
    });
  }
};
