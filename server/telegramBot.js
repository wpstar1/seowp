const TelegramBot = require('node-telegram-bot-api');
const admin = require('firebase-admin');

// Firebase Admin 초기화
let firebaseInitialized = false;

try {
  // 환경 변수에서 서비스 계정 정보 가져오기 시도
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    firebaseInitialized = true;
    console.log('Firebase가 환경 변수를 통해 초기화되었습니다.');
  } 
  // 로컬 파일에서 서비스 계정 정보 가져오기 시도 (개발 환경용)
  else {
    try {
      const serviceAccount = require('./serviceAccountKey.json');
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      firebaseInitialized = true;
      console.log('Firebase가 로컬 파일을 통해 초기화되었습니다.');
    } catch (localError) {
      console.warn('serviceAccountKey.json 파일을 찾을 수 없습니다. Firebase 기능이 제한됩니다:', localError.message);
    }
  }
} catch (error) {
  console.error('Firebase 초기화 오류:', error);
}

// Firestore 데이터베이스 참조
const db = firebaseInitialized ? admin.firestore() : null;

// 텔레그램 봇 토큰
const token = process.env.TELEGRAM_BOT_TOKEN || 'YOUR_TELEGRAM_BOT_TOKEN';
const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID || 'YOUR_ADMIN_CHAT_ID'; // 관리자의 텔레그램 채팅 ID

// 봇 생성
const bot = new TelegramBot(token, { polling: process.env.ENABLE_BOT_POLLING === 'true' });

// 승인 요청 처리
async function processPaymentRequest(userId, email) {
  try {
    // Firebase가 초기화되지 않았으면 메시지만 보내기
    if (!firebaseInitialized) {
      console.log('Firebase가 초기화되지 않아 데이터베이스 저장은 건너뜁니다.');
      
      // 관리자에게 승인 요청 메시지 보내기
      const appDomain = process.env.APP_DOMAIN || 'https://seo-beige.vercel.app';
      const confirmUrl = `${appDomain}/api/approve?requestId=simulatedId_${Date.now()}&action=confirm&userId=${userId}&email=${email}`;
      
      await bot.sendMessage(
        adminChatId,
        `💰 VIP 승인 요청\n\n사용자 ID: ${userId}\n결제 정보: ${email}\n요청 시간: ${new Date().toLocaleString()}\n\n승인 여부를 결정하려면 아래 링크를 클릭하세요:\n${confirmUrl}`
      );
      
      return `simulatedId_${Date.now()}`;
    }

    // Firebase가 초기화된 경우 정상 처리
    const requestId = `req_${Date.now()}_${userId}`;
    
    // 사용자 승인 요청을 Firestore에 저장
    await db.collection('approvalRequests').doc(requestId).set({
      userId,
      email,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    // 관리자에게 승인 요청 메시지 보내기
    const appDomain = process.env.APP_DOMAIN || 'https://seo-beige.vercel.app';
    const confirmUrl = `${appDomain}/api/approve?requestId=${requestId}&action=confirm`;
    
    await bot.sendMessage(
      adminChatId,
      `💰 VIP 승인 요청\n\n사용자 ID: ${userId}\n결제 정보: ${email}\n요청 시간: ${new Date().toLocaleString()}\n\n승인 여부를 결정하려면 아래 링크를 클릭하세요:\n${confirmUrl}`
    );
    
    return requestId;
  } catch (error) {
    console.error('승인 요청 처리 중 오류:', error);
    throw error;
  }
}

// 웹훅 라우트로 승인/거절 처리
async function handleApproval(requestId, isApproved) {
  try {
    if (!firebaseInitialized) {
      console.log('Firebase가 초기화되지 않아 승인 처리는 건너뜁니다.');
      return false;
    }

    const requestRef = db.collection('approvalRequests').doc(requestId);
    const request = await requestRef.get();
    
    if (!request.exists) {
      throw new Error('요청을 찾을 수 없습니다');
    }
    
    const data = request.data();
    
    if (data.status !== 'pending') {
      throw new Error('이미 처리된 요청입니다');
    }
    
    if (isApproved) {
      // 승인 처리
      const now = new Date();
      const expiryDate = new Date(now.setDate(now.getDate() + 30)); // 30일 후
      
      // 사용자 문서 업데이트
      await db.collection('users').doc(data.userId).update({
        membershipType: 'vip',
        membershipExpiry: admin.firestore.Timestamp.fromDate(expiryDate),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      // 승인 요청 상태 업데이트
      await requestRef.update({
        status: 'approved',
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      // 사용자에게 알림 보내기 (이메일 또는 앱 내 알림)
      // ...
      
      // 관리자에게 승인 완료 메시지
      await bot.sendMessage(
        adminChatId,
        `✅ VIP 승인 완료\n이메일: ${data.email}\n유효기간: ${expiryDate.toLocaleDateString()}`
      );
    } else {
      // 거절 처리
      await requestRef.update({
        status: 'rejected',
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      // 관리자에게 거절 완료 메시지
      await bot.sendMessage(
        adminChatId,
        `❌ VIP 승인 거절\n이메일: ${data.email}`
      );
    }
    
    return true;
  } catch (error) {
    console.error('승인 처리 중 오류:', error);
    throw error;
  }
}

// 30일 이후 멤버십 만료 처리 (Cloud Function으로 구현 예정)
async function checkExpiredMemberships() {
  if (!firebaseInitialized) {
    console.log('Firebase가 초기화되지 않아 멤버십 만료 확인은 건너뜁니다.');
    return;
  }

  const now = admin.firestore.Timestamp.now();
  
  try {
    // 만료된 VIP 회원 찾기
    const snapshot = await db.collection('users')
      .where('membershipType', '==', 'vip')
      .where('membershipExpiry', '<', now)
      .get();
    
    const batch = db.batch();
    
    snapshot.docs.forEach(doc => {
      // 일반 회원으로 다운그레이드
      batch.update(doc.ref, {
        membershipType: 'regular',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });
    
    await batch.commit();
    console.log(`${snapshot.size}명의 만료된 VIP 회원을 일반 회원으로 변경했습니다.`);
  } catch (error) {
    console.error('멤버십 만료 확인 중 오류:', error);
  }
}

// 모듈 내보내기
module.exports = {
  processPaymentRequest,
  handleApproval,
  checkExpiredMemberships
};
