export interface GuestNote {
  id: string;
  author: string;
  anonymous: boolean;
  message: string;
  createdAt: string;
}

export interface GuestNotesResponse {
  notes: GuestNote[];
}

export interface GuestNoteMutationResponse {
  note?: GuestNote;
  error?: string;
}
