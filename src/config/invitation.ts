import type { InvitationConfig } from '../types/invitation';

export const invitation: InvitationConfig = {
  brideName: 'Ahmed',
  groomName: 'Nada',
  initials: 'A · N',
  weddingDate: '2026-08-11T16:00:00+03:00',
  endDate: '2026-08-12T00:30:00+03:00',
  timezone: 'Africa/Cairo',
  displayDate: 'Tuesday, August 11, 2026',
  shortDate: '11 · 08 · 2026',
  openingMessage: 'You are invited',
  blessing: '﴿ بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ ﴾',
  introductionHeading: 'Dear Friends and Family',
  introduction:
    'Join us for an evening of love, laughter, duas, and unforgettable memories as we begin our forever.',
  closingMessage:
    'Your presence will make our garden bloom brighter. We cannot wait to celebrate this beginning with you.',
  venue: {
    name: 'Le Palace Garden',
    address: 'Al-Ahrar Bridge – Al-Nizam, Zagazig, Sharqia Governorate, Egypt',
    streetAddress: 'Al-Ahrar Bridge – Al-Nizam',
    city: 'Zagazig',
    countryName: 'Egypt',
    countryCode: 'EG',
    mapEmbedUrl:
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3435.3271242379997!2d31.503283476321624!3d30.568309574664013!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14f7f113d7c52ecd%3A0xdece35ab8fd553e8!2sLe%20Palace%20Garden!5e0!3m2!1sen!2sde!4v1785072531201!5m2!1sen!2sde',
    directionsUrl:
      'https://www.google.com/maps/dir/?api=1&destination=30.568309574664013%2C31.503283476321624',
    image: '/assets/images/venue-garden.webp'
  },
  schedule: [
    {
      time: '4:00 PM',
      title: 'Guest arrival',
      description: 'A welcome drink among the garden paths.',
      icon: 'arrival'
    },
    {
      time: '4:30 PM',
      title: 'Ceremony',
      description: 'Our vows beneath the old chestnut tree.',
      icon: 'ceremony'
    },
    {
      time: '5:30 PM',
      title: 'Cocktail hour',
      description: 'Seasonal canapés, music, and photographs.',
      icon: 'drinks'
    },
    {
      time: '7:00 PM',
      title: 'Garden dinner',
      description: 'A candlelit table shared with our favourite people.',
      icon: 'dinner'
    },
    {
      time: '9:00 PM',
      title: 'Celebration',
      description: 'Dancing, dessert, and a night under the stars.',
      icon: 'celebration'
    }
  ],
  guestNotes: {
    enabled: true,
    title: 'Leave a little love',
    description:
      'Share a wish, a dua, or a favourite memory. Your note will be visible here, but your name is always your choice.'
  },
  contact: {
    email: 'ahmedelsaify213@gmail.com',
    phone: '+20 100 000 0000'
  },
  gallery: [
    {
      src: '/assets/images/glimpse-left.webp',
      alt: 'Illustrated portrait of Ahmed and Nada at their engagement celebration',
      caption: 'The beginning of our forever',
      width: 896,
      height: 1195
    },
    {
      src: '/assets/images/glimpse-right.webp',
      alt: 'Illustrated mirror portrait of Ahmed and Nada together',
      caption: 'Side by side, always',
      width: 768,
      height: 1364
    },
    {
      src: '/assets/images/captured-03.webp',
      alt: 'Playful illustrated portrait of Ahmed and Nada in formal attire',
      caption: 'Love, laughter, and a little mischief',
      width: 1264,
      height: 843
    },
    {
      src: '/assets/images/captured-04.webp',
      alt: 'Illustrated formal portrait of Ahmed and Nada beneath an arch',
      caption: 'A moment made entirely ours',
      width: 1264,
      height: 843
    },
    {
      src: '/assets/images/captured-05.webp',
      alt: 'Illustrated wedding portrait of Ahmed and Nada holding hands',
      caption: 'Hand in hand toward forever',
      width: 843,
      height: 1264
    }
  ],
  images: {
    hero: '/assets/images/hero-garden.webp',
    storyMain: '/assets/images/glimpse-left.webp',
    storySecondary: '/assets/images/glimpse-right.webp'
  },
  music: {
    src: '/assets/audio/divenire.mp3',
    title: 'Divenire'
  },
  social: {
    title: 'Ahmed & Nada — August 11, 2026',
    description: 'Join Ahmed and Nada for an intimate garden wedding at Le Palace Garden in Zagazig.',
    siteUrl: 'https://your-wedding-site.netlify.app',
    image: '/assets/images/social-preview-generated.webp'
  }
};
