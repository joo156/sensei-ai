/** Analytics business logic. */
import * as analyticsApi from "@/api/analytics.api";
import { attempt } from "@/lib/result";
import type { AnalyticsQuery, AnalyticsResponse } from "@/types/api/analytics.contracts";
import type { Result } from "@/types/api/common";

export const AnalyticsService = {
  async get(query: AnalyticsQuery): Promise<Result<AnalyticsResponse>> {
    return attempt("AnalyticsService.get", () => analyticsApi.getAnalytics(query));
  },
};
