// VIP 상태 관리 API 라우트
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

// VIP 승인/거부 처리
export async function GET(request) {
  try {
    // URL 파라미터 추출
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action'); // approve 또는 reject
    const username = searchParams.get('username');
    
    // 필수 파라미터 검증
    if (!action || !username) {
      return NextResponse.json(
        { success: false, message: 'action과 username은 필수 파라미터입니다.' },
        { status: 400 }
      );
    }
    
    // 유효한 액션 검증
    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json(
        { success: false, message: 'action은 approve 또는 reject만 가능합니다.' },
        { status: 400 }
      );
    }
    
    // MongoDB 연결
    const client = await clientPromise;
    const db = client.db('smart-content-creator');
    const usersCollection = db.collection('users');
    
    // 사용자 존재 확인
    const user = await usersCollection.findOne({ username });
    if (!user) {
      return NextResponse.json(
        { success: false, message: '존재하지 않는 사용자입니다.' },
        { status: 404 }
      );
    }
    
    // VIP 상태 업데이트
    const vipStatus = action === 'approve' ? 'approved' : 'rejected';
    const membershipType = action === 'approve' ? 'vip' : 'free';
    
    // VIP 승인 시 30일 유효기간 설정
    const vipExpiryDate = action === 'approve' 
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30일 후
      : null;
    
    const updateResult = await usersCollection.updateOne(
      { username },
      { 
        $set: { 
          vipStatus,
          membershipType,
          vipExpiryDate,
          updatedAt: new Date()
        } 
      }
    );
    
    if (updateResult.modifiedCount === 0) {
      return NextResponse.json(
        { success: false, message: '사용자 상태 업데이트에 실패했습니다.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: `VIP 신청이 성공적으로 ${action === 'approve' ? '승인' : '거부'}되었습니다.`,
      username,
      vipStatus,
      membershipType,
      vipExpiryDate
    });
    
  } catch (error) {
    console.error('VIP 상태 변경 중 오류 발생:', error);
    
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

// VIP 신청 처리
export async function POST(request) {
  try {
    // 요청 데이터 파싱
    const data = await request.json();
    const { username } = data;
    
    if (!username) {
      return NextResponse.json(
        { success: false, message: 'username은 필수 항목입니다.' },
        { status: 400 }
      );
    }
    
    // MongoDB 연결
    const client = await clientPromise;
    const db = client.db('smart-content-creator');
    const usersCollection = db.collection('users');
    
    // 사용자 존재 확인
    const user = await usersCollection.findOne({ username });
    if (!user) {
      return NextResponse.json(
        { success: false, message: '존재하지 않는 사용자입니다.' },
        { status: 404 }
      );
    }
    
    // 이미 VIP 신청/승인된 상태 확인
    if (user.vipStatus === 'pending' || user.vipStatus === 'approved') {
      const status = user.vipStatus === 'pending' ? '신청 중' : '이미 승인됨';
      return NextResponse.json(
        { success: false, message: `VIP가 이미 ${status}입니다.` },
        { status: 400 }
      );
    }
    
    // VIP 신청 상태로 업데이트
    const updateResult = await usersCollection.updateOne(
      { username },
      { 
        $set: { 
          vipStatus: 'pending',
          vipRequestDate: new Date(),
          updatedAt: new Date()
        } 
      }
    );
    
    if (updateResult.modifiedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'VIP 신청 상태 업데이트에 실패했습니다.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'VIP 신청이 완료되었습니다. 관리자 승인을 기다려주세요.',
      username,
      vipStatus: 'pending'
    });
    
  } catch (error) {
    console.error('VIP 신청 중 오류 발생:', error);
    
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
