// 간단한 테스트 API
module.exports = async (req, res) => {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // 간단한 응답 객체
  const response = {
    success: true,
    message: 'API 테스트 성공',
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV || 'not set',
      MONGO_URL_exists: !!process.env.MONGO_URL,
      MONGO_URL_length: process.env.MONGO_URL ? process.env.MONGO_URL.length : 0,
      DATABASE_URL_exists: !!process.env.DATABASE_URL,
      MONGODB_URI_exists: !!process.env.MONGODB_URI
    },
    headers: {
      host: req.headers.host,
      userAgent: req.headers['user-agent']
    }
  };
  
  // JSON 형식으로 응답
  try {
    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).send(`Error: ${error.message}`);
  }
};
