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
  error?: unknown;
}

export const isGuestNote = (value: unknown): value is GuestNote => {
  if (!value || typeof value !== 'object') return false;
  const note = value as Partial<GuestNote>;

  return (
    typeof note.id === 'string' &&
    typeof note.author === 'string' &&
    typeof note.anonymous === 'boolean' &&
    typeof note.message === 'string' &&
    typeof note.createdAt === 'string'
  );
};
