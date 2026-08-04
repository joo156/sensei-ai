import type { ActivityPoint, DistributionBucket, TopicCoverage } from "@/types/domain";

export interface AnalyticsQuery {
  workspaceId: string;
  range?: "7d" | "30d" | "90d";
}

export interface AnalyticsResponse {
  /** Distribution of generated items across Bloom levels. */
  bloomDistribution: DistributionBucket[];
  /** Distribution across question types (MCQ, True/False, …). */
  typeDistribution: DistributionBucket[];
  /** Weekly generation activity. */
  activitySeries: ActivityPoint[];
  /** Syllabus coverage per topic. */
  topicCoverage: TopicCoverage[];
}

export interface ModelInfo {
  id: string;
  name: string;
  vendor: string;
  desc: string;
  available: boolean;
}

export interface GetModelsResponse {
  models: ModelInfo[];
}
