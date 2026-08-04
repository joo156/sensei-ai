/** Notification feed business logic (in-app notification centre). */
import * as catalogueApi from "@/api/catalogue.api";
import { attempt } from "@/lib/result";
import type { ListNotificationsResponse } from "@/types/api/catalogue.contracts";
import type { Result } from "@/types/api/common";
import type { UserRole } from "@/types/database.types";

export const NotificationService = {
  async list(role?: UserRole): Promise<Result<ListNotificationsResponse>> {
    return attempt("NotificationService.list", () => catalogueApi.getNotifications({ role }));
  },

  async markRead(id: string): Promise<Result<{ id: string }>> {
    return attempt("NotificationService.markRead", () => catalogueApi.markNotificationRead(id));
  },

  async markAllRead(): Promise<Result<{ updated: number }>> {
    return attempt("NotificationService.markAllRead", () =>
      catalogueApi.markAllNotificationsRead(),
    );
  },
};
