/**
 * Acesso ao catálogo (endpoints públicos) a partir de Server Components.
 * Chama a API direto (server-side não precisa do proxy de cookie).
 */
const SERVER_API =
  (process.env.API_PROXY_TARGET ?? 'http://localhost:3333').replace(/\/+$/, '') + '/api/v1';

export interface ProductCard {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  isSensitiveMedia: boolean;
  fromPriceCents: number;
  salePriceCents: number | null;
  category: string | null;
  mediaCount: number;
  inStock: boolean;
}

export interface ProductVariant {
  id: string;
  sku: string;
  priceCents: number;
  salePriceCents: number | null;
  options: Record<string, unknown>;
  barcode: string | null;
  available: number;
  inStock: boolean;
}

export interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  brand: string | null;
  status: string;
  isSensitiveMedia: boolean;
  attributes: Record<string, unknown>;
  variants: ProductVariant[];
  media: { id: string; url: string; position: number }[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface ProductList {
  items: ProductCard[];
  total: number;
  page: number;
  pageSize: number;
  pages: number;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${SERVER_API}${path}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`API ${res.status} em ${path}`);
  return res.json() as Promise<T>;
}

export function fetchCategories(): Promise<Category[]> {
  return get<Category[]>('/catalog/categories');
}

export function fetchProducts(params: {
  category?: string;
  q?: string;
  sort?: string;
  page?: number;
}): Promise<ProductList> {
  const qs = new URLSearchParams();
  if (params.category) qs.set('category', params.category);
  if (params.q) qs.set('q', params.q);
  if (params.sort) qs.set('sort', params.sort);
  if (params.page) qs.set('page', String(params.page));
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return get<ProductList>(`/catalog/products${suffix}`);
}

export async function fetchProductBySlug(slug: string): Promise<ProductDetail | null> {
  const res = await fetch(`${SERVER_API}/catalog/products/${encodeURIComponent(slug)}`, {
    cache: 'no-store',
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json() as Promise<ProductDetail>;
}
