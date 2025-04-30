const prisma = require('./prisma');

module.exports = async (req, res) => {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // OPTIONS 요청 처리 (CORS preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // 콘텐츠 저장 (POST)
    if (req.method === 'POST') {
      const { username, title, content, keyword, previousKeyword } = req.body;
      
      if (!username) {
        return res.status(400).json({ 
          success: false, 
          message: '사용자명이 필요합니다.' 
        });
      }
      
      // 사용자 조회
      const user = await prisma.user.findUnique({
        where: { username }
      });
      
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: '사용자를 찾을 수 없습니다.' 
        });
      }
      
      // 이전 키워드 저장
      if (previousKeyword) {
        await prisma.previousKeyword.create({
          data: {
            keyword: previousKeyword,
            userId: user.id
          }
        });
      }
      
      // 생성된 콘텐츠 저장
      if (title && content && keyword) {
        const savedContent = await prisma.generatedContent.create({
          data: {
            title,
            content,
            keyword,
            userId: user.id
          }
        });
        
        return res.status(201).json({ 
          success: true, 
          message: '콘텐츠가 저장되었습니다.',
          contentId: savedContent.id
        });
      }
      
      return res.status(200).json({ 
        success: true, 
        message: '데이터가 저장되었습니다.' 
      });
    }
    
    // 콘텐츠 조회 (GET)
    else if (req.method === 'GET') {
      const { username, type } = req.query;
      
      if (!username) {
        return res.status(400).json({ 
          success: false, 
          message: '사용자명이 필요합니다.' 
        });
      }
      
      // 사용자 조회
      const user = await prisma.user.findUnique({
        where: { username }
      });
      
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: '사용자를 찾을 수 없습니다.' 
        });
      }
      
      // 이전 키워드 조회
      if (type === 'keywords') {
        const keywords = await prisma.previousKeyword.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' },
          take: 10 // 최근 10개만
        });
        
        return res.status(200).json({ 
          success: true, 
          keywords: keywords.map(k => k.keyword)
        });
      }
      
      // 저장된 콘텐츠 조회
      else if (type === 'contents') {
        const contents = await prisma.generatedContent.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' }
        });
        
        return res.status(200).json({ 
          success: true, 
          contents
        });
      }
      
      // 링크 조회
      else if (type === 'links') {
        const links = await prisma.link.findMany({
          where: { userId: user.id }
        });
        
        return res.status(200).json({ 
          success: true, 
          links
        });
      }
      
      return res.status(400).json({ 
        success: false, 
        message: '잘못된 데이터 유형입니다.' 
      });
    }
    
    // 지원하지 않는 메소드
    else {
      return res.status(405).json({ 
        success: false, 
        message: '허용되지 않는 메소드입니다.' 
      });
    }
  } catch (error) {
    console.error('콘텐츠 처리 중 오류:', error);
    return res.status(500).json({ 
      success: false, 
      message: '서버 오류가 발생했습니다.' 
    });
  }
};
