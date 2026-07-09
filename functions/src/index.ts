import { initializeApp } from "firebase-admin/app";

initializeApp();

export {
  cleanupOrphanedImages as apparelCleanupOrphanedImages,
  auditOrphanedImages as apparelAuditOrphanedImages,
} from "./cleanupOrphanedImages";
