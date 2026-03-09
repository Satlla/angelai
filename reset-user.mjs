import { PrismaClient } from './src/generated/prisma/index.js'

const prisma = new PrismaClient()

const user = await prisma.user.findFirst({
  where: { email: { contains: 'alejandrosatlla' } },
  select: { id: true, email: true }
})

if (!user) {
  console.log('Usuario no encontrado')
  process.exit(0)
}

console.log('Reseteando:', user.email)

const [b, l, c, p] = await Promise.all([
  prisma.userBadge.deleteMany({ where: { userId: user.id } }),
  prisma.dailyLog.deleteMany({ where: { userId: user.id } }),
  prisma.checkIn.deleteMany({ where: { userId: user.id } }),
  prisma.userPreferences.deleteMany({ where: { userId: user.id } }),
])

await prisma.user.update({
  where: { id: user.id },
  data: { currentMedal: null, medalUpdatedAt: null }
})

console.log('✅ Listo:', { badges: b.count, logs: l.count, checkIns: c.count, prefs: p.count })
console.log('Cuenta mantenida — puedes hacer onboarding desde cero')

await prisma.$disconnect()
