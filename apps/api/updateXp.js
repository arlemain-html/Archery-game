const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.user.updateMany({ data: { xp: 5000 } });
  console.log('Updated users:', result.count);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
