const { PrismaClient } = require('@prisma/client');

// PrismaClient는 서버 사이드에서만 실행됨
const prisma = new PrismaClient();

module.exports = prisma;
