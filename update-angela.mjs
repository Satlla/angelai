import 'dotenv/config'
import { PrismaClient } from './src/generated/prisma/index.js'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const { Pool } = pg

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 1,
})

const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

// Buscar a Angela Sanz
const user = await prisma.user.findFirst({
  where: {
    OR: [
      { name: { contains: 'Angela', mode: 'insensitive' } },
      { name: { contains: 'Sanz', mode: 'insensitive' } },
      { email: { contains: 'angela', mode: 'insensitive' } },
    ]
  },
  select: { id: true, name: true, email: true },
})

if (!user) {
  console.error('No se encontró ningún usuario Angela Sanz')
  process.exit(1)
}

console.log('Usuario:', user.name, user.email)

const lastCheckIn = await prisma.checkIn.findFirst({
  where: { userId: user.id },
  orderBy: { createdAt: 'desc' },
  select: { id: true, createdAt: true },
})

if (!lastCheckIn) {
  console.error('No tiene check-ins')
  process.exit(1)
}

console.log('Último check-in:', lastCheckIn.id, lastCheckIn.createdAt)

const updated = await prisma.checkIn.update({
  where: { id: lastCheckIn.id },
  data: {
    waist:       68,
    hips:        92,
    thighs:      54,
    arms:        23,   // bíceps en reposo
    bicepFlexed: 25,   // bíceps haciendo fuerza
  },
  select: { waist: true, hips: true, thighs: true, arms: true, bicepFlexed: true },
})

console.log('Medidas actualizadas:', updated)

await prisma.$disconnect()
await pool.end()
