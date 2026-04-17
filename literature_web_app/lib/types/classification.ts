export type PaperClassification = {
  paperId: string;
  primaryCategory: string;
  subcategories: string[];
  tags: string[];
  keywords: string[];
  confidence: number;
  needsReview: boolean;
  createdAt: string;
  updatedAt: string;
};
