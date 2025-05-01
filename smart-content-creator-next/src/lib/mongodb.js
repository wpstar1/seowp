// MongoDB 연결 라이브러리
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb+srv://asas83858385:Awotj0421!@cluster0.8yv7pet.mongodb.net/smart-content-creator?retryWrites=true&w=majority&appName=Cluster0';
const options = {
  useUnifiedTopology: true,
  useNewUrlParser: true,
};

let client;
let clientPromise;

if (process.env.NODE_ENV === 'development') {
  // 개발 환경에서는 전역 변수 사용
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // 프로덕션 환경에서는 새 인스턴스 생성
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;
