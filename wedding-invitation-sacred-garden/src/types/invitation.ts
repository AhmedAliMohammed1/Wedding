export type ScheduleIcon = 'arrival' | 'ceremony' | 'drinks' | 'dinner' | 'celebration';

export interface ScheduleItem {
  time: string;
  title: string;
  description: string;
  icon: ScheduleIcon;
}

export interface GalleryItem {
  src: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
}

export interface DressColor {
  name: string;
  hex: string;
}

export interface InvitationConfig {
  brideName: string;
  groomName: string;
  initials: string;
  weddingDate: string;
  endDate: string;
  timezone: string;
  displayDate: string;
  shortDate: string;
  openingMessage: string;
  blessing: string;
  introductionHeading: string;
  introduction: string;
  closingMessage: string;
  venue: {
    name: string;
    address: string;
    streetAddress: string;
    city: string;
    countryName: string;
    countryCode: string;
    mapEmbedUrl: string;
    directionsUrl: string;
    image: string;
  };
  schedule: ScheduleItem[];
  dressCode: {
    title: string;
    description: string;
    guidance: string;
    colors: DressColor[];
  };
  gift: {
    enabled: boolean;
    title: string;
    message: string;
    preference: string;
    buttonLabel?: string;
    buttonUrl?: string;
  };
  contact: {
    email: string;
    phone: string;
  };
  rsvp: {
    deadline: string;
    maxGuests: number;
  };
  gallery: GalleryItem[];
  images: {
    hero: string;
    storyMain: string;
    storySecondary: string;
  };
  music: {
    src: string;
    title: string;
  };
  social: {
    title: string;
    description: string;
    siteUrl: string;
    image: string;
  };
}
