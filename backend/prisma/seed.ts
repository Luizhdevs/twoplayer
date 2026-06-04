import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // ── Limpa na ordem correta (FK) ─────────────────────────────────
  await prisma.walletTransaction.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.review.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.service.deleteMany();
  await prisma.providerImage.deleteMany();
  await prisma.provider.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.user.deleteMany();

  // ── Usuários fãs ────────────────────────────────────────────────
  const userDeyvison = await prisma.user.create({
    data: {
      email: 'deyvison@twoplayers.com',
      name: 'Deyvison Dênnis',
      bio: 'Apaixonado por tecnologia e games',
      avatarUrl: 'https://i.pravatar.cc/150?img=5',
      role: Role.USER,
      wallet: { create: { balance: 15000 } },
    },
  });

  const userLucas = await prisma.user.create({
    data: {
      email: 'lucas@twoplayers.com',
      name: 'Lucas Silva',
      bio: 'Gamer competitivo e streamer iniciante',
      avatarUrl: 'https://i.pravatar.cc/150?img=8',
      role: Role.USER,
      wallet: { create: { balance: 30000 } },
    },
  });

  const userAna = await prisma.user.create({
    data: {
      email: 'ana@twoplayers.com',
      name: 'Ana Souza',
      bio: 'Designer e apaixonada por tecnologia',
      avatarUrl: 'https://i.pravatar.cc/150?img=9',
      role: Role.USER,
      wallet: { create: { balance: 5000 } },
    },
  });

  // ── Usuários providers (colaboradores) ──────────────────────────
  const userNeymar = await prisma.user.create({
    data: {
      email: 'neymar@twoplayers.com',
      name: 'Neymar Jr',
      bio: 'Jogador de Futebol e CS nas horas vagas',
      avatarUrl: '/avatar.jpg',
      role: Role.PROVIDER,
      wallet: { create: { balance: 0 } },
    },
  });

  const userGaules = await prisma.user.create({
    data: {
      email: 'gaules@twoplayers.com',
      name: 'Gaules',
      bio: 'O maior streamer de CS do Brasil',
      avatarUrl: '/gaules.jpg',
      role: Role.PROVIDER,
      wallet: { create: { balance: 0 } },
    },
  });

  const userCaze = await prisma.user.create({
    data: {
      email: 'caze@twoplayers.com',
      name: 'Cazé',
      bio: 'Apresentador e streamer',
      avatarUrl: '/caze.jpg',
      role: Role.PROVIDER,
      wallet: { create: { balance: 0 } },
    },
  });

  // ── Providers ───────────────────────────────────────────────────
  const providerNeymar = await prisma.provider.create({
    data: {
      userId: userNeymar.id,
      categories: ['Futebol', 'Games'],
      isVerified: true,
      rating: 4.5,
      totalReviews: 2,
      images: {
        createMany: {
          data: [
            { url: '/ney1.jpg', sortOrder: 0 },
            { url: '/ney2.jpeg', sortOrder: 1 },
            { url: '/ney3.jpg', sortOrder: 2 },
          ],
        },
      },
    },
  });

  const providerGaules = await prisma.provider.create({
    data: {
      userId: userGaules.id,
      categories: ['Games', 'Streaming'],
      isVerified: true,
      rating: 4.5,
      totalReviews: 2,
      images: {
        createMany: {
          data: [
            { url: '/gaules1.jpg', sortOrder: 0 },
            { url: '/gaules2.jpg', sortOrder: 1 },
          ],
        },
      },
    },
  });

  const providerCaze = await prisma.provider.create({
    data: {
      userId: userCaze.id,
      categories: ['Futebol', 'Games', 'Streaming'],
      isVerified: true,
      rating: 4.5,
      totalReviews: 2,
      images: {
        createMany: {
          data: [
            { url: '/caze1.jpg', sortOrder: 0 },
            { url: '/caze2.jpg', sortOrder: 1 },
          ],
        },
      },
    },
  });

  // ── Serviços (preços em centavos) ────────────────────────────────
  const [svcNeyBate, svcNeyCs] = await Promise.all([
    prisma.service.create({
      data: {
        providerId: providerNeymar.id,
        title: 'Bate-papo',
        description: 'Sessão exclusiva de 30 minutos com Neymar',
        price: 35000,
        duration: 30,
      },
    }),
    prisma.service.create({
      data: {
        providerId: providerNeymar.id,
        title: 'Partida de CS',
        description: 'Jogue uma partida completa ao lado do Neymar',
        price: 70000,
        duration: 60,
      },
    }),
  ]);

  const [svcGaulBate, svcGaulCs] = await Promise.all([
    prisma.service.create({
      data: {
        providerId: providerGaules.id,
        title: 'Bate-papo',
        description: 'Sessão de 30min com o Gaules',
        price: 20000,
        duration: 30,
      },
    }),
    prisma.service.create({
      data: {
        providerId: providerGaules.id,
        title: 'Mentoria CS',
        description: 'Aprenda táticas e estratégias com o Gaules',
        price: 40000,
        duration: 60,
      },
    }),
  ]);

  await Promise.all([
    prisma.service.create({
      data: {
        providerId: providerCaze.id,
        title: 'Bate-papo',
        description: 'Sessão de 30min com o Cazé',
        price: 22000,
        duration: 30,
      },
    }),
    prisma.service.create({
      data: {
        providerId: providerCaze.id,
        title: 'Partida de CS',
        description: 'Partida ao lado do Cazé',
        price: 44000,
        duration: 60,
      },
    }),
  ]);

  // ── Agendamentos concluídos ──────────────────────────────────────
  const appt1 = await prisma.appointment.create({
    data: {
      userId: userDeyvison.id,
      serviceId: svcNeyBate.id,
      providerId: providerNeymar.id,
      scheduledAt: new Date('2026-04-10T14:00:00Z'),
      status: 'COMPLETED',
      amount: svcNeyBate.price,
      notes: 'Primeira sessão',
    },
  });

  const appt2 = await prisma.appointment.create({
    data: {
      userId: userLucas.id,
      serviceId: svcGaulCs.id,
      providerId: providerGaules.id,
      scheduledAt: new Date('2026-04-15T16:00:00Z'),
      status: 'COMPLETED',
      amount: svcGaulCs.price,
    },
  });

  const appt3 = await prisma.appointment.create({
    data: {
      userId: userDeyvison.id,
      serviceId: svcNeyCs.id,
      providerId: providerNeymar.id,
      scheduledAt: new Date('2026-05-20T15:00:00Z'),
      status: 'CONFIRMED',
      amount: svcNeyCs.price,
    },
  });

  const appt4 = await prisma.appointment.create({
    data: {
      userId: userAna.id,
      serviceId: svcGaulBate.id,
      providerId: providerGaules.id,
      scheduledAt: new Date('2026-06-10T10:00:00Z'),
      status: 'PENDING',
      amount: svcGaulBate.price,
    },
  });

  // ── Avaliações ───────────────────────────────────────────────────
  await Promise.all([
    prisma.review.create({
      data: {
        appointmentId: appt1.id,
        userId: userDeyvison.id,
        providerId: providerNeymar.id,
        serviceId: svcNeyBate.id,
        rating: 5,
        comment: 'Nunca imaginei que um dia pudesse conversar com o meu ídolo!',
      },
    }),
    prisma.review.create({
      data: {
        appointmentId: appt2.id,
        userId: userLucas.id,
        providerId: providerGaules.id,
        serviceId: svcGaulCs.id,
        rating: 4,
        comment: 'Aprendi muito sobre posicionamento no CS!',
      },
    }),
  ]);

  // ── Transações de carteira ───────────────────────────────────────
  const walletDeyvison = await prisma.wallet.findUnique({
    where: { ownerId: userDeyvison.id },
  });

  if (walletDeyvison) {
    await prisma.walletTransaction.createMany({
      data: [
        {
          walletId: walletDeyvison.id,
          type: 'CREDIT',
          amount: 20000,
          description: 'Recarga via cartão',
          status: 'COMPLETED',
        },
        {
          walletId: walletDeyvison.id,
          type: 'DEBIT',
          amount: svcNeyBate.price,
          description: `Bate-papo com Neymar Jr`,
          referenceId: appt1.id,
          status: 'COMPLETED',
        },
      ],
    });
  }

  // ── Notificações ─────────────────────────────────────────────────
  await prisma.notification.createMany({
    data: [
      {
        userId: userDeyvison.id,
        title: 'Agendamento confirmado!',
        body: 'Seu bate-papo com Neymar Jr foi confirmado.',
        type: 'APPOINTMENT',
        data: { appointmentId: appt3.id },
      },
      {
        userId: userLucas.id,
        title: 'Avaliação recebida',
        body: 'Você recebeu uma nova avaliação.',
        type: 'REVIEW',
      },
    ],
  });

  console.log('✅ Seed concluído com sucesso!');
  console.log(`   👤 Usuários: ${await prisma.user.count()}`);
  console.log(`   🎭 Providers: ${await prisma.provider.count()}`);
  console.log(`   🛎  Serviços: ${await prisma.service.count()}`);
  console.log(`   📅 Agendamentos: ${await prisma.appointment.count()}`);
  console.log(`   ⭐ Avaliações: ${await prisma.review.count()}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
