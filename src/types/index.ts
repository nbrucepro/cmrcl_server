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
    price: number;
    stockQuantity?: number;
    rating?: number;
  }
  
  
  export interface UpdateInventoryRequest {
    type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'RETURN' | 'DAMAGED';
    quantity: number;
    reason?: string;
  }