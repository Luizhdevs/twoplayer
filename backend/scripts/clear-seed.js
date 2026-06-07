/**
 * Remove apenas os dados de seed (Neymar, Gaules, Cazé + usuários de teste).
 * Preserva contas reais (testes@testes.com, etc.).
 * Execução: node scripts/clear-seed.js
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const SEED_EMAILS = [
  'neymar@twoplayers.com',
  'gaules@twoplayers.com',
  'caze@twoplayers.com',
  'deyvison@twoplayers.com',
  'lucas@twoplayers.com',
  'ana@twoplayers.com',
];

async function main() {
  console.log('🔍 Buscando usuários de seed...');

  const users = await prisma.user.findMany({
    where: { email: { in: SEED_EMAILS } },
    select: { id: true, email: true, role: true },
  });

  if (users.length === 0) {
    console.log('✅ Nenhum dado de seed encontrado. Nada a remover.');
    return;
  }

  console.log(`📋 Encontrados ${users.length} usuários:`);
  users.forEach(u => console.log(`   - ${u.email} (${u.role})`));

  const userIds = users.map(u => u.id);

  // Busca providers desses usuários
  const providers = await prisma.provider.findMany({
    where: { userId: { in: userIds } },
    select: { id: true },
  });
  const providerIds = providers.map(p => p.id);

  // Busca serviços
  const services = await prisma.service.findMany({
    where: { providerId: { in: providerIds } },
    select: { id: true },
  });
  const serviceIds = services.map(s => s.id);

  // Busca agendamentos
  const appointments = await prisma.appointment.findMany({
    where: {
      OR: [
        { userId: { in: userIds } },
        { providerId: { in: providerIds } },
      ],
    },
    select: { id: true },
  });
  const appointmentIds = appointments.map(a => a.id);

  // Busca carteiras
  const wallets = await prisma.wallet.findMany({
    where: { ownerId: { in: userIds } },
    select: { id: true },
  });
  const walletIds = wallets.map(w => w.id);

  console.log('\n🗑️  Removendo na ordem correta...');

  // 1. Transações de carteira
  const txDel = await prisma.walletTransaction.deleteMany({ where: { walletId: { in: walletIds } } });
  console.log(`   walletTransactions: ${txDel.count}`);

  // 2. Notificações
  const notifDel = await prisma.notification.deleteMany({ where: { userId: { in: userIds } } });
  console.log(`   notifications: ${notifDel.count}`);

  // 3. Reviews
  const reviewDel = await prisma.review.deleteMany({
    where: {
      OR: [
        { userId: { in: userIds } },
        { providerId: { in: providerIds } },
      ],
    },
  });
  console.log(`   reviews: ${reviewDel.count}`);

  // 4. EscrowEvents (se existir)
  try {
    const escrowDel = await prisma.escrowEvent.deleteMany({ where: { appointmentId: { in: appointmentIds } } });
    console.log(`   escrowEvents: ${escrowDel.count}`);
  } catch { /* tabela pode não existir */ }

  // 5. Payments (se existir)
  try {
    const payDel = await prisma.payment.deleteMany({ where: { appointmentId: { in: appointmentIds } } });
    console.log(`   payments: ${payDel.count}`);
  } catch { /* tabela pode não existir */ }

  // 6. Agendamentos
  const apptDel = await prisma.appointment.deleteMany({ where: { id: { in: appointmentIds } } });
  console.log(`   appointments: ${apptDel.count}`);

  // 7. Serviços
  const svcDel = await prisma.service.deleteMany({ where: { id: { in: serviceIds } } });
  console.log(`   services: ${svcDel.count}`);

  // 8. Imagens do provider
  const imgDel = await prisma.providerImage.deleteMany({ where: { providerId: { in: providerIds } } });
  console.log(`   providerImages: ${imgDel.count}`);

  // 9. Media files dos usuários
  const mediaDel = await prisma.mediaFile.deleteMany({ where: { ownerId: { in: userIds } } });
  console.log(`   mediaFiles: ${mediaDel.count}`);

  // 10. Providers
  const provDel = await prisma.provider.deleteMany({ where: { id: { in: providerIds } } });
  console.log(`   providers: ${provDel.count}`);

  // 11. Carteiras
  const walletDel = await prisma.wallet.deleteMany({ where: { id: { in: walletIds } } });
  console.log(`   wallets: ${walletDel.count}`);

  // 12. Usuários
  const userDel = await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  console.log(`   users: ${userDel.count}`);

  console.log('\n✅ Seed limpo com sucesso!');
  console.log(`   Usuários reais preservados.`);
}

main()
  .catch(e => { console.error('❌ Erro:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
