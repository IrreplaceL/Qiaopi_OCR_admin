import vue from "@vitejs/plugin-vue";
import type { PluginOption } from "vite";
import checker from "vite-plugin-checker";
import vueJsx from "@vitejs/plugin-vue-jsx";
import svgLoader from "vite-svg-loader";
import { pathResolve } from "./utils";
import { viteBuildInfo } from "./info";
import { configCompressPlugin } from "./compress";
import { visualizer } from "rollup-plugin-visualizer";
import removeConsole from "vite-plugin-remove-console";

export function getPluginsList(
  VITE_COMPRESSION: ViteCompression,
  isDev = false
): PluginOption[] {
  const lifecycle = process.env.npm_lifecycle_event;
  const enableChecker = !isDev || process.env.VITE_ENABLE_CHECKER === "true";

  return [
    vue(),
    vueJsx(),
    enableChecker
      ? checker({
          typescript: true,
          vueTsc: true,
          overlay: false,
          eslint: {
            lintCommand: `eslint ${pathResolve("../{src,build}/**/*.{vue,js,ts,tsx}")}`,
            useFlatConfig: true
          },
          terminal: true,
          enableBuild: false
        })
      : null,
    viteBuildInfo(),
    svgLoader(),
    configCompressPlugin(VITE_COMPRESSION),
    removeConsole(),
    lifecycle === "report"
      ? visualizer({ open: true, brotliSize: true, filename: "report.html" })
      : null
  ];
}
