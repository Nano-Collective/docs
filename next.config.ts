import type { NextConfig } from "next";
import nextra from "nextra";

const withNextra = nextra({
	defaultShowCopyCode: true,
});

const nextConfig: NextConfig = {
	output: "export",
	images: {
		unoptimized: true,
	},
};

export default withNextra(nextConfig);
