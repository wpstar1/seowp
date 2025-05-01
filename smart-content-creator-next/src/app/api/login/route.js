// 로그인 API 라우트
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    // 요청 데이터 파싱
    const data = await request.json();
    const { username, password } = data;
    
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
    
    // 사용자 검색
    const user = await usersCollection.findOne({ username });
    
    // 사용자가 존재하지 않는 경우
    if (!user) {
      return NextResponse.json(
        { success: false, message: '사용자명 또는 비밀번호가 일치하지 않습니다.' },
        { status: 401 }
      );
    }
    
    // 비밀번호 확인
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: '사용자명 또는 비밀번호가 일치하지 않습니다.' },
        { status: 401 }
      );
    }
    
    // 사용자 정보에서 비밀번호 제외
    const { password: _, ...userWithoutPassword } = user;
    
    // VIP 상태 확인 및 만료된 경우 업데이트
    if (user.membershipType === 'vip' && user.vipExpiryDate && new Date(user.vipExpiryDate) < new Date()) {
      // VIP 기간이 만료된 경우
      await usersCollection.updateOne(
        { _id: user._id },
        { 
          $set: { 
            membershipType: 'free',
            vipStatus: 'expired',
            updatedAt: new Date()
          } 
        }
      );
      
      userWithoutPassword.membershipType = 'free';
      userWithoutPassword.vipStatus = 'expired';
    }
    
    return NextResponse.json({
      success: true,
      message: '로그인에 성공했습니다.',
      user: userWithoutPassword
    });
    
  } catch (error) {
    console.error('로그인 중 오류 발생:', error);
    
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
