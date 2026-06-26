export type GenerationStatus = "idle" | "pending" | "generating" | "completed" | "failed";

export interface ImageFeedback {
  id: string;
  promptId: number;
  promptTitle: string;
  rating: number;
  comments: string;
  originalFilename: string;
  generatedUrl: string;
  timestamp: string;
}

export interface PromptState {
  id: number;
  title: string;
  category: "Modern" | "Minimalist" | "Cozy" | "Scenic" | "Classic" | "Themed";
  prompt: string;
  status: GenerationStatus;
  resultUrl?: string;
  error?: string;
  retryCount: number;
  rating?: number;
  comments?: string;
  isSandbox?: boolean;
  fallbackReason?: string;
}

export interface UploadResponse {
  filename: string;
  url: string;
  size: number;
}
