export interface GuestNote {
  id: string;
  author: string;
  anonymous: boolean;
  message: string;
  createdAt: string;
}

export interface GuestNotesResponse {
  notes: GuestNote[];
  pagination: GuestNotesPagination;
}

export interface GuestNotesPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
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

export const isGuestNotesPagination = (value: unknown): value is GuestNotesPagination => {
  if (!value || typeof value !== 'object') return false;
  const pagination = value as Partial<GuestNotesPagination>;

  return (
    typeof pagination.page === 'number' &&
    Number.isInteger(pagination.page) &&
    typeof pagination.pageSize === 'number' &&
    Number.isInteger(pagination.pageSize) &&
    typeof pagination.total === 'number' &&
    Number.isInteger(pagination.total) &&
    typeof pagination.totalPages === 'number' &&
    Number.isInteger(pagination.totalPages) &&
    typeof pagination.hasPreviousPage === 'boolean' &&
    typeof pagination.hasNextPage === 'boolean' &&
    Number(pagination.page) >= 1 &&
    Number(pagination.pageSize) >= 1 &&
    Number(pagination.total) >= 0 &&
    Number(pagination.totalPages) >= 1
  );
};
