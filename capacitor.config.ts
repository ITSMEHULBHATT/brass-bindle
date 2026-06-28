import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.brassworks.orders",
  appName: "SUPERIOR BATH FITTINGS",
  webDir: "dist-mobile",
  android: {
    allowMixedContent: false,
  },
};

export default config;
