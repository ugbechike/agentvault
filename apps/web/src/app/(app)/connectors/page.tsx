import type { Metadata } from "next";

import { MarketplaceView } from "@/components/connectors/marketplace-view";

export const metadata: Metadata = { title: "Connectors" };

const ConnectorsPage = () => <MarketplaceView />;

export default ConnectorsPage;
