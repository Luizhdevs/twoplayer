import { Injectable } from '@nestjs/common';

@Injectable()
export class ProviderService {

  private providers = [
    {
      id: 1,
      user: {
        name: 'Neymar',
      },
      avatarUrl: '/avatar.jpg',
      bio: 'Jogador de Futebol e CS nas horas vagas',
      categories: ['Futebol', 'Games'],

      services: [
        {
          id: 1,
          title: 'Bate-papo',
          description: 'Sessão de 30min',
          price: 1000,
          duration: 30,
        },
        {
          id: 2,
          title: 'Partida de CS',
          description: 'Sessão de 1h',
          price: 2000,
          duration: 60,
        },
      ],

      reviews: [
        {
          id: 1,
          rating: 5,
          comment: 'Nunca imaginei que um dia pudesse conversar com o meu ídolo!',
          user: { name: 'Ryan Charles' },
          services: { title: 'Bate-papo' },
        },
        {
          id: 2,
          rating: 4,
          comment: 'Craque dentro e fora dos gramados!',
          user: { name: 'Deyvison Dênnis' },
          services: { title: 'Partida de CS' },
        },
      ],

      images: ['/ney1.jpg', '/ney2.jpeg', '/ney3.jpg'],
    },
    {
      id: 2,
      user: {
        name: 'Gaules',
      },
      avatarUrl: '/gaules.jpg',
      bio: 'Streamer e Gamer',
      categories: ['Streaming', 'Games'],

      services: [
        {
          id: 1,
          title: 'Bate-papo',
          description: 'Sessão de 30min',
          price: 1000,
          duration: 30,
        },
        {
          id: 2,
          title: 'Partida de CS',
          description: 'Sessão de 1h',
          price: 2000,
          duration: 60,
        },
      ],

      reviews: [
        {
          id: 1,
          rating: 5,
          comment: 'Nunca imaginei que um dia pudesse conversar com o meu ídolo!',
          user: { name: 'Ryan Charles' },
          services: { title: 'Bate-papo' },
        },
        {
          id: 2,
          rating: 4,
          comment: 'Craque dentro e fora dos gramados!',
          user: { name: 'Deyvison Dênnis' },
          services: { title: 'Partida de CS' },
        },
      ],

      images: ['/gaules1.jpg', '/gaules2.jpg'],
    },
    {
      id: 3,
      user: {
        name: 'Caze',
      },
      avatarUrl: '/caze.jpg',
      bio: 'Apresentador e streamer',
      categories: ['Futebol', 'Games', 'Streaming'],

      services: [
        {
          id: 1,
          title: 'Bate-papo',
          description: 'Sessão de 30min',
          price: 1000,
          duration: 30,
        },
        {
          id: 2,
          title: 'Partida de CS',
          description: 'Sessão de 1h',
          price: 2000,
          duration: 60,
        },
      ],

      reviews: [
        {
          id: 1,
          rating: 5,
          comment: 'Nunca imaginei que um dia pudesse conversar com o meu ídolo!',
          user: { name: 'Ryan Charles' },
          services: { title: 'Bate-papo' },
        },
        {
          id: 2,
          rating: 4,
          comment: 'Craque dentro e fora dos gramados!',
          user: { name: 'Deyvison Dênnis' },
          services: { title: 'Partida de CS' },
        },
      ],

      images: ['/caze1.jpg', '/caze2.jpg'],
    },
  ];

  /* =========================
     PERFIL PÚBLICO
  ========================= */

  getPublicProfile(id: number) {
    const provider = this.providers.find((p) => p.id === id);

    if (!provider) {
      throw new Error('Prestador não encontrado');
    }

    return provider;
  }

  /* =========================
     HOME (FEED)
  ========================= */

  getHome() {
    const formattedProviders = this.providers.map((p) => ({
      id: p.id,
      name: p.user.name,
      avatarUrl: p.avatarUrl,
      rating: this.getAverageRating(p.reviews),
      price: this.getBasePrice(p.services),
      categories: p.categories,
    }));

    return {
      topProviders: formattedProviders,
      categories: this.groupByCategory(formattedProviders),
    };
  }

  /* =========================
     FUNÇÕES AUXILIARES
  ========================= */

  private getAverageRating(reviews: any[]) {
    if (!reviews.length) return 0;

    return (
      reviews.reduce((acc, r) => acc + r.rating, 0) /
      reviews.length
    );
  }

  private getBasePrice(services: any[]) {
    return Math.min(...services.map((s) => s.price));
  }

  private groupByCategory(providers: any[]) {
    const map: Record<string, any[]> = {};

    providers.forEach((p) => {
      p.categories.forEach((cat: string) => {
        if (!map[cat]) {
          map[cat] = [];
        }

        map[cat].push(p);
      });
    });

    return Object.keys(map).map((name) => ({
      name,
      providers: map[name],
    }));
  }
}