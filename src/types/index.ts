export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
  }
  
  export interface PaginationParams {
    page: number;
    limit: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }
  
  export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }
  
  // Product-specific types
  export interface CreateProductRequest {
    name: string;
    description?: string;
    sku: string;
    price: number;
    quantity?: number;
    minStock?: number;
    maxStock?: number;
    categoryId: string;
  }
  
  export interface UpdateInventoryRequest {
    type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'RETURN' | 'DAMAGED';
    quantity: number;
    reason?: string;
  }