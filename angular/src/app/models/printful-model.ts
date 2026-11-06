export interface shippingRatesPayload {
  id: number;
}

export interface orderPayload {
  id: number;
}

export interface printfulFile {
  id: number;
  type: 'default' | 'preview';
  hash: string;
  url: string | null;
  filename: string;
  mime_type: string;
  size: number;
  width: number;
  height: number;
  dpi: number | null;
  status: string;
  created: number;
  thumbnail_url: string;
  preview_url: string;
  visible: boolean;
  is_temporary: boolean;
}

export interface printfulVariantProduct {
  variant_id: number;
  product_id: number;
  image: string;
  name: string;
}

export interface printfulSyncVariant {
  id: number;
  external_id: string;
  sync_product_id: number;
  name: string;
  synced: boolean;
  variant_id: number;
  main_category_id: number;
  retail_price: string;
  sku: string;
  currency: string;
  product: printfulVariantProduct;
  files: printfulFile[];
  is_ignored: boolean;
  size: string;
  color: string | null;
  availability_status: string;
}

export interface printfulSyncProduct {
  id: number;
  external_id: string;
  name: string;
  variants: number;
  synced: number;
  thumbnail_url: string;
  is_ignored: boolean;
  slug?: string;
  slogans?: string[];
  description?: string;
  addendum?: string;
  images?: string[];
  variant?: string;
  promoted?: boolean;
  soldOut?: boolean;
}

export interface printfulProductDetail {
  sync_product: printfulSyncProduct;
  sync_variants: printfulSyncVariant[];
}

export interface printfulPaging {
  total: number;
  limit: number;
  offset: number;
}

export interface printfulListResponse {
  code: number;
  result: printfulSyncProduct[];
  paging: printfulPaging;
}

export interface printfulDetailResponse {
  code: number;
  result: printfulProductDetail;
}