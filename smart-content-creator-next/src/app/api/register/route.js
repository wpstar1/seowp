// 사용자 등록 API 라우트
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    // 요청 데이터 파싱
    const data = await request.json();
    const { username, password, email } = data;
    
    // 필수 필드 검증
    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: '사용자명과 비밀번호는 필수 항목입니다.' },
        { status: 400 }
      );
    }
    
    // MongoDB 연결
    const client = await clientPromise;
    const db = client.db('smart-content-creator');
    const usersCollection = db.collection('users');
    
    // 사용자명 중복 확인
    const existingUser = await usersCollection.findOne({ username });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: '이미 사용 중인 사용자명입니다.' },
        { status: 400 }
      );
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
    
    return NextResponse.json(
      {
        success: true,
        message: '사용자가 성공적으로 등록되었습니다.',
        user: userWithoutPassword
      },
      { status: 201 }
    );
    
  } catch (error) {
    console.error('사용자 등록 중 오류 발생:', error);
    return NextResponse.json(
      {
        success: false,
        message: '서버 오류가 발생했습니다.',
        error: error.message
      },
      { status: 500 }
    );
  }
}
