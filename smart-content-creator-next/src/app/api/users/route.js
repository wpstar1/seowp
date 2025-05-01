// 사용자 목록 API 라우트
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    // MongoDB 연결
    const client = await clientPromise;
    const db = client.db('smart-content-creator');
    
    console.log('사용자 목록 API 호출됨');
    
    // 사용자 컬렉션에서 데이터 조회
    const usersCollection = db.collection('users');
    const users = await usersCollection.find({}).toArray();
    
    console.log(`${users.length}명의 사용자를 찾았습니다.`);
    
    // 비밀번호 필드는 제외하고 반환
    const sanitizedUsers = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    
    // 성공 응답
    return NextResponse.json({
      success: true,
      message: '사용자 목록을 성공적으로 가져왔습니다.',
      users: sanitizedUsers
    });
    
  } catch (error) {
    console.error('사용자 목록 조회 중 오류:', error);
    
    // 오류 응답
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
