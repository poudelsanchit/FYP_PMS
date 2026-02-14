import { PrismaClient } from '@/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = global as unknown as {
    prisma?: PrismaClient
}

let prisma: PrismaClient

if (process.env.NODE_ENV === 'production') {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  })
  prisma = new PrismaClient({
    adapter,
  })
} else {
  if (!globalForPrisma.prisma) {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    })
    globalForPrisma.prisma = new PrismaClient({
      adapter,
    })
  }
  prisma = globalForPrisma.prisma
}

export { prisma }