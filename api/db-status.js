// MongoDB 연결 상태 확인 API
const { MongoClient } = require('mongodb');

// MongoDB 연결 URL
const MONGODB_URI = "mongodb+srv://seouser:Seopass123@cluster0.8yv7pet.mongodb.net/smart-content-creator?retryWrites=true&w=majority";

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: '허용되지 않는 메소드입니다.' });
  }

  let client;
  try {
    // MongoDB 연결 시도
    client = new MongoClient(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      connectTimeoutMS: 10000 // 10초 타임아웃
    });

    await client.connect();
    
    // 연결 성공
    return res.status(200).json({ isConnected: true });
  } catch (error) {
    console.error('MongoDB 연결 오류:', error);
    return res.status(200).json({ isConnected: false, error: error.message });
  } finally {
    // 연결 해제
    if (client) {
      await client.close();
    }
  }
}
