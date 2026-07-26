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
  gift: {
    enabled: true,
    title: 'With love, not obligation',
    message:
      'Your company is the most meaningful gift. If you would still like to mark the occasion, a contribution toward our first journey as newlyweds would be received with gratitude.',
    preference: 'A private honeymoon fund will be shared directly with invited guests.',
    buttonLabel: 'Ask the couple',
    buttonUrl: 'mailto:ahmedelsaify213@gmail.com'
  },
  contact: {
    email: 'ahmedelsaify213@gmail.com',
    phone: '+20 100 000 0000'
  },
  gallery: [
    {
      src: '/assets/images/gallery-01.webp',
      alt: 'Soft botanical still life in warm afternoon light',
      caption: 'Where the garden meets golden hour',
      width: 1200,
      height: 1500
    },
    {
      src: '/assets/images/gallery-02.webp',
      alt: 'Garden pathway surrounded by layered foliage',
      caption: 'A path toward something beautiful',
      width: 1200,
      height: 1500
    },
    {
      src: '/assets/images/gallery-03.webp',
      alt: 'Abstract floral arrangement in rose and cream tones',
      caption: 'The colours of our celebration',
      width: 1200,
      height: 1500
    },
    {
      src: '/assets/images/gallery-04.webp',
      alt: 'Candlelit table among deep green plants',
      caption: 'An evening made for stories',
      width: 1200,
      height: 1500
    },
    {
      src: '/assets/images/gallery-05.webp',
      alt: 'Cream flowers framed by sage leaves',
      caption: 'In every detail, a little wonder',
      width: 1200,
      height: 1500
    },
    {
      src: '/assets/images/gallery-06.webp',
      alt: 'Twilight garden beneath a muted evening sky',
      caption: 'Then we dance beneath the stars',
      width: 1200,
      height: 1500
    }
  ],
  images: {
    hero: '/assets/images/hero-garden.webp',
    storyMain: '/assets/images/story-main.webp',
    storySecondary: '/assets/images/story-secondary.webp'
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
