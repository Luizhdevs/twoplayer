import { Injectable } from '@nestjs/common';

@Injectable()
export class UserService {

  private users = [
    {
      id: 1,
      name: 'Deyvison Dênnis',
      email: 'deyvison@twoplayers.com',
      avatarUrl: 'https://i.pravatar.cc/150?img=5',
      bio: 'Apaixonado por tecnologia e games',

      appointments: [
        {
          id: 1,
          service: 'Partida de CS',
          provider: 'Neymar',
          date: '2026-04-10',
          status: 'Concluído',
        },
      ],

      images: [
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2',
        'https://images.unsplash.com/photo-1524504388940-b1c1722653e1',
      ],
    },

    {
      id: 2,
      name: 'Lucas Silva',
      email: 'lucas@email.com',
      avatarUrl: 'https://i.pravatar.cc/150?img=8',
      bio: 'Gamer competitivo e streamer iniciante',

      appointments: [
        {
          id: 2,
          service: 'Mentoria CS',
          provider: 'Gaules',
          date: '2026-04-15',
          status: 'Agendado',
        },
      ],

      images: [
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e',
      ],
    },

    {
      id: 3,
      name: 'Ana Souza',
      email: 'ana@email.com',
      avatarUrl: 'https://i.pravatar.cc/150?img=9',
      bio: 'Designer e apaixonada por tecnologia',

      appointments: [],
      images: [],
    },
  ];

  /* =========================
     PERFIL DO USUÁRIO
  ========================= */

  getProfile(id: number) {
    const user = this.users.find((u) => u.id === id);

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    return user;
  }
}