// 사용자 목록 반환 API
const { connectToDatabase } = require('./db');
const bcrypt = require('bcryptjs');

module.exports = async (req, res) => {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // OPTIONS 요청 처리 (CORS preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: '허용되지 않는 메소드입니다.' });
  }
  
  try {
    console.log('사용자 목록 API 호출됨');
    
    // MongoDB 연결
    const { db } = await connectToDatabase();
    
    // 연결 실패하면 오류 반환
    if (!db) {
      console.log('DB 연결 실패, 로컬 스토리지 모드 활성화');
      return res.status(200).json({
        success: false,
        message: 'MongoDB 연결 실패. 로컬 스토리지를 사용합니다.'
      });
    }
    
    // 사용자 목록 가져오기
    const users = await db.collection('users').find({}).toArray();
    console.log(`${users.length}명의 사용자를 찾았습니다.`);
    
    // 비밀번호 필드는 제외하고 반환
    const sanitizedUsers = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    
    return res.status(200).json({
      success: true,
      users: sanitizedUsers
    });
    
  } catch (error) {
    console.error('사용자 목록 조회 중 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error.message
    });
  }
};
