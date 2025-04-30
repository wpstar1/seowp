import { PrismaClient } from '@prisma/client'

// PrismaClient는 글로벌 싱글톤으로 관리
// https://www.prisma.io/docs/guides/performance-and-optimization/connection-management
let prisma

if (typeof window === 'undefined') {
  // 서버 사이드에서 실행될 때
  if (process.env.NODE_ENV === 'production') {
    prisma = new PrismaClient()
  } else {
    // 개발 환경에서 hot reload 시 여러 인스턴스 생성 방지
    if (!global.prisma) {
      global.prisma = new PrismaClient()
    }
    prisma = global.prisma
  }
} else {
  // 클라이언트 사이드에서는 Edge Runtime 사용
  prisma = new PrismaClient()
}

export default prisma
