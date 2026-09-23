export type ScreenType = 'adopt' | 'enquiry';
export type ActionType = 'visit' | 'adopt';

export interface Animal {
  id: string;
  name: string;
  age: string;
  category: string;
  story: string;
  image: string;
  vaccinated: boolean;
  dewormed: boolean;
  gender: string;
  size: string;
  temperament: string;
}

export interface ShelterInfo {
  name: string;
  tagline: string;
  vision: string;
  stats: string;
  address: string;
  hours: string;
  helpline: string;
  activeCount: number;
}

export interface EnquirySubmission {
  animal?: Animal | null;
  actionType: ActionType;
  fullName: string;
  email: string;
  phone: string;
  whichRescue?: string;
  visitDate?: string;
  timeSlot?: string;
  message: string;
  submittedAt: string;
}
