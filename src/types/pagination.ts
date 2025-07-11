export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T;
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TablePaginationState {
  pageIndex: number;
  pageSize: number;
}
