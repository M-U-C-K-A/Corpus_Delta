import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
	resolve: {
		alias: { "@": path.resolve(import.meta.dirname, ".") },
	},
	test: {
		// Les tests portent sur des fonctions pures : ni DOM ni serveur nécessaires.
		environment: "node",
		include: ["tests/**/*.test.ts"],
	},
});
