// MongoDB 연결 클라이언트 - 브라우저 호환 버전
// 브라우저 환경에서는 실제 연결 대신 로컬 스토리지를 사용하는 모킹 기능 제공

// 유저 객체 인터페이스
class UserModel {
  constructor() {
    this.users = JSON.parse(localStorage.getItem('users') || '[]');
  }

  async findOne(query) {
    return this.users.find(user => 
      (query.username && user.username === query.username) || 
      (query._id && user._id === query._id)
    );
  }

  async find(query = {}) {
    if (Object.keys(query).length === 0) {
      return this.users;
    }
    
    return this.users.filter(user => {
      for (const key in query) {
        if (user[key] !== query[key]) return false;
      }
      return true;
    });
  }

  async create(userData) {
    const newUser = {
      ...userData,
      _id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.users.push(newUser);
    localStorage.setItem('users', JSON.stringify(this.users));
    return newUser;
  }

  async findByIdAndUpdate(id, update) {
    const index = this.users.findIndex(user => user._id === id);
    if (index === -1) return null;
    
    this.users[index] = {
      ...this.users[index],
      ...update,
      updatedAt: new Date()
    };
    
    localStorage.setItem('users', JSON.stringify(this.users));
    return this.users[index];
  }
}

// 모킹된 mongoose 인스턴스
const mongooseMock = {
  connect: () => Promise.resolve(),
  connection: {
    on: () => {}
  },
  models: {},
  model: (name) => {
    if (name === 'User') {
      return User;
    }
    return null;
  },
  Schema: function() {
    return {};
  }
};

// 브라우저 환경인지 확인
const isBrowser = typeof window !== 'undefined';

// 모킹된 mongoose 스키마 또는 실제 mongoose 사용
let mongoose;
let User;

if (isBrowser) {
  console.log('브라우저 환경에서 실행 중 - localStorage 사용');
  mongoose = mongooseMock;
  User = new UserModel();
} else {
  // Node.js 환경
  console.log('서버 환경에서 실행 중 - 실제 MongoDB 연결');
  mongoose = require('mongoose');
  
  const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String, default: '' },
    membershipType: { type: String, enum: ['regular', 'vip', 'admin'], default: 'regular' },
    vipStatus: { type: String, enum: ['none', 'pending', 'approved', 'rejected'], default: 'none' },
    membershipExpiry: { type: Date },
    dailyUsageCount: { type: Number, default: 0 },
    previousKeywords: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  });
  
  try {
    User = mongoose.model('User');
  } catch (error) {
    User = mongoose.model('User', UserSchema);
  }
}

// 데이터베이스 연결 함수 
export async function connectDB() {
  if (isBrowser) {
    console.log('브라우저 환경: 가상 DB 연결');
    return Promise.resolve();
  }
  
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-content-creator';
    await mongoose.connect(uri);
    console.log('MongoDB에 연결되었습니다');
    return mongoose.connection;
  } catch (error) {
    console.error('MongoDB 연결 오류:', error);
    throw error;
  }
}

export { mongoose, User };
