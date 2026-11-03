import type { Metadata } from "next";

import { PermissionBoard } from "@/components/permissions/permission-board";

export const metadata: Metadata = { title: "Permissions" };

const PermissionsPage = () => <PermissionBoard />;

export default PermissionsPage;
