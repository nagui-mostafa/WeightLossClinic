import { PaginationQueryDto } from '../dto/pagination-query.dto';

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export function buildPaginationMeta(
  query: PaginationQueryDto,
  totalItems: number,
): PaginationMeta {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const totalPages = Math.ceil(totalItems / limit) || 1;

  return {
    page,
    limit,
    totalItems,
    totalPages,
  };
}
