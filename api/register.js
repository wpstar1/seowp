// 사용자 등록 API
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

module.exports = async (req, res) => {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // OPTIONS 요청 처리
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // POST 요청이 아닌 경우 오류 반환
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: '허용되지 않는 메소드입니다.' });
  }
  
  try {
    // 요청 데이터 파싱
    const { username, password, email } = req.body;
    
    // 필수 필드 검증
    if (!username || !password) {
      return res.status(400).json({ success: false, message: '사용자명과 비밀번호는 필수 항목입니다.' });
    }
    
    // MongoDB 연결
    const uri = "mongodb+srv://seouser:Seopass123@cluster0.8yv7pet.mongodb.net/smart-content-creator?retryWrites=true&w=majority";
    const client = new MongoClient(uri, { 
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('MongoDB에 연결 중...');
    await client.connect();
    console.log('MongoDB 연결 성공!');
    
    const db = client.db('smart-content-creator');
    const usersCollection = db.collection('users');
    
    // 사용자명 중복 확인
    const existingUser = await usersCollection.findOne({ username });
    if (existingUser) {
      await client.close();
      return res.status(400).json({ success: false, message: '이미 사용 중인 사용자명입니다.' });
    }
    
    // 비밀번호 해싱
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // 사용자 생성
    const newUser = {
      username,
      password: hashedPassword,
      email: email || '',
      createdAt: new Date(),
      isAdmin: username === '1111', // 1111은 관리자 계정
      membershipType: username === '1111' ? 'vip' : 'free',
      vipStatus: username === '1111' ? 'approved' : 'none'
    };
    
    // 데이터베이스에 사용자 추가
    const result = await usersCollection.insertOne(newUser);
    console.log('신규 사용자가 생성되었습니다:', result.insertedId);
    
    // 비밀번호 제외하고 반환
    const { password: _, ...userWithoutPassword } = newUser;
    
    await client.close();
    return res.status(201).json({
      success: true,
      message: '사용자가 성공적으로 등록되었습니다.',
      user: userWithoutPassword
    });
    
  } catch (error) {
    console.error('사용자 등록 중 오류 발생:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error.message
    });
  }
};
