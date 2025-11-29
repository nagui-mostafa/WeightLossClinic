export interface ProductPlanOption {
  id: string;
  title: string;
  price: number;
  oldPrice?: number;
  href?: string;
}

export interface ProductFaq {
  title: string;
  description: string;
}

export interface ProductWhyChoose {
  title: string;
  excerpt: string;
  imgSrc?: string;
}

export interface ProductHowItWorksStep {
  step: number;
  title: string;
  description: string;
}

export interface ProductImageData {
  id: string;
  bucket?: string;
  objectKey?: string | null;
  altText?: string | null;
  fallbackUrl?: string | null;
  variant?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface ProductImageResponse extends ProductImageData {
  url?: string | null;
}

export type ProductMetadata = Record<string, unknown> | null;
