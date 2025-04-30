// 로컬 MongoDB 연결 테스트
const { MongoClient } = require('mongodb');

// 연결 문자열
const uri = "mongodb+srv://asas83858385:Awotj0421!@cluster0.8yv7pet.mongodb.net/smart-content-creator?retryWrites=true&w=majority&appName=Cluster0";

async function testConnection() {
  console.log('MongoDB 연결 테스트 시작...');
  
  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    connectTimeoutMS: 30000,
    socketTimeoutMS: 45000
  });

  try {
    console.log('연결 시도 중...');
    await client.connect();
    console.log('MongoDB 연결 성공!');
    
    const db = client.db('smart-content-creator');
    console.log('데이터베이스 선택: smart-content-creator');
    
    // 컬렉션 리스트 확인
    const collections = await db.listCollections().toArray();
    console.log('컬렉션 목록:');
    collections.forEach(coll => console.log(` - ${coll.name}`));
    
    // 간단한 테스트 실행
    const pingResult = await db.command({ ping: 1 });
    console.log('핑 결과:', pingResult);
    
    // 컬렉션 없으면 생성
    if (!collections.some(c => c.name === 'users')) {
      console.log('users 컬렉션이 없어 생성합니다.');
      await db.createCollection('users');
    }
    
    // 테스트 사용자 추가
    const usersCollection = db.collection('users');
    const testUser = {
      username: 'testuser',
      password: 'hashedpassword',
      email: 'test@example.com',
      createdAt: new Date(),
      isAdmin: false
    };
    
    const result = await usersCollection.insertOne(testUser);
    console.log('테스트 사용자 추가 결과:', result);
    
    // 모든 사용자 조회
    const allUsers = await usersCollection.find({}).toArray();
    console.log(`전체 사용자 수: ${allUsers.length}`);
    console.log('사용자 목록:');
    allUsers.forEach(user => {
      console.log(` - ${user.username} (${user.email})`);
    });
    
  } catch (err) {
    console.error('MongoDB 연결 오류:', err);
  } finally {
    console.log('연결 종료 중...');
    await client.close();
    console.log('연결 종료됨.');
  }
}

// 테스트 실행
testConnection()
  .then(() => console.log('테스트 완료'))
  .catch(err => console.error('테스트 중 오류 발생:', err));
