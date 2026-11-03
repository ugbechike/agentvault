import type { Metadata } from "next";

import { ActivityTable } from "@/components/activity/activity-table";

export const metadata: Metadata = { title: "Activity" };

const ActivityPage = () => <ActivityTable />;

export default ActivityPage;
