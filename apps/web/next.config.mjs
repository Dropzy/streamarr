const nextConfig = {
  transpilePackages: ["@streamarr/config", "@streamarr/validation"],
};

if (process.env.NEXT_STANDALONE === "true") {
  nextConfig.output = "standalone";
}

export default nextConfig;
