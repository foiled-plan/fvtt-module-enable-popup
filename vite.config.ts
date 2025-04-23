import { defineConfig } from "vite";
import { resolve } from "path";
import { viteStaticCopy } from "vite-plugin-static-copy";
import { checker } from "vite-plugin-checker";

export default defineConfig({
  esbuild: {
    target: "esnext",
    // prevent esbuild from transforming class properties
    supported: {
      class: true,
      "class-static-blocks": true,
      "class-static-field": true,
      "class-field": true,
      "class-private-accessor": true,
      "class-private-brand-check": true,
      "class-private-field": true,
      "class-private-method": true,
      "class-private-static-accessor": true,
      "class-private-static-field": true,
      "class-private-static-method": true,
    },
  },
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        module: resolve(__dirname, "src/scripts/mainWindow/module.ts"),
        popup: resolve(__dirname, "src/scripts/popupWindows/popup.ts"),
      },
      output: {
        entryFileNames: "[name].js",
      },
    },
    emptyOutDir: true,
    minify: false,
  },
  plugins: [
    checker({ typescript: true }),
    viteStaticCopy({
      targets: [
        { src: "src/languages/*", dest: "languages" },
        { src: "src/*.html", dest: "" },
        { src: "src/module.json", dest: "" },
        { src: "README.md", dest: "" },
        { src: "LICENSE", dest: "" },
      ],
    }),
  ],
});
