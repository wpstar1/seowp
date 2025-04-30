// 간단한 MongoDB 연결 모듈
const { MongoClient, ObjectId } = require('mongodb');

// 전역 변수로 연결 클라이언트와 DB 인스턴스 보관
let client;
let db;

// MongoDB 연결 - 싱글톤 패턴
async function connectToDatabase() {
  if (db) {
    console.log('이미 연결된 DB 인스턴스를 반환합니다.');
    return { client, db };
  }

  try {
    // 여러 환경변수 이름 시도 (MONGO_URL, DATABASE_URL, MONGODB_URI 중 하나 사용)
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URL || process.env.DATABASE_URL;
    
    // 디버깅 로그 추가
    console.log('MongoDB 연결 시도 중...');
    console.log('환경변수 확인:', {
      MONGO_URL_exists: !!process.env.MONGO_URL,
      DATABASE_URL_exists: !!process.env.DATABASE_URL,
      MONGODB_URI_exists: !!process.env.MONGODB_URI
    });
    console.log('사용할 URI:', mongoUri ? '설정됨 (보안상 표시하지 않음)' : '설정되지 않음');
    
    // 연결 문자열이 없으면 로컬 스토리지 모드
    if (!mongoUri) {
      console.log('MongoDB URI가 설정되지 않았습니다. 로컬 스토리지 모드로 작동합니다.');
      return { client: null, db: null };
    }

    // URI 디코딩 - URL 인코딩된 문자 처리
    const decodedUri = decodeURIComponent(mongoUri);
    
    // 연결 시도
    console.log('MongoDB에 연결 중...');
    client = new MongoClient(decodedUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      connectTimeoutMS: 10000, // 타임아웃 10초로 늘림
      socketTimeoutMS: 10000
    });
    await client.connect();
    console.log('MongoDB 연결 성공!');
    
    // 데이터베이스 선택 (URI에서 데이터베이스 부분 추출)
    const dbName = decodedUri.split('/').pop().split('?')[0] || 'smart_content_creator';
    db = client.db(dbName);
    
    // 컬렉션이 존재하지 않으면 생성
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    if (!collectionNames.includes('users')) {
      await db.createCollection('users');
      console.log('users 컬렉션 생성됨');
    }
    
    return { client, db };
  } catch (error) {
    console.error('MongoDB 연결 실패:', error.message);
    return { client: null, db: null };
  }
}

// ObjectId 변환 헬퍼
function toObjectId(id) {
  if (!id) return null;
  try {
    return new ObjectId(id);
  } catch (error) {
    return null;
  }
}

module.exports = {
  connectToDatabase,
  toObjectId,
  ObjectId
};
