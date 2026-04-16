export type PaperStatus =
  | "processed"
  | "uploading"
  | "needs_review"
  | "duplicate";

export type Paper = {
  id: string;
  title: string;
  year: number;
  authors: string[];
  primaryCategory: string;
  subcategories: string[];
  tags: string[];
  keywords: string[];
  coreContribution: string;
  relevanceNote: string;
  innovationNote: string;
  whatThisPaperDoes: string[];
  claimedInnovations: string[];
  usefulToMyTopic: string[];
  limitations: string[];
  candidateIdeas: string[];
  status: PaperStatus;
};

export type TopicSnapshot = {
  title: string;
  currentLines: string[];
  keyQuestions: string[];
};
