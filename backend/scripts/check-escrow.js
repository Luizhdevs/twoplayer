process.env.DATABASE_URL = "postgresql://neondb_owner:npg_hXY8mkMU5ZRi@ep-old-silence-aca1ol22-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const APPT_ID = "53604dd4-f4d4-4089-b1ee-1987dc9db4e9";
  const COLAB_USER_ID = "54336c85-ae0c-4946-bdf3-b629e5356a0f";

  const appt = await prisma.appointment.findFirst({ where: { id: APPT_ID } });
  console.log("Appointment:", JSON.stringify(appt, null, 2));

  const escrow = await prisma.$queryRaw`SELECT * FROM escrows WHERE "appointmentId" = ${APPT_ID}`;
  console.log("\nEscrow:", JSON.stringify(escrow, null, 2));

  const wallet = await prisma.wallet.findFirst({ where: { ownerId: COLAB_USER_ID } });
  console.log("\nWallet:", JSON.stringify(wallet, null, 2));

  const txs = await prisma.walletTransaction.findMany({
    where: { walletId: wallet?.id },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  console.log("\nTransactions:", JSON.stringify(txs, null, 2));
}

main().catch(e => console.error(e.message)).finally(() => prisma.$disconnect());
