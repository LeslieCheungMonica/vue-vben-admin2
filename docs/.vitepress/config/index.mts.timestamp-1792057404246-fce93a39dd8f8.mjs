// .vitepress/config/index.mts
import { withPwa } from "file:///Users/liyanhui/vscodeProjects/vue-vben-admin2/node_modules/.pnpm/@vite-pwa+vitepress@1.1.0_vite-plugin-pwa@1.2.0_vite@8.0.10_@types+node@25.6.0_esbuild@_fa952008f34d3c6d0e1cb6bc966a5877/node_modules/@vite-pwa/vitepress/dist/index.mjs";
import { defineConfigWithTheme } from "file:///Users/liyanhui/vscodeProjects/vue-vben-admin2/node_modules/.pnpm/vitepress@1.6.4_@algolia+client-search@5.51.0_@types+node@25.6.0_async-validator@4.2.5__739f022d7edc0ed0cca26b76bc3c0f41/node_modules/vitepress/dist/node/index.js";

// .vitepress/config/en.mts
import { defineConfig } from "file:///Users/liyanhui/vscodeProjects/vue-vben-admin2/node_modules/.pnpm/vitepress@1.6.4_@algolia+client-search@5.51.0_@types+node@25.6.0_async-validator@4.2.5__739f022d7edc0ed0cca26b76bc3c0f41/node_modules/vitepress/dist/node/index.js";

// ../package.json
var version = "5.7.0";

// .vitepress/config/en.mts
var en = defineConfig({
  description: "Vben Admin & Enterprise level management system framework",
  lang: "en-US",
  themeConfig: {
    darkModeSwitchLabel: "Theme",
    darkModeSwitchTitle: "Switch to Dark Mode",
    docFooter: {
      next: "Next Page",
      prev: "Previous Page"
    },
    editLink: {
      pattern: "https://github.com/vbenjs/vue-vben-admin/edit/main/docs/src/:path",
      text: "Edit this page on GitHub"
    },
    footer: {
      copyright: `Copyright \xA9 2020-${(/* @__PURE__ */ new Date()).getFullYear()} Vben`,
      message: "Released under the MIT License."
    },
    langMenuLabel: "Language",
    lastUpdated: {
      formatOptions: {
        dateStyle: "short",
        timeStyle: "medium"
      },
      text: "Last updated on"
    },
    lightModeSwitchTitle: "Switch to Light Mode",
    nav: nav(),
    outline: {
      label: "Navigate"
    },
    returnToTopLabel: "Back to top",
    sidebar: {
      "/en/commercial/": {
        base: "/en/commercial/",
        items: sidebarCommercial()
      },
      "/en/components/": {
        base: "/en/components/",
        items: sidebarComponents()
      },
      "/en/guide/": { base: "/en/guide/", items: sidebarGuide() }
    }
  }
});
function sidebarGuide() {
  return [
    {
      collapsed: false,
      text: "Introduction",
      items: [
        {
          link: "introduction/vben",
          text: "About Vben Admin"
        },
        {
          link: "introduction/why",
          text: "Why Choose Us?"
        },
        { link: "introduction/quick-start", text: "Quick Start" },
        { link: "introduction/thin", text: "Lite Version" },
        {
          base: "/",
          link: "components/introduction",
          text: "Components"
        }
      ]
    },
    {
      text: "Basics",
      items: [
        { link: "essentials/concept", text: "Basic Concepts" },
        { link: "essentials/development", text: "Local Development" },
        { link: "essentials/route", text: "Routing and Menu" },
        { link: "essentials/settings", text: "Configuration" },
        { link: "essentials/icons", text: "Icons" },
        { link: "essentials/styles", text: "Styles" },
        { link: "essentials/external-module", text: "External Modules" },
        { link: "essentials/build", text: "Build and Deployment" },
        { link: "essentials/server", text: "Server Interaction and Data Mock" }
      ]
    },
    {
      text: "Advanced",
      items: [
        { link: "in-depth/login", text: "Login" },
        { link: "in-depth/theme", text: "Theme" },
        { link: "in-depth/access", text: "Access Control" },
        { link: "in-depth/locale", text: "Internationalization" },
        { link: "in-depth/features", text: "Common Features" },
        { link: "in-depth/check-updates", text: "Check Updates" },
        { link: "in-depth/loading", text: "Global Loading" },
        { link: "in-depth/ui-framework", text: "UI Framework Switching" }
      ]
    },
    {
      text: "Engineering",
      items: [
        { link: "project/standard", text: "Standards" },
        { link: "project/cli", text: "CLI" },
        { link: "project/dir", text: "Directory Explanation" },
        { link: "project/test", text: "Unit Testing" },
        { link: "project/tailwindcss", text: "Tailwind CSS" },
        { link: "project/changeset", text: "Changeset" },
        { link: "project/vite", text: "Vite Config" }
      ]
    },
    {
      text: "Others",
      items: [
        { link: "other/project-update", text: "Project Update" },
        { link: "other/remove-code", text: "Remove Code" },
        { link: "other/faq", text: "FAQ" }
      ]
    }
  ];
}
function sidebarCommercial() {
  return [
    {
      link: "community",
      text: "Community"
    },
    {
      link: "technical-support",
      text: "Technical-support"
    },
    {
      link: "customized",
      text: "Customized"
    }
  ];
}
function sidebarComponents() {
  return [
    {
      text: "Components",
      items: [
        {
          link: "introduction",
          text: "Introduction"
        }
      ]
    },
    {
      collapsed: false,
      text: "Layout UI",
      items: [
        {
          link: "layout-ui/page",
          text: "Page"
        }
      ]
    },
    {
      collapsed: false,
      text: "Common UI",
      items: [
        {
          link: "common-ui/vben-api-component",
          text: "ApiComponent"
        },
        {
          link: "common-ui/vben-alert",
          text: "Alert"
        },
        {
          link: "common-ui/vben-modal",
          text: "Modal"
        },
        {
          link: "common-ui/vben-drawer",
          text: "Drawer"
        },
        {
          link: "common-ui/vben-form",
          text: "Form"
        },
        {
          link: "common-ui/vben-vxe-table",
          text: "Vxe Table"
        },
        {
          link: "common-ui/vben-count-to-animator",
          text: "CountToAnimator"
        },
        {
          link: "common-ui/vben-ellipsis-text",
          text: "EllipsisText"
        },
        {
          link: "common-ui/vben-cropper",
          text: "Cropper"
        },
        {
          link: "common-ui/vben-tiptap",
          text: "Tiptap RichTextEditor"
        }
      ]
    }
  ];
}
function nav() {
  return [
    {
      activeMatch: "^/en/(guide|components)/",
      text: "Doc",
      items: [
        {
          activeMatch: "^/en/guide/",
          link: "/en/guide/introduction/vben",
          text: "Guide"
        },
        {
          activeMatch: "^/en/components/",
          link: "/en/components/introduction",
          text: "Components"
        },
        {
          text: "Historical Versions",
          items: [
            {
              link: "https://doc.vvbin.cn",
              text: "2.x Version Documentation"
            }
          ]
        }
      ]
    },
    {
      text: "Demo",
      items: [
        {
          text: "Vben Admin",
          items: [
            {
              link: "https://www.vben.pro",
              text: "Demo Version"
            },
            {
              link: "https://ant.vben.pro",
              text: "Ant Design Vue Version"
            },
            {
              link: "https://naive.vben.pro",
              text: "Naive Version"
            },
            {
              link: "https://ele.vben.pro",
              text: "Element Plus Version"
            }
          ]
        },
        {
          text: "Others",
          items: [
            {
              link: "https://vben.vvbin.cn",
              text: "Vben Admin 2.x"
            }
          ]
        }
      ]
    },
    {
      text: version,
      items: [
        {
          link: "https://github.com/vbenjs/vue-vben-admin/releases",
          text: "Changelog"
        },
        {
          link: "https://github.com/orgs/vbenjs/projects/5",
          text: "Roadmap"
        },
        {
          link: "https://github.com/vbenjs/vue-vben-admin/blob/main/.github/contributing.md",
          text: "Contribution"
        }
      ]
    },
    {
      link: "/commercial/technical-support",
      text: "\u{1F984} Tech Support"
    },
    {
      link: "/sponsor/personal",
      text: "\u2728 Sponsor"
    },
    {
      link: "/commercial/community",
      text: "\u{1F468}\u200D\u{1F466}\u200D\u{1F466} Community"
    }
    // {
    //   link: '/friend-links/',
    //   text: '🤝 Friend Links',
    // },
  ];
}

// .vitepress/config/shared.mts
import { resolve } from "node:path";
import {
  viteArchiverPlugin,
  viteVxeTableImportsPlugin
} from "file:///Users/liyanhui/vscodeProjects/vue-vben-admin2/internal/vite-config/dist/index.mjs";
import {
  GitChangelog,
  GitChangelogMarkdownSection
} from "file:///Users/liyanhui/vscodeProjects/vue-vben-admin2/node_modules/.pnpm/@nolebase+vitepress-plugin-git-changelog@2.18.2_vitepress@1.6.4_@algolia+client-search@_66f3625638aa4924a4678b8af4c37feb/node_modules/@nolebase/vitepress-plugin-git-changelog/dist/vite/index.mjs";
import tailwindcss from "file:///Users/liyanhui/vscodeProjects/vue-vben-admin2/node_modules/.pnpm/@tailwindcss+vite@4.2.4_vite@8.0.10_@types+node@25.6.0_esbuild@0.27.7_jiti@2.6.1_less@4_19451ed0ff87bb4316d6ce5983e6d60f/node_modules/@tailwindcss/vite/dist/index.mjs";
import { defineConfig as defineConfig3, postcssIsolateStyles } from "file:///Users/liyanhui/vscodeProjects/vue-vben-admin2/node_modules/.pnpm/vitepress@1.6.4_@algolia+client-search@5.51.0_@types+node@25.6.0_async-validator@4.2.5__739f022d7edc0ed0cca26b76bc3c0f41/node_modules/vitepress/dist/node/index.js";
import {
  groupIconMdPlugin,
  groupIconVitePlugin
} from "file:///Users/liyanhui/vscodeProjects/vue-vben-admin2/node_modules/.pnpm/vitepress-plugin-group-icons@1.7.5_vite@8.0.10_@types+node@25.6.0_esbuild@0.27.7_jiti@2_bc4594a8c5a6663031711488fea0493c/node_modules/vitepress-plugin-group-icons/dist/index.mjs";

// .vitepress/config/plugins/demo-preview.ts
import crypto from "node:crypto";
import { readdirSync } from "node:fs";
import { join } from "node:path";
var rawPathRegexp = /^(.+?(?:\.([\da-z]+))?)(#[\w-]+)?(?: ?{(\d+(?:[,-]\d+)*)? ?(\S+)?})? ?(?:\[(.+)])?$/;
function rawPathToToken(rawPath) {
  const [
    filepath = "",
    extension = "",
    region = "",
    lines = "",
    lang = "",
    rawTitle = ""
  ] = (rawPathRegexp.exec(rawPath) || []).slice(1);
  const title = rawTitle || filepath.split("/").pop() || "";
  return { extension, filepath, lang, lines, region, title };
}
var demoPreviewPlugin = (md) => {
  md.core.ruler.after("inline", "demo-preview", (state) => {
    const insertComponentImport = (importString) => {
      const index = state.tokens.findIndex(
        (i) => i.type === "html_block" && i.content.match(/<script setup>/g)
      );
      if (index === -1) {
        const importComponent = new state.Token("html_block", "", 0);
        importComponent.content = `<script setup>
${importString}
</script>
`;
        state.tokens.splice(0, 0, importComponent);
      } else {
        if (state.tokens[index]) {
          const content = state.tokens[index].content;
          state.tokens[index].content = content.replace(
            "</script>",
            `${importString}
</script>`
          );
        }
      }
    };
    const regex = /<DemoPreview[^>]*\sdir="([^"]*)"/g;
    state.src = state.src.replaceAll(regex, (_match, dir) => {
      const componentDir = join(process.cwd(), "src", dir).replaceAll(
        "\\",
        "/"
      );
      let childFiles = [];
      let dirExists = true;
      try {
        childFiles = readdirSync(componentDir, {
          encoding: "utf8",
          recursive: false,
          withFileTypes: false
        }) || [];
      } catch {
        dirExists = false;
      }
      if (!dirExists) {
        return "";
      }
      const uniqueWord = generateContentHash(componentDir);
      const ComponentName = `DemoComponent_${uniqueWord}`;
      insertComponentImport(
        `import ${ComponentName} from '${componentDir}/index.vue'`
      );
      const { path: _path } = state.env;
      const index = state.tokens.findIndex((i) => i.content.match(regex));
      if (!state.tokens[index]) {
        return "";
      }
      const firstString = "index.vue";
      childFiles = childFiles.toSorted((a, b) => {
        if (a === firstString) return -1;
        if (b === firstString) return 1;
        return a.localeCompare(b, "en", { sensitivity: "base" });
      });
      state.tokens[index].content = `<DemoPreview files="${encodeURIComponent(JSON.stringify(childFiles))}" ><${ComponentName}/>
        `;
      const _dummyToken = new state.Token("", "", 0);
      const tokenArray = [];
      childFiles.forEach((filename) => {
        const templateStart = new state.Token("html_inline", "", 0);
        templateStart.content = `<template #${filename}>`;
        tokenArray.push(templateStart);
        const resolvedPath = join(componentDir, filename);
        const { extension, filepath, lang, lines, title } = rawPathToToken(resolvedPath);
        const token = new state.Token("fence", "code", 0);
        token.info = `${lang || extension}${lines ? `{${lines}}` : ""}${title ? `[${title}]` : ""}`;
        token.content = `<<< ${filepath}`;
        token.src = [resolvedPath];
        tokenArray.push(token);
        const templateEnd = new state.Token("html_inline", "", 0);
        templateEnd.content = "</template>";
        tokenArray.push(templateEnd);
      });
      const endTag = new state.Token("html_inline", "", 0);
      endTag.content = "</DemoPreview>";
      tokenArray.push(endTag);
      state.tokens.splice(index + 1, 0, ...tokenArray);
      return "";
    });
  });
};
function generateContentHash(input, length = 10) {
  const hash = crypto.createHash("sha256").update(input).digest("hex");
  return Number.parseInt(hash, 16).toString(36).slice(0, length);
}

// .vitepress/config/zh.mts
import { defineConfig as defineConfig2 } from "file:///Users/liyanhui/vscodeProjects/vue-vben-admin2/node_modules/.pnpm/vitepress@1.6.4_@algolia+client-search@5.51.0_@types+node@25.6.0_async-validator@4.2.5__739f022d7edc0ed0cca26b76bc3c0f41/node_modules/vitepress/dist/node/index.js";
var zh = defineConfig2({
  description: "Vben Admin & \u4F01\u4E1A\u7EA7\u7BA1\u7406\u7CFB\u7EDF\u6846\u67B6",
  lang: "zh-Hans",
  themeConfig: {
    darkModeSwitchLabel: "\u4E3B\u9898",
    darkModeSwitchTitle: "\u5207\u6362\u5230\u6DF1\u8272\u6A21\u5F0F",
    docFooter: {
      next: "\u4E0B\u4E00\u9875",
      prev: "\u4E0A\u4E00\u9875"
    },
    editLink: {
      pattern: "https://github.com/vbenjs/vue-vben-admin/edit/main/docs/src/:path",
      text: "\u5728 GitHub \u4E0A\u7F16\u8F91\u6B64\u9875\u9762"
    },
    footer: {
      copyright: `Copyright \xA9 2020-${(/* @__PURE__ */ new Date()).getFullYear()} Vben`,
      message: "\u57FA\u4E8E MIT \u8BB8\u53EF\u53D1\u5E03."
    },
    langMenuLabel: "\u591A\u8BED\u8A00",
    lastUpdated: {
      formatOptions: {
        dateStyle: "short",
        timeStyle: "medium"
      },
      text: "\u6700\u540E\u66F4\u65B0\u4E8E"
    },
    lightModeSwitchTitle: "\u5207\u6362\u5230\u6D45\u8272\u6A21\u5F0F",
    nav: nav2(),
    outline: {
      label: "\u9875\u9762\u5BFC\u822A"
    },
    returnToTopLabel: "\u56DE\u5230\u9876\u90E8",
    sidebar: {
      "/commercial/": { base: "/commercial/", items: sidebarCommercial2() },
      "/components/": { base: "/components/", items: sidebarComponents2() },
      "/guide/": { base: "/guide/", items: sidebarGuide2() }
    },
    sidebarMenuLabel: "\u83DC\u5355"
  }
});
function sidebarGuide2() {
  return [
    {
      collapsed: false,
      text: "\u7B80\u4ECB",
      items: [
        {
          link: "introduction/vben",
          text: "\u5173\u4E8E Vben Admin"
        },
        {
          link: "introduction/why",
          text: "\u4E3A\u4EC0\u4E48\u9009\u62E9\u6211\u4EEC?"
        },
        { link: "introduction/quick-start", text: "\u5FEB\u901F\u5F00\u59CB" },
        { link: "introduction/thin", text: "\u7CBE\u7B80\u7248\u672C" },
        {
          base: "/",
          link: "components/introduction",
          text: "\u7EC4\u4EF6\u6587\u6863"
        }
      ]
    },
    {
      text: "\u57FA\u7840",
      items: [
        { link: "essentials/concept", text: "\u57FA\u7840\u6982\u5FF5" },
        { link: "essentials/development", text: "\u672C\u5730\u5F00\u53D1" },
        { link: "essentials/route", text: "\u8DEF\u7531\u548C\u83DC\u5355" },
        { link: "essentials/settings", text: "\u914D\u7F6E" },
        { link: "essentials/icons", text: "\u56FE\u6807" },
        { link: "essentials/styles", text: "\u6837\u5F0F" },
        { link: "essentials/external-module", text: "\u5916\u90E8\u6A21\u5757" },
        { link: "essentials/build", text: "\u6784\u5EFA\u4E0E\u90E8\u7F72" },
        { link: "essentials/server", text: "\u670D\u52A1\u7AEF\u4EA4\u4E92\u4E0E\u6570\u636EMock" }
      ]
    },
    {
      text: "\u6DF1\u5165",
      items: [
        { link: "in-depth/login", text: "\u767B\u5F55" },
        // { link: 'in-depth/layout', text: '布局' },
        { link: "in-depth/theme", text: "\u4E3B\u9898" },
        { link: "in-depth/access", text: "\u6743\u9650" },
        { link: "in-depth/locale", text: "\u56FD\u9645\u5316" },
        { link: "in-depth/features", text: "\u5E38\u7528\u529F\u80FD" },
        { link: "in-depth/check-updates", text: "\u68C0\u67E5\u66F4\u65B0" },
        { link: "in-depth/loading", text: "\u5168\u5C40loading" },
        { link: "in-depth/ui-framework", text: "\u7EC4\u4EF6\u5E93\u5207\u6362" }
      ]
    },
    {
      text: "\u5DE5\u7A0B",
      items: [
        { link: "project/standard", text: "\u89C4\u8303" },
        { link: "project/cli", text: "CLI" },
        { link: "project/dir", text: "\u76EE\u5F55\u8BF4\u660E" },
        { link: "project/test", text: "\u5355\u5143\u6D4B\u8BD5" },
        { link: "project/tailwindcss", text: "Tailwind CSS" },
        { link: "project/changeset", text: "Changeset" },
        { link: "project/vite", text: "Vite Config" }
      ]
    },
    {
      text: "\u5176\u4ED6",
      items: [
        { link: "other/project-update", text: "\u9879\u76EE\u66F4\u65B0" },
        { link: "other/remove-code", text: "\u79FB\u9664\u4EE3\u7801" },
        { link: "other/faq", text: "\u5E38\u89C1\u95EE\u9898" }
      ]
    }
  ];
}
function sidebarCommercial2() {
  return [
    {
      link: "community",
      text: "\u4EA4\u6D41\u7FA4"
    },
    {
      link: "technical-support",
      text: "\u6280\u672F\u652F\u6301"
    },
    {
      link: "customized",
      text: "\u5B9A\u5236\u5F00\u53D1"
    }
  ];
}
function sidebarComponents2() {
  return [
    {
      text: "\u7EC4\u4EF6",
      items: [
        {
          link: "introduction",
          text: "\u4ECB\u7ECD"
        }
      ]
    },
    {
      collapsed: false,
      text: "\u5E03\u5C40\u7EC4\u4EF6",
      items: [
        {
          link: "layout-ui/page",
          text: "Page \u9875\u9762"
        }
      ]
    },
    {
      collapsed: false,
      text: "\u901A\u7528\u7EC4\u4EF6",
      items: [
        {
          link: "common-ui/vben-api-component",
          text: "ApiComponent Api\u7EC4\u4EF6\u5305\u88C5\u5668"
        },
        {
          link: "common-ui/vben-alert",
          text: "Alert \u8F7B\u91CF\u63D0\u793A\u6846"
        },
        {
          link: "common-ui/vben-modal",
          text: "Modal \u6A21\u6001\u6846"
        },
        {
          link: "common-ui/vben-drawer",
          text: "Drawer \u62BD\u5C49"
        },
        {
          link: "common-ui/vben-form",
          text: "Form \u8868\u5355"
        },
        {
          link: "common-ui/vben-vxe-table",
          text: "Vxe Table \u8868\u683C"
        },
        {
          link: "common-ui/vben-count-to-animator",
          text: "CountToAnimator \u6570\u5B57\u52A8\u753B"
        },
        {
          link: "common-ui/vben-ellipsis-text",
          text: "EllipsisText \u7701\u7565\u6587\u672C"
        },
        {
          link: "common-ui/vben-cropper",
          text: "Cropper \u56FE\u7247\u88C1\u526A"
        },
        {
          link: "common-ui/vben-tiptap",
          text: "Tiptap \u5BCC\u6587\u672C\u7F16\u8F91\u5668"
        }
      ]
    }
  ];
}
function nav2() {
  return [
    {
      activeMatch: "^/(guide|components)/",
      text: "\u6587\u6863",
      items: [
        {
          activeMatch: "^/guide/",
          link: "/guide/introduction/vben",
          text: "\u6307\u5357"
        },
        {
          activeMatch: "^/components/",
          link: "/components/introduction",
          text: "\u7EC4\u4EF6"
        },
        {
          text: "\u5386\u53F2\u7248\u672C",
          items: [
            {
              link: "https://doc.vvbin.cn",
              text: "2.x\u7248\u672C\u6587\u6863"
            }
          ]
        }
      ]
    },
    {
      text: "\u6F14\u793A",
      items: [
        {
          text: "Vben Admin",
          items: [
            {
              link: "https://www.vben.pro",
              text: "\u6F14\u793A\u7248\u672C"
            },
            {
              link: "https://ant.vben.pro",
              text: "Ant Design Vue \u7248\u672C"
            },
            {
              link: "https://naive.vben.pro",
              text: "Naive \u7248\u672C"
            },
            {
              link: "https://ele.vben.pro",
              text: "Element Plus\u7248\u672C"
            }
          ]
        },
        {
          text: "\u5176\u4ED6",
          items: [
            {
              link: "https://vben.vvbin.cn",
              text: "Vben Admin 2.x"
            }
          ]
        }
      ]
    },
    {
      text: version,
      items: [
        {
          link: "https://github.com/vbenjs/vue-vben-admin/releases",
          text: "\u66F4\u65B0\u65E5\u5FD7"
        },
        {
          link: "https://github.com/orgs/vbenjs/projects/5",
          text: "\u8DEF\u7EBF\u56FE"
        },
        {
          link: "https://github.com/vbenjs/vue-vben-admin/blob/main/.github/contributing.md",
          text: "\u8D21\u732E"
        }
      ]
    },
    {
      link: "/commercial/technical-support",
      text: "\u{1F984} \u6280\u672F\u652F\u6301"
    },
    {
      link: "/sponsor/personal",
      text: "\u2728 \u8D5E\u52A9"
    },
    {
      link: "/commercial/community",
      text: "\u{1F468}\u200D\u{1F466}\u200D\u{1F466} \u4EA4\u6D41\u7FA4"
      // items: [
      //   {
      //     link: 'https://qun.qq.com/qqweb/qunpro/share?_wv=3&_wwv=128&appChannel=share&inviteCode=22ySzj7pKiw&businessType=9&from=246610&biz=ka&mainSourceId=share&subSourceId=others&jumpsource=shorturl#/pc',
      //     text: 'QQ频道',
      //   },
      //   {
      //     link: 'https://qm.qq.com/cgi-bin/qm/qr?_wv=1027&k=mjZmlhgVzzUxvdxllB6C1vHpX8O8QRL0&authKey=DBdFbBwERmfaKY95JvRWqLCJIRGJAmKyZbrpzZ41EKDMZ5SR6MfbjOBaaNRN73fr&noverify=0&group_code=4286109',
      //     text: 'QQ群',
      //   },
      //   {
      //     link: 'https://discord.gg/VU62jTecad',
      //     text: 'Discord',
      //   },
      // ],
    }
    // {
    //   link: '/friend-links/',
    //   text: '🤝 友情链接',
    // },
  ];
}
var search = {
  root: {
    placeholder: "\u641C\u7D22\u6587\u6863",
    translations: {
      button: {
        buttonAriaLabel: "\u641C\u7D22\u6587\u6863",
        buttonText: "\u641C\u7D22\u6587\u6863"
      },
      modal: {
        errorScreen: {
          helpText: "\u4F60\u53EF\u80FD\u9700\u8981\u68C0\u67E5\u4F60\u7684\u7F51\u7EDC\u8FDE\u63A5",
          titleText: "\u65E0\u6CD5\u83B7\u53D6\u7ED3\u679C"
        },
        footer: {
          closeText: "\u5173\u95ED",
          navigateText: "\u5207\u6362",
          searchByText: "\u641C\u7D22\u63D0\u4F9B\u8005",
          selectText: "\u9009\u62E9"
        },
        noResultsScreen: {
          noResultsText: "\u65E0\u6CD5\u627E\u5230\u76F8\u5173\u7ED3\u679C",
          reportMissingResultsLinkText: "\u70B9\u51FB\u53CD\u9988",
          reportMissingResultsText: "\u4F60\u8BA4\u4E3A\u8BE5\u67E5\u8BE2\u5E94\u8BE5\u6709\u7ED3\u679C\uFF1F",
          suggestedQueryText: "\u4F60\u53EF\u4EE5\u5C1D\u8BD5\u67E5\u8BE2"
        },
        searchBox: {
          cancelButtonAriaLabel: "\u53D6\u6D88",
          cancelButtonText: "\u53D6\u6D88",
          resetButtonAriaLabel: "\u6E05\u9664\u67E5\u8BE2\u6761\u4EF6",
          resetButtonTitle: "\u6E05\u9664\u67E5\u8BE2\u6761\u4EF6"
        },
        startScreen: {
          favoriteSearchesTitle: "\u6536\u85CF",
          noRecentSearchesText: "\u6CA1\u6709\u641C\u7D22\u5386\u53F2",
          recentSearchesTitle: "\u641C\u7D22\u5386\u53F2",
          removeFavoriteSearchButtonTitle: "\u4ECE\u6536\u85CF\u4E2D\u79FB\u9664",
          removeRecentSearchButtonTitle: "\u4ECE\u641C\u7D22\u5386\u53F2\u4E2D\u79FB\u9664",
          saveRecentSearchButtonTitle: "\u4FDD\u5B58\u81F3\u641C\u7D22\u5386\u53F2"
        }
      }
    }
  }
};

// .vitepress/config/shared.mts
var shared = defineConfig3({
  appearance: "dark",
  head: head(),
  markdown: {
    preConfig(md) {
      md.use(demoPreviewPlugin);
      md.use(groupIconMdPlugin);
    }
  },
  pwa: pwa(),
  srcDir: "src",
  themeConfig: {
    i18nRouting: true,
    logo: "https://unpkg.com/@vbenjs/static-source@0.1.7/source/logo-v1.webp",
    search: {
      options: {
        locales: {
          ...search
        }
      },
      provider: "local"
    },
    siteTitle: "Vben Admin",
    socialLinks: [
      { icon: "github", link: "https://github.com/vbenjs/vue-vben-admin" }
    ]
  },
  title: "Vben Admin",
  vite: {
    build: {
      chunkSizeWarningLimit: Infinity,
      minify: "terser"
    },
    css: {
      postcss: {
        plugins: [postcssIsolateStyles({ includeFiles: [/vp-doc\.css/] })]
      },
      preprocessorOptions: {
        scss: {
          api: "modern"
        }
      }
    },
    json: {
      stringify: true
    },
    plugins: [
      tailwindcss(),
      GitChangelog({
        mapAuthors: [
          {
            mapByNameAliases: ["Vben"],
            name: "vben",
            username: "anncwb"
          },
          {
            name: "vince",
            username: "vince292007"
          },
          {
            name: "Li Kui",
            username: "likui628"
          }
        ],
        repoURL: () => "https://github.com/vbenjs/vue-vben-admin"
      }),
      GitChangelogMarkdownSection(),
      viteArchiverPlugin({ outputDir: ".vitepress" }),
      groupIconVitePlugin(),
      await viteVxeTableImportsPlugin()
    ],
    server: {
      fs: {
        allow: ["../.."]
      },
      host: true,
      port: 6173
    },
    ssr: {
      external: ["@vue/repl"]
    }
  }
});
function head() {
  return [
    ["meta", { content: "Vbenjs Team", name: "author" }],
    [
      "meta",
      {
        content: "vben, vitejs, vite, shacdn-ui, vue",
        name: "keywords"
      }
    ],
    ["link", { href: "/favicon.ico", rel: "icon", type: "image/svg+xml" }],
    [
      "meta",
      {
        content: "width=device-width,initial-scale=1,minimum-scale=1.0,maximum-scale=1.0,user-scalable=no",
        name: "viewport"
      }
    ],
    ["meta", { content: "vben admin docs", name: "keywords" }],
    ["link", { href: "/favicon.ico", rel: "icon" }]
    // [
    //   'script',
    //   {
    //     src: 'https://cdn.tailwindcss.com',
    //   },
    // ],
  ];
}
function pwa() {
  return {
    includeManifestIcons: false,
    manifest: {
      description: "Vben Admin is a modern admin dashboard template based on Vue 3. ",
      icons: [
        {
          sizes: "192x192",
          src: "https://unpkg.com/@vbenjs/static-source@0.1.7/source/pwa-icon-192.png",
          type: "image/png"
        },
        {
          sizes: "512x512",
          src: "https://unpkg.com/@vbenjs/static-source@0.1.7/source/pwa-icon-512.png",
          type: "image/png"
        }
      ],
      id: "/",
      name: "Vben Admin Doc",
      short_name: "vben_admin_doc",
      theme_color: "#ffffff"
    },
    outDir: resolve(process.cwd(), ".vitepress/dist"),
    registerType: "autoUpdate",
    workbox: {
      globPatterns: ["**/*.{css,js,html,svg,png,ico,txt,woff2}"],
      maximumFileSizeToCacheInBytes: 5 * 1024 * 1024
    }
  };
}

// .vitepress/config/index.mts
var config_default = withPwa(
  defineConfigWithTheme({
    ...shared,
    locales: {
      en: {
        label: "English",
        lang: "en",
        link: "/en/",
        ...en
      },
      root: {
        label: "\u7B80\u4F53\u4E2D\u6587",
        lang: "zh-CN",
        ...zh
      }
    }
  })
);
export {
  config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLnZpdGVwcmVzcy9jb25maWcvaW5kZXgubXRzIiwgIi52aXRlcHJlc3MvY29uZmlnL2VuLm10cyIsICIuLi9wYWNrYWdlLmpzb24iLCAiLnZpdGVwcmVzcy9jb25maWcvc2hhcmVkLm10cyIsICIudml0ZXByZXNzL2NvbmZpZy9wbHVnaW5zL2RlbW8tcHJldmlldy50cyIsICIudml0ZXByZXNzL2NvbmZpZy96aC5tdHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvbGl5YW5odWkvdnNjb2RlUHJvamVjdHMvdnVlLXZiZW4tYWRtaW4yL2RvY3MvLnZpdGVwcmVzcy9jb25maWdcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9saXlhbmh1aS92c2NvZGVQcm9qZWN0cy92dWUtdmJlbi1hZG1pbjIvZG9jcy8udml0ZXByZXNzL2NvbmZpZy9pbmRleC5tdHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL2xpeWFuaHVpL3ZzY29kZVByb2plY3RzL3Z1ZS12YmVuLWFkbWluMi9kb2NzLy52aXRlcHJlc3MvY29uZmlnL2luZGV4Lm10c1wiO2ltcG9ydCB7IHdpdGhQd2EgfSBmcm9tICdAdml0ZS1wd2Evdml0ZXByZXNzJztcbmltcG9ydCB7IGRlZmluZUNvbmZpZ1dpdGhUaGVtZSB9IGZyb20gJ3ZpdGVwcmVzcyc7XG5cbmltcG9ydCB7IGVuIH0gZnJvbSAnLi9lbi5tdHMnO1xuaW1wb3J0IHsgc2hhcmVkIH0gZnJvbSAnLi9zaGFyZWQubXRzJztcbmltcG9ydCB7IHpoIH0gZnJvbSAnLi96aC5tdHMnO1xuXG5leHBvcnQgZGVmYXVsdCB3aXRoUHdhKFxuICBkZWZpbmVDb25maWdXaXRoVGhlbWUoe1xuICAgIC4uLnNoYXJlZCxcbiAgICBsb2NhbGVzOiB7XG4gICAgICBlbjoge1xuICAgICAgICBsYWJlbDogJ0VuZ2xpc2gnLFxuICAgICAgICBsYW5nOiAnZW4nLFxuICAgICAgICBsaW5rOiAnL2VuLycsXG4gICAgICAgIC4uLmVuLFxuICAgICAgfSxcbiAgICAgIHJvb3Q6IHtcbiAgICAgICAgbGFiZWw6ICdcdTdCODBcdTRGNTNcdTRFMkRcdTY1ODcnLFxuICAgICAgICBsYW5nOiAnemgtQ04nLFxuICAgICAgICAuLi56aCxcbiAgICAgIH0sXG4gICAgfSxcbiAgfSksXG4pO1xuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvbGl5YW5odWkvdnNjb2RlUHJvamVjdHMvdnVlLXZiZW4tYWRtaW4yL2RvY3MvLnZpdGVwcmVzcy9jb25maWdcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9saXlhbmh1aS92c2NvZGVQcm9qZWN0cy92dWUtdmJlbi1hZG1pbjIvZG9jcy8udml0ZXByZXNzL2NvbmZpZy9lbi5tdHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL2xpeWFuaHVpL3ZzY29kZVByb2plY3RzL3Z1ZS12YmVuLWFkbWluMi9kb2NzLy52aXRlcHJlc3MvY29uZmlnL2VuLm10c1wiO2ltcG9ydCB0eXBlIHsgRGVmYXVsdFRoZW1lIH0gZnJvbSAndml0ZXByZXNzJztcblxuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZXByZXNzJztcblxuaW1wb3J0IHsgdmVyc2lvbiB9IGZyb20gJy4uLy4uLy4uL3BhY2thZ2UuanNvbic7XG5cbmV4cG9ydCBjb25zdCBlbiA9IGRlZmluZUNvbmZpZyh7XG4gIGRlc2NyaXB0aW9uOiAnVmJlbiBBZG1pbiAmIEVudGVycHJpc2UgbGV2ZWwgbWFuYWdlbWVudCBzeXN0ZW0gZnJhbWV3b3JrJyxcbiAgbGFuZzogJ2VuLVVTJyxcbiAgdGhlbWVDb25maWc6IHtcbiAgICBkYXJrTW9kZVN3aXRjaExhYmVsOiAnVGhlbWUnLFxuICAgIGRhcmtNb2RlU3dpdGNoVGl0bGU6ICdTd2l0Y2ggdG8gRGFyayBNb2RlJyxcbiAgICBkb2NGb290ZXI6IHtcbiAgICAgIG5leHQ6ICdOZXh0IFBhZ2UnLFxuICAgICAgcHJldjogJ1ByZXZpb3VzIFBhZ2UnLFxuICAgIH0sXG4gICAgZWRpdExpbms6IHtcbiAgICAgIHBhdHRlcm46XG4gICAgICAgICdodHRwczovL2dpdGh1Yi5jb20vdmJlbmpzL3Z1ZS12YmVuLWFkbWluL2VkaXQvbWFpbi9kb2NzL3NyYy86cGF0aCcsXG4gICAgICB0ZXh0OiAnRWRpdCB0aGlzIHBhZ2Ugb24gR2l0SHViJyxcbiAgICB9LFxuICAgIGZvb3Rlcjoge1xuICAgICAgY29weXJpZ2h0OiBgQ29weXJpZ2h0IFx1MDBBOSAyMDIwLSR7bmV3IERhdGUoKS5nZXRGdWxsWWVhcigpfSBWYmVuYCxcbiAgICAgIG1lc3NhZ2U6ICdSZWxlYXNlZCB1bmRlciB0aGUgTUlUIExpY2Vuc2UuJyxcbiAgICB9LFxuICAgIGxhbmdNZW51TGFiZWw6ICdMYW5ndWFnZScsXG4gICAgbGFzdFVwZGF0ZWQ6IHtcbiAgICAgIGZvcm1hdE9wdGlvbnM6IHtcbiAgICAgICAgZGF0ZVN0eWxlOiAnc2hvcnQnLFxuICAgICAgICB0aW1lU3R5bGU6ICdtZWRpdW0nLFxuICAgICAgfSxcbiAgICAgIHRleHQ6ICdMYXN0IHVwZGF0ZWQgb24nLFxuICAgIH0sXG4gICAgbGlnaHRNb2RlU3dpdGNoVGl0bGU6ICdTd2l0Y2ggdG8gTGlnaHQgTW9kZScsXG4gICAgbmF2OiBuYXYoKSxcbiAgICBvdXRsaW5lOiB7XG4gICAgICBsYWJlbDogJ05hdmlnYXRlJyxcbiAgICB9LFxuICAgIHJldHVyblRvVG9wTGFiZWw6ICdCYWNrIHRvIHRvcCcsXG4gICAgc2lkZWJhcjoge1xuICAgICAgJy9lbi9jb21tZXJjaWFsLyc6IHtcbiAgICAgICAgYmFzZTogJy9lbi9jb21tZXJjaWFsLycsXG4gICAgICAgIGl0ZW1zOiBzaWRlYmFyQ29tbWVyY2lhbCgpLFxuICAgICAgfSxcbiAgICAgICcvZW4vY29tcG9uZW50cy8nOiB7XG4gICAgICAgIGJhc2U6ICcvZW4vY29tcG9uZW50cy8nLFxuICAgICAgICBpdGVtczogc2lkZWJhckNvbXBvbmVudHMoKSxcbiAgICAgIH0sXG4gICAgICAnL2VuL2d1aWRlLyc6IHsgYmFzZTogJy9lbi9ndWlkZS8nLCBpdGVtczogc2lkZWJhckd1aWRlKCkgfSxcbiAgICB9LFxuICB9LFxufSk7XG5cbmZ1bmN0aW9uIHNpZGViYXJHdWlkZSgpOiBEZWZhdWx0VGhlbWUuU2lkZWJhckl0ZW1bXSB7XG4gIHJldHVybiBbXG4gICAge1xuICAgICAgY29sbGFwc2VkOiBmYWxzZSxcbiAgICAgIHRleHQ6ICdJbnRyb2R1Y3Rpb24nLFxuICAgICAgaXRlbXM6IFtcbiAgICAgICAge1xuICAgICAgICAgIGxpbms6ICdpbnRyb2R1Y3Rpb24vdmJlbicsXG4gICAgICAgICAgdGV4dDogJ0Fib3V0IFZiZW4gQWRtaW4nLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgbGluazogJ2ludHJvZHVjdGlvbi93aHknLFxuICAgICAgICAgIHRleHQ6ICdXaHkgQ2hvb3NlIFVzPycsXG4gICAgICAgIH0sXG4gICAgICAgIHsgbGluazogJ2ludHJvZHVjdGlvbi9xdWljay1zdGFydCcsIHRleHQ6ICdRdWljayBTdGFydCcgfSxcbiAgICAgICAgeyBsaW5rOiAnaW50cm9kdWN0aW9uL3RoaW4nLCB0ZXh0OiAnTGl0ZSBWZXJzaW9uJyB9LFxuICAgICAgICB7XG4gICAgICAgICAgYmFzZTogJy8nLFxuICAgICAgICAgIGxpbms6ICdjb21wb25lbnRzL2ludHJvZHVjdGlvbicsXG4gICAgICAgICAgdGV4dDogJ0NvbXBvbmVudHMnLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9LFxuICAgIHtcbiAgICAgIHRleHQ6ICdCYXNpY3MnLFxuICAgICAgaXRlbXM6IFtcbiAgICAgICAgeyBsaW5rOiAnZXNzZW50aWFscy9jb25jZXB0JywgdGV4dDogJ0Jhc2ljIENvbmNlcHRzJyB9LFxuICAgICAgICB7IGxpbms6ICdlc3NlbnRpYWxzL2RldmVsb3BtZW50JywgdGV4dDogJ0xvY2FsIERldmVsb3BtZW50JyB9LFxuICAgICAgICB7IGxpbms6ICdlc3NlbnRpYWxzL3JvdXRlJywgdGV4dDogJ1JvdXRpbmcgYW5kIE1lbnUnIH0sXG4gICAgICAgIHsgbGluazogJ2Vzc2VudGlhbHMvc2V0dGluZ3MnLCB0ZXh0OiAnQ29uZmlndXJhdGlvbicgfSxcbiAgICAgICAgeyBsaW5rOiAnZXNzZW50aWFscy9pY29ucycsIHRleHQ6ICdJY29ucycgfSxcbiAgICAgICAgeyBsaW5rOiAnZXNzZW50aWFscy9zdHlsZXMnLCB0ZXh0OiAnU3R5bGVzJyB9LFxuICAgICAgICB7IGxpbms6ICdlc3NlbnRpYWxzL2V4dGVybmFsLW1vZHVsZScsIHRleHQ6ICdFeHRlcm5hbCBNb2R1bGVzJyB9LFxuICAgICAgICB7IGxpbms6ICdlc3NlbnRpYWxzL2J1aWxkJywgdGV4dDogJ0J1aWxkIGFuZCBEZXBsb3ltZW50JyB9LFxuICAgICAgICB7IGxpbms6ICdlc3NlbnRpYWxzL3NlcnZlcicsIHRleHQ6ICdTZXJ2ZXIgSW50ZXJhY3Rpb24gYW5kIERhdGEgTW9jaycgfSxcbiAgICAgIF0sXG4gICAgfSxcbiAgICB7XG4gICAgICB0ZXh0OiAnQWR2YW5jZWQnLFxuICAgICAgaXRlbXM6IFtcbiAgICAgICAgeyBsaW5rOiAnaW4tZGVwdGgvbG9naW4nLCB0ZXh0OiAnTG9naW4nIH0sXG4gICAgICAgIHsgbGluazogJ2luLWRlcHRoL3RoZW1lJywgdGV4dDogJ1RoZW1lJyB9LFxuICAgICAgICB7IGxpbms6ICdpbi1kZXB0aC9hY2Nlc3MnLCB0ZXh0OiAnQWNjZXNzIENvbnRyb2wnIH0sXG4gICAgICAgIHsgbGluazogJ2luLWRlcHRoL2xvY2FsZScsIHRleHQ6ICdJbnRlcm5hdGlvbmFsaXphdGlvbicgfSxcbiAgICAgICAgeyBsaW5rOiAnaW4tZGVwdGgvZmVhdHVyZXMnLCB0ZXh0OiAnQ29tbW9uIEZlYXR1cmVzJyB9LFxuICAgICAgICB7IGxpbms6ICdpbi1kZXB0aC9jaGVjay11cGRhdGVzJywgdGV4dDogJ0NoZWNrIFVwZGF0ZXMnIH0sXG4gICAgICAgIHsgbGluazogJ2luLWRlcHRoL2xvYWRpbmcnLCB0ZXh0OiAnR2xvYmFsIExvYWRpbmcnIH0sXG4gICAgICAgIHsgbGluazogJ2luLWRlcHRoL3VpLWZyYW1ld29yaycsIHRleHQ6ICdVSSBGcmFtZXdvcmsgU3dpdGNoaW5nJyB9LFxuICAgICAgXSxcbiAgICB9LFxuICAgIHtcbiAgICAgIHRleHQ6ICdFbmdpbmVlcmluZycsXG4gICAgICBpdGVtczogW1xuICAgICAgICB7IGxpbms6ICdwcm9qZWN0L3N0YW5kYXJkJywgdGV4dDogJ1N0YW5kYXJkcycgfSxcbiAgICAgICAgeyBsaW5rOiAncHJvamVjdC9jbGknLCB0ZXh0OiAnQ0xJJyB9LFxuICAgICAgICB7IGxpbms6ICdwcm9qZWN0L2RpcicsIHRleHQ6ICdEaXJlY3RvcnkgRXhwbGFuYXRpb24nIH0sXG4gICAgICAgIHsgbGluazogJ3Byb2plY3QvdGVzdCcsIHRleHQ6ICdVbml0IFRlc3RpbmcnIH0sXG4gICAgICAgIHsgbGluazogJ3Byb2plY3QvdGFpbHdpbmRjc3MnLCB0ZXh0OiAnVGFpbHdpbmQgQ1NTJyB9LFxuICAgICAgICB7IGxpbms6ICdwcm9qZWN0L2NoYW5nZXNldCcsIHRleHQ6ICdDaGFuZ2VzZXQnIH0sXG4gICAgICAgIHsgbGluazogJ3Byb2plY3Qvdml0ZScsIHRleHQ6ICdWaXRlIENvbmZpZycgfSxcbiAgICAgIF0sXG4gICAgfSxcbiAgICB7XG4gICAgICB0ZXh0OiAnT3RoZXJzJyxcbiAgICAgIGl0ZW1zOiBbXG4gICAgICAgIHsgbGluazogJ290aGVyL3Byb2plY3QtdXBkYXRlJywgdGV4dDogJ1Byb2plY3QgVXBkYXRlJyB9LFxuICAgICAgICB7IGxpbms6ICdvdGhlci9yZW1vdmUtY29kZScsIHRleHQ6ICdSZW1vdmUgQ29kZScgfSxcbiAgICAgICAgeyBsaW5rOiAnb3RoZXIvZmFxJywgdGV4dDogJ0ZBUScgfSxcbiAgICAgIF0sXG4gICAgfSxcbiAgXTtcbn1cblxuZnVuY3Rpb24gc2lkZWJhckNvbW1lcmNpYWwoKTogRGVmYXVsdFRoZW1lLlNpZGViYXJJdGVtW10ge1xuICByZXR1cm4gW1xuICAgIHtcbiAgICAgIGxpbms6ICdjb21tdW5pdHknLFxuICAgICAgdGV4dDogJ0NvbW11bml0eScsXG4gICAgfSxcbiAgICB7XG4gICAgICBsaW5rOiAndGVjaG5pY2FsLXN1cHBvcnQnLFxuICAgICAgdGV4dDogJ1RlY2huaWNhbC1zdXBwb3J0JyxcbiAgICB9LFxuICAgIHtcbiAgICAgIGxpbms6ICdjdXN0b21pemVkJyxcbiAgICAgIHRleHQ6ICdDdXN0b21pemVkJyxcbiAgICB9LFxuICBdO1xufVxuXG5mdW5jdGlvbiBzaWRlYmFyQ29tcG9uZW50cygpOiBEZWZhdWx0VGhlbWUuU2lkZWJhckl0ZW1bXSB7XG4gIHJldHVybiBbXG4gICAge1xuICAgICAgdGV4dDogJ0NvbXBvbmVudHMnLFxuICAgICAgaXRlbXM6IFtcbiAgICAgICAge1xuICAgICAgICAgIGxpbms6ICdpbnRyb2R1Y3Rpb24nLFxuICAgICAgICAgIHRleHQ6ICdJbnRyb2R1Y3Rpb24nLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9LFxuICAgIHtcbiAgICAgIGNvbGxhcHNlZDogZmFsc2UsXG4gICAgICB0ZXh0OiAnTGF5b3V0IFVJJyxcbiAgICAgIGl0ZW1zOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBsaW5rOiAnbGF5b3V0LXVpL3BhZ2UnLFxuICAgICAgICAgIHRleHQ6ICdQYWdlJyxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSxcbiAgICB7XG4gICAgICBjb2xsYXBzZWQ6IGZhbHNlLFxuICAgICAgdGV4dDogJ0NvbW1vbiBVSScsXG4gICAgICBpdGVtczogW1xuICAgICAgICB7XG4gICAgICAgICAgbGluazogJ2NvbW1vbi11aS92YmVuLWFwaS1jb21wb25lbnQnLFxuICAgICAgICAgIHRleHQ6ICdBcGlDb21wb25lbnQnLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgbGluazogJ2NvbW1vbi11aS92YmVuLWFsZXJ0JyxcbiAgICAgICAgICB0ZXh0OiAnQWxlcnQnLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgbGluazogJ2NvbW1vbi11aS92YmVuLW1vZGFsJyxcbiAgICAgICAgICB0ZXh0OiAnTW9kYWwnLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgbGluazogJ2NvbW1vbi11aS92YmVuLWRyYXdlcicsXG4gICAgICAgICAgdGV4dDogJ0RyYXdlcicsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBsaW5rOiAnY29tbW9uLXVpL3ZiZW4tZm9ybScsXG4gICAgICAgICAgdGV4dDogJ0Zvcm0nLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgbGluazogJ2NvbW1vbi11aS92YmVuLXZ4ZS10YWJsZScsXG4gICAgICAgICAgdGV4dDogJ1Z4ZSBUYWJsZScsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBsaW5rOiAnY29tbW9uLXVpL3ZiZW4tY291bnQtdG8tYW5pbWF0b3InLFxuICAgICAgICAgIHRleHQ6ICdDb3VudFRvQW5pbWF0b3InLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgbGluazogJ2NvbW1vbi11aS92YmVuLWVsbGlwc2lzLXRleHQnLFxuICAgICAgICAgIHRleHQ6ICdFbGxpcHNpc1RleHQnLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgbGluazogJ2NvbW1vbi11aS92YmVuLWNyb3BwZXInLFxuICAgICAgICAgIHRleHQ6ICdDcm9wcGVyJyxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGxpbms6ICdjb21tb24tdWkvdmJlbi10aXB0YXAnLFxuICAgICAgICAgIHRleHQ6ICdUaXB0YXAgUmljaFRleHRFZGl0b3InLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9LFxuICBdO1xufVxuXG5mdW5jdGlvbiBuYXYoKTogRGVmYXVsdFRoZW1lLk5hdkl0ZW1bXSB7XG4gIHJldHVybiBbXG4gICAge1xuICAgICAgYWN0aXZlTWF0Y2g6ICdeL2VuLyhndWlkZXxjb21wb25lbnRzKS8nLFxuICAgICAgdGV4dDogJ0RvYycsXG4gICAgICBpdGVtczogW1xuICAgICAgICB7XG4gICAgICAgICAgYWN0aXZlTWF0Y2g6ICdeL2VuL2d1aWRlLycsXG4gICAgICAgICAgbGluazogJy9lbi9ndWlkZS9pbnRyb2R1Y3Rpb24vdmJlbicsXG4gICAgICAgICAgdGV4dDogJ0d1aWRlJyxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGFjdGl2ZU1hdGNoOiAnXi9lbi9jb21wb25lbnRzLycsXG4gICAgICAgICAgbGluazogJy9lbi9jb21wb25lbnRzL2ludHJvZHVjdGlvbicsXG4gICAgICAgICAgdGV4dDogJ0NvbXBvbmVudHMnLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgdGV4dDogJ0hpc3RvcmljYWwgVmVyc2lvbnMnLFxuICAgICAgICAgIGl0ZW1zOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGxpbms6ICdodHRwczovL2RvYy52dmJpbi5jbicsXG4gICAgICAgICAgICAgIHRleHQ6ICcyLnggVmVyc2lvbiBEb2N1bWVudGF0aW9uJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSxcbiAgICB7XG4gICAgICB0ZXh0OiAnRGVtbycsXG4gICAgICBpdGVtczogW1xuICAgICAgICB7XG4gICAgICAgICAgdGV4dDogJ1ZiZW4gQWRtaW4nLFxuICAgICAgICAgIGl0ZW1zOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGxpbms6ICdodHRwczovL3d3dy52YmVuLnBybycsXG4gICAgICAgICAgICAgIHRleHQ6ICdEZW1vIFZlcnNpb24nLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgbGluazogJ2h0dHBzOi8vYW50LnZiZW4ucHJvJyxcbiAgICAgICAgICAgICAgdGV4dDogJ0FudCBEZXNpZ24gVnVlIFZlcnNpb24nLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgbGluazogJ2h0dHBzOi8vbmFpdmUudmJlbi5wcm8nLFxuICAgICAgICAgICAgICB0ZXh0OiAnTmFpdmUgVmVyc2lvbicsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBsaW5rOiAnaHR0cHM6Ly9lbGUudmJlbi5wcm8nLFxuICAgICAgICAgICAgICB0ZXh0OiAnRWxlbWVudCBQbHVzIFZlcnNpb24nLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgdGV4dDogJ090aGVycycsXG4gICAgICAgICAgaXRlbXM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgbGluazogJ2h0dHBzOi8vdmJlbi52dmJpbi5jbicsXG4gICAgICAgICAgICAgIHRleHQ6ICdWYmVuIEFkbWluIDIueCcsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH0sXG4gICAge1xuICAgICAgdGV4dDogdmVyc2lvbixcbiAgICAgIGl0ZW1zOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBsaW5rOiAnaHR0cHM6Ly9naXRodWIuY29tL3ZiZW5qcy92dWUtdmJlbi1hZG1pbi9yZWxlYXNlcycsXG4gICAgICAgICAgdGV4dDogJ0NoYW5nZWxvZycsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBsaW5rOiAnaHR0cHM6Ly9naXRodWIuY29tL29yZ3MvdmJlbmpzL3Byb2plY3RzLzUnLFxuICAgICAgICAgIHRleHQ6ICdSb2FkbWFwJyxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGxpbms6ICdodHRwczovL2dpdGh1Yi5jb20vdmJlbmpzL3Z1ZS12YmVuLWFkbWluL2Jsb2IvbWFpbi8uZ2l0aHViL2NvbnRyaWJ1dGluZy5tZCcsXG4gICAgICAgICAgdGV4dDogJ0NvbnRyaWJ1dGlvbicsXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH0sXG4gICAge1xuICAgICAgbGluazogJy9jb21tZXJjaWFsL3RlY2huaWNhbC1zdXBwb3J0JyxcbiAgICAgIHRleHQ6ICdcdUQ4M0VcdUREODQgVGVjaCBTdXBwb3J0JyxcbiAgICB9LFxuICAgIHtcbiAgICAgIGxpbms6ICcvc3BvbnNvci9wZXJzb25hbCcsXG4gICAgICB0ZXh0OiAnXHUyNzI4IFNwb25zb3InLFxuICAgIH0sXG4gICAge1xuICAgICAgbGluazogJy9jb21tZXJjaWFsL2NvbW11bml0eScsXG4gICAgICB0ZXh0OiAnXHVEODNEXHVEQzY4XHUyMDBEXHVEODNEXHVEQzY2XHUyMDBEXHVEODNEXHVEQzY2IENvbW11bml0eScsXG4gICAgfSxcbiAgICAvLyB7XG4gICAgLy8gICBsaW5rOiAnL2ZyaWVuZC1saW5rcy8nLFxuICAgIC8vICAgdGV4dDogJ1x1RDgzRVx1REQxRCBGcmllbmQgTGlua3MnLFxuICAgIC8vIH0sXG4gIF07XG59XG4iLCAie1xuICBcIm5hbWVcIjogXCJ2YmVuLWFkbWluLW1vbm9yZXBvXCIsXG4gIFwidmVyc2lvblwiOiBcIjUuNy4wXCIsXG4gIFwicHJpdmF0ZVwiOiB0cnVlLFxuICBcImtleXdvcmRzXCI6IFtcbiAgICBcIm1vbm9yZXBvXCIsXG4gICAgXCJ0dXJib1wiLFxuICAgIFwidmJlblwiLFxuICAgIFwidmJlbiBhZG1pblwiLFxuICAgIFwidmJlbiBwcm9cIixcbiAgICBcInZ1ZVwiLFxuICAgIFwidnVlIGFkbWluXCIsXG4gICAgXCJ2dWUgdmJlbiBhZG1pblwiLFxuICAgIFwidnVlIHZiZW4gYWRtaW4gcHJvXCIsXG4gICAgXCJ2dWUzXCJcbiAgXSxcbiAgXCJob21lcGFnZVwiOiBcImh0dHBzOi8vZ2l0aHViLmNvbS92YmVuanMvdnVlLXZiZW4tYWRtaW5cIixcbiAgXCJidWdzXCI6IFwiaHR0cHM6Ly9naXRodWIuY29tL3ZiZW5qcy92dWUtdmJlbi1hZG1pbi9pc3N1ZXNcIixcbiAgXCJyZXBvc2l0b3J5XCI6IFwidmJlbmpzL3Z1ZS12YmVuLWFkbWluLmdpdFwiLFxuICBcImxpY2Vuc2VcIjogXCJNSVRcIixcbiAgXCJhdXRob3JcIjoge1xuICAgIFwibmFtZVwiOiBcInZiZW5cIixcbiAgICBcImVtYWlsXCI6IFwiYW5uLnZiZW5AZ21haWwuY29tXCIsXG4gICAgXCJ1cmxcIjogXCJodHRwczovL2dpdGh1Yi5jb20vYW5uY3diXCJcbiAgfSxcbiAgXCJ0eXBlXCI6IFwibW9kdWxlXCIsXG4gIFwic2NyaXB0c1wiOiB7XG4gICAgXCJib290c3RyYXBcIjogXCJwbnBtIGluc3RhbGxcIixcbiAgICBcImJ1aWxkXCI6IFwiY3Jvc3MtZW52IE5PREVfT1BUSU9OUz0tLW1heC1vbGQtc3BhY2Utc2l6ZT04MTkyIHR1cmJvIGJ1aWxkXCIsXG4gICAgXCJidWlsZDphbmFseXplXCI6IFwidHVyYm8gYnVpbGQ6YW5hbHl6ZVwiLFxuICAgIFwiYnVpbGQ6YW50ZFwiOiBcInBucG0gcnVuIGJ1aWxkIC0tZmlsdGVyPUB2YmVuL3dlYi1hbnRkXCIsXG4gICAgXCJidWlsZDpkb2NrZXJcIjogXCIuL3NjcmlwdHMvZGVwbG95L2J1aWxkLWxvY2FsLWRvY2tlci1pbWFnZS5zaFwiLFxuICAgIFwiYnVpbGQ6ZG9jc1wiOiBcInBucG0gcnVuIGJ1aWxkIC0tZmlsdGVyPUB2YmVuL2RvY3NcIixcbiAgICBcImJ1aWxkOmVsZVwiOiBcInBucG0gcnVuIGJ1aWxkIC0tZmlsdGVyPUB2YmVuL3dlYi1lbGVcIixcbiAgICBcImJ1aWxkOm5haXZlXCI6IFwicG5wbSBydW4gYnVpbGQgLS1maWx0ZXI9QHZiZW4vd2ViLW5haXZlXCIsXG4gICAgXCJidWlsZDp0ZGVzaWduXCI6IFwicG5wbSBydW4gYnVpbGQgLS1maWx0ZXI9QHZiZW4vd2ViLXRkZXNpZ25cIixcbiAgICBcImJ1aWxkOnBsYXlcIjogXCJwbnBtIHJ1biBidWlsZCAtLWZpbHRlcj1AdmJlbi9wbGF5Z3JvdW5kXCIsXG4gICAgXCJjaGFuZ2VzZXRcIjogXCJwbnBtIGV4ZWMgY2hhbmdlc2V0XCIsXG4gICAgXCJjaGVja1wiOiBcInBucG0gcnVuIGNoZWNrOmNpcmN1bGFyICYmIHBucG0gcnVuIGNoZWNrOmRlcCAmJiBwbnBtIHJ1biBjaGVjazp0eXBlICYmIHBucG0gY2hlY2s6Y3NwZWxsXCIsXG4gICAgXCJjaGVjazpjaXJjdWxhclwiOiBcInZzaCBjaGVjay1jaXJjdWxhclwiLFxuICAgIFwiY2hlY2s6Y3NwZWxsXCI6IFwiY3NwZWxsIGxpbnQgXFxcIioqLyoudHNcXFwiIFxcXCIqKi9SRUFETUUubWRcXFwiIFxcXCIuY2hhbmdlc2V0LyoubWRcXFwiIC0tbm8tcHJvZ3Jlc3NcIixcbiAgICBcImNoZWNrOmRlcFwiOiBcInZzaCBjaGVjay1kZXBcIixcbiAgICBcImNoZWNrOnR5cGVcIjogXCJ0dXJibyBydW4gdHlwZWNoZWNrXCIsXG4gICAgXCJjbGVhblwiOiBcIm5vZGUgLi9zY3JpcHRzL2NsZWFuLm1qc1wiLFxuICAgIFwiY29tbWl0XCI6IFwiY3pnXCIsXG4gICAgXCJkZXZcIjogXCJ0dXJiby1ydW4gZGV2XCIsXG4gICAgXCJkZXY6YW50ZFwiOiBcInBucG0gLUYgQHZiZW4vd2ViLWFudGQgcnVuIGRldlwiLFxuICAgIFwiZGV2OmFudGR2LW5leHRcIjogXCJwbnBtIC1GIEB2YmVuL3dlYi1hbnRkdi1uZXh0IHJ1biBkZXZcIixcbiAgICBcImRldjpkb2NzXCI6IFwicG5wbSAtRiBAdmJlbi9kb2NzIHJ1biBkZXZcIixcbiAgICBcImRldjplbGVcIjogXCJwbnBtIC1GIEB2YmVuL3dlYi1lbGUgcnVuIGRldlwiLFxuICAgIFwiZGV2Om5haXZlXCI6IFwicG5wbSAtRiBAdmJlbi93ZWItbmFpdmUgcnVuIGRldlwiLFxuICAgIFwiZGV2OnRkZXNpZ25cIjogXCJwbnBtIC1GIEB2YmVuL3dlYi10ZGVzaWduIHJ1biBkZXZcIixcbiAgICBcImRldjpwbGF5XCI6IFwicG5wbSAtRiBAdmJlbi9wbGF5Z3JvdW5kIHJ1biBkZXZcIixcbiAgICBcImZvcm1hdFwiOiBcInZzaCBsaW50IC0tZm9ybWF0XCIsXG4gICAgXCJsaW50XCI6IFwidnNoIGxpbnRcIixcbiAgICBcInBvc3RpbnN0YWxsXCI6IFwicG5wbSAtciBydW4gc3R1YiAtLWlmLXByZXNlbnRcIixcbiAgICBcInByZWluc3RhbGxcIjogXCJucHggb25seS1hbGxvdyBwbnBtXCIsXG4gICAgXCJwcmVwYXJlXCI6IFwiaXMtY2kgfHwgZWNobyAnJyBcIixcbiAgICBcInByZXZpZXdcIjogXCJ0dXJiby1ydW4gcHJldmlld1wiLFxuICAgIFwicHVibGludFwiOiBcInZzaCBwdWJsaW50XCIsXG4gICAgXCJyZWluc3RhbGxcIjogXCJwbnBtIGNsZWFuIC0tZGVsLWxvY2sgJiYgcG5wbSBpbnN0YWxsXCIsXG4gICAgXCJ0ZXN0OnVuaXRcIjogXCJ2aXRlc3QgcnVuIC0tZG9tXCIsXG4gICAgXCJ0ZXN0OmUyZVwiOiBcInR1cmJvIHJ1biB0ZXN0OmUyZVwiLFxuICAgIFwidXBkYXRlOmRlcHNcIjogXCJucHggdGF6ZSAtciAtd1wiLFxuICAgIFwidmVyc2lvblwiOiBcInBucG0gZXhlYyBjaGFuZ2VzZXQgdmVyc2lvbiAmJiBwbnBtIGluc3RhbGwgLS1uby1mcm96ZW4tbG9ja2ZpbGVcIixcbiAgICBcImNhdGFsb2dcIjogXCJwbnB4IGNvZGVtb2QgcG5wbS9jYXRhbG9nXCJcbiAgfSxcbiAgXCJkZXZEZXBlbmRlbmNpZXNcIjoge1xuICAgIFwiQGNoYW5nZXNldHMvY2hhbmdlbG9nLWdpdGh1YlwiOiBcImNhdGFsb2c6XCIsXG4gICAgXCJAY2hhbmdlc2V0cy9jbGlcIjogXCJjYXRhbG9nOlwiLFxuICAgIFwiQHRzZG93bi9jc3NcIjogXCJjYXRhbG9nOlwiLFxuICAgIFwiQHR5cGVzL25vZGVcIjogXCJjYXRhbG9nOlwiLFxuICAgIFwiQHZiZW4vY29tbWl0bGludC1jb25maWdcIjogXCJ3b3Jrc3BhY2U6KlwiLFxuICAgIFwiQHZiZW4vZXNsaW50LWNvbmZpZ1wiOiBcIndvcmtzcGFjZToqXCIsXG4gICAgXCJAdmJlbi9veGZtdC1jb25maWdcIjogXCJ3b3Jrc3BhY2U6KlwiLFxuICAgIFwiQHZiZW4vb3hsaW50LWNvbmZpZ1wiOiBcIndvcmtzcGFjZToqXCIsXG4gICAgXCJAdmJlbi9zdHlsZWxpbnQtY29uZmlnXCI6IFwid29ya3NwYWNlOipcIixcbiAgICBcIkB2YmVuL3RhaWx3aW5kLWNvbmZpZ1wiOiBcIndvcmtzcGFjZToqXCIsXG4gICAgXCJAdmJlbi90c2NvbmZpZ1wiOiBcIndvcmtzcGFjZToqXCIsXG4gICAgXCJAdmJlbi90dXJiby1ydW5cIjogXCJ3b3Jrc3BhY2U6KlwiLFxuICAgIFwiQHZiZW4vdml0ZS1jb25maWdcIjogXCJ3b3Jrc3BhY2U6KlwiLFxuICAgIFwiQHZiZW4vdnNoXCI6IFwid29ya3NwYWNlOipcIixcbiAgICBcIkB2aXRlanMvcGx1Z2luLXZ1ZVwiOiBcImNhdGFsb2c6XCIsXG4gICAgXCJAdml0ZWpzL3BsdWdpbi12dWUtanN4XCI6IFwiY2F0YWxvZzpcIixcbiAgICBcImNyb3NzLWVudlwiOiBcImNhdGFsb2c6XCIsXG4gICAgXCJjc3BlbGxcIjogXCJjYXRhbG9nOlwiLFxuICAgIFwiaGFwcHktZG9tXCI6IFwiY2F0YWxvZzpcIixcbiAgICBcImlzLWNpXCI6IFwiY2F0YWxvZzpcIixcbiAgICBcImxlZnRob29rXCI6IFwiY2F0YWxvZzpcIixcbiAgICBcIm94Zm10XCI6IFwiY2F0YWxvZzpcIixcbiAgICBcIm94bGludFwiOiBcImNhdGFsb2c6XCIsXG4gICAgXCJveGxpbnQtdHNnb2xpbnRcIjogXCJjYXRhbG9nOlwiLFxuICAgIFwicGxheXdyaWdodFwiOiBcImNhdGFsb2c6XCIsXG4gICAgXCJyaW1yYWZcIjogXCJjYXRhbG9nOlwiLFxuICAgIFwidGFpbHdpbmRjc3NcIjogXCJjYXRhbG9nOlwiLFxuICAgIFwidHNkb3duXCI6IFwiY2F0YWxvZzpcIixcbiAgICBcInR1cmJvXCI6IFwiY2F0YWxvZzpcIixcbiAgICBcInR5cGVzY3JpcHRcIjogXCJjYXRhbG9nOlwiLFxuICAgIFwidml0ZVwiOiBcImNhdGFsb2c6XCIsXG4gICAgXCJ2aXRlc3RcIjogXCJjYXRhbG9nOlwiLFxuICAgIFwidnVlXCI6IFwiY2F0YWxvZzpcIixcbiAgICBcInZ1ZS10c2NcIjogXCJjYXRhbG9nOlwiXG4gIH0sXG4gIFwiZW5naW5lc1wiOiB7XG4gICAgXCJub2RlXCI6IFwiXjIwLjE5LjAgfHwgXjIyLjE4LjAgfHwgXjI0LjAuMFwiLFxuICAgIFwicG5wbVwiOiBcIj49MTAuMC4wXCJcbiAgfSxcbiAgXCJwYWNrYWdlTWFuYWdlclwiOiBcInBucG1AMTAuMzMuMFwiLFxuICBcImRlcGVuZGVuY2llc1wiOiB7XG4gICAgXCJAcm9sbGRvd24vYmluZGluZy1kYXJ3aW4tYXJtNjRcIjogXCIxLjAuMC1yYy4xN1wiXG4gIH1cbn1cbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL1VzZXJzL2xpeWFuaHVpL3ZzY29kZVByb2plY3RzL3Z1ZS12YmVuLWFkbWluMi9kb2NzLy52aXRlcHJlc3MvY29uZmlnXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvbGl5YW5odWkvdnNjb2RlUHJvamVjdHMvdnVlLXZiZW4tYWRtaW4yL2RvY3MvLnZpdGVwcmVzcy9jb25maWcvc2hhcmVkLm10c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvbGl5YW5odWkvdnNjb2RlUHJvamVjdHMvdnVlLXZiZW4tYWRtaW4yL2RvY3MvLnZpdGVwcmVzcy9jb25maWcvc2hhcmVkLm10c1wiO2ltcG9ydCB0eXBlIHsgUHdhT3B0aW9ucyB9IGZyb20gJ0B2aXRlLXB3YS92aXRlcHJlc3MnO1xuaW1wb3J0IHR5cGUgeyBIZWFkQ29uZmlnIH0gZnJvbSAndml0ZXByZXNzJztcblxuaW1wb3J0IHsgcmVzb2x2ZSB9IGZyb20gJ25vZGU6cGF0aCc7XG5cbmltcG9ydCB7XG4gIHZpdGVBcmNoaXZlclBsdWdpbixcbiAgdml0ZVZ4ZVRhYmxlSW1wb3J0c1BsdWdpbixcbn0gZnJvbSAnQHZiZW4vdml0ZS1jb25maWcnO1xuXG5pbXBvcnQge1xuICBHaXRDaGFuZ2Vsb2csXG4gIEdpdENoYW5nZWxvZ01hcmtkb3duU2VjdGlvbixcbn0gZnJvbSAnQG5vbGViYXNlL3ZpdGVwcmVzcy1wbHVnaW4tZ2l0LWNoYW5nZWxvZy92aXRlJztcbmltcG9ydCB0YWlsd2luZGNzcyBmcm9tICdAdGFpbHdpbmRjc3Mvdml0ZSc7XG5pbXBvcnQgeyBkZWZpbmVDb25maWcsIHBvc3Rjc3NJc29sYXRlU3R5bGVzIH0gZnJvbSAndml0ZXByZXNzJztcbmltcG9ydCB7XG4gIGdyb3VwSWNvbk1kUGx1Z2luLFxuICBncm91cEljb25WaXRlUGx1Z2luLFxufSBmcm9tICd2aXRlcHJlc3MtcGx1Z2luLWdyb3VwLWljb25zJztcblxuaW1wb3J0IHsgZGVtb1ByZXZpZXdQbHVnaW4gfSBmcm9tICcuL3BsdWdpbnMvZGVtby1wcmV2aWV3JztcbmltcG9ydCB7IHNlYXJjaCBhcyB6aFNlYXJjaCB9IGZyb20gJy4vemgubXRzJztcblxuZXhwb3J0IGNvbnN0IHNoYXJlZCA9IGRlZmluZUNvbmZpZyh7XG4gIGFwcGVhcmFuY2U6ICdkYXJrJyxcbiAgaGVhZDogaGVhZCgpLFxuICBtYXJrZG93bjoge1xuICAgIHByZUNvbmZpZyhtZCkge1xuICAgICAgbWQudXNlKGRlbW9QcmV2aWV3UGx1Z2luKTtcbiAgICAgIG1kLnVzZShncm91cEljb25NZFBsdWdpbik7XG4gICAgfSxcbiAgfSxcbiAgcHdhOiBwd2EoKSxcbiAgc3JjRGlyOiAnc3JjJyxcbiAgdGhlbWVDb25maWc6IHtcbiAgICBpMThuUm91dGluZzogdHJ1ZSxcbiAgICBsb2dvOiAnaHR0cHM6Ly91bnBrZy5jb20vQHZiZW5qcy9zdGF0aWMtc291cmNlQDAuMS43L3NvdXJjZS9sb2dvLXYxLndlYnAnLFxuICAgIHNlYXJjaDoge1xuICAgICAgb3B0aW9uczoge1xuICAgICAgICBsb2NhbGVzOiB7XG4gICAgICAgICAgLi4uemhTZWFyY2gsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgcHJvdmlkZXI6ICdsb2NhbCcsXG4gICAgfSxcbiAgICBzaXRlVGl0bGU6ICdWYmVuIEFkbWluJyxcbiAgICBzb2NpYWxMaW5rczogW1xuICAgICAgeyBpY29uOiAnZ2l0aHViJywgbGluazogJ2h0dHBzOi8vZ2l0aHViLmNvbS92YmVuanMvdnVlLXZiZW4tYWRtaW4nIH0sXG4gICAgXSxcbiAgfSxcbiAgdGl0bGU6ICdWYmVuIEFkbWluJyxcbiAgdml0ZToge1xuICAgIGJ1aWxkOiB7XG4gICAgICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IEluZmluaXR5LFxuICAgICAgbWluaWZ5OiAndGVyc2VyJyxcbiAgICB9LFxuICAgIGNzczoge1xuICAgICAgcG9zdGNzczoge1xuICAgICAgICBwbHVnaW5zOiBbcG9zdGNzc0lzb2xhdGVTdHlsZXMoeyBpbmNsdWRlRmlsZXM6IFsvdnAtZG9jXFwuY3NzL10gfSldLFxuICAgICAgfSxcbiAgICAgIHByZXByb2Nlc3Nvck9wdGlvbnM6IHtcbiAgICAgICAgc2Nzczoge1xuICAgICAgICAgIGFwaTogJ21vZGVybicsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0sXG4gICAganNvbjoge1xuICAgICAgc3RyaW5naWZ5OiB0cnVlLFxuICAgIH0sXG4gICAgcGx1Z2luczogW1xuICAgICAgdGFpbHdpbmRjc3MoKSxcbiAgICAgIEdpdENoYW5nZWxvZyh7XG4gICAgICAgIG1hcEF1dGhvcnM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBtYXBCeU5hbWVBbGlhc2VzOiBbJ1ZiZW4nXSxcbiAgICAgICAgICAgIG5hbWU6ICd2YmVuJyxcbiAgICAgICAgICAgIHVzZXJuYW1lOiAnYW5uY3diJyxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIG5hbWU6ICd2aW5jZScsXG4gICAgICAgICAgICB1c2VybmFtZTogJ3ZpbmNlMjkyMDA3JyxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIG5hbWU6ICdMaSBLdWknLFxuICAgICAgICAgICAgdXNlcm5hbWU6ICdsaWt1aTYyOCcsXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgICAgcmVwb1VSTDogKCkgPT4gJ2h0dHBzOi8vZ2l0aHViLmNvbS92YmVuanMvdnVlLXZiZW4tYWRtaW4nLFxuICAgICAgfSksXG4gICAgICBHaXRDaGFuZ2Vsb2dNYXJrZG93blNlY3Rpb24oKSxcbiAgICAgIHZpdGVBcmNoaXZlclBsdWdpbih7IG91dHB1dERpcjogJy52aXRlcHJlc3MnIH0pLFxuICAgICAgZ3JvdXBJY29uVml0ZVBsdWdpbigpLFxuICAgICAgYXdhaXQgdml0ZVZ4ZVRhYmxlSW1wb3J0c1BsdWdpbigpLFxuICAgIF0sXG4gICAgc2VydmVyOiB7XG4gICAgICBmczoge1xuICAgICAgICBhbGxvdzogWycuLi8uLiddLFxuICAgICAgfSxcbiAgICAgIGhvc3Q6IHRydWUsXG4gICAgICBwb3J0OiA2MTczLFxuICAgIH0sXG5cbiAgICBzc3I6IHtcbiAgICAgIGV4dGVybmFsOiBbJ0B2dWUvcmVwbCddLFxuICAgIH0sXG4gIH0sXG59KTtcblxuZnVuY3Rpb24gaGVhZCgpOiBIZWFkQ29uZmlnW10ge1xuICByZXR1cm4gW1xuICAgIFsnbWV0YScsIHsgY29udGVudDogJ1ZiZW5qcyBUZWFtJywgbmFtZTogJ2F1dGhvcicgfV0sXG4gICAgW1xuICAgICAgJ21ldGEnLFxuICAgICAge1xuICAgICAgICBjb250ZW50OiAndmJlbiwgdml0ZWpzLCB2aXRlLCBzaGFjZG4tdWksIHZ1ZScsXG4gICAgICAgIG5hbWU6ICdrZXl3b3JkcycsXG4gICAgICB9LFxuICAgIF0sXG4gICAgWydsaW5rJywgeyBocmVmOiAnL2Zhdmljb24uaWNvJywgcmVsOiAnaWNvbicsIHR5cGU6ICdpbWFnZS9zdmcreG1sJyB9XSxcbiAgICBbXG4gICAgICAnbWV0YScsXG4gICAgICB7XG4gICAgICAgIGNvbnRlbnQ6XG4gICAgICAgICAgJ3dpZHRoPWRldmljZS13aWR0aCxpbml0aWFsLXNjYWxlPTEsbWluaW11bS1zY2FsZT0xLjAsbWF4aW11bS1zY2FsZT0xLjAsdXNlci1zY2FsYWJsZT1ubycsXG4gICAgICAgIG5hbWU6ICd2aWV3cG9ydCcsXG4gICAgICB9LFxuICAgIF0sXG4gICAgWydtZXRhJywgeyBjb250ZW50OiAndmJlbiBhZG1pbiBkb2NzJywgbmFtZTogJ2tleXdvcmRzJyB9XSxcbiAgICBbJ2xpbmsnLCB7IGhyZWY6ICcvZmF2aWNvbi5pY28nLCByZWw6ICdpY29uJyB9XSxcbiAgICAvLyBbXG4gICAgLy8gICAnc2NyaXB0JyxcbiAgICAvLyAgIHtcbiAgICAvLyAgICAgc3JjOiAnaHR0cHM6Ly9jZG4udGFpbHdpbmRjc3MuY29tJyxcbiAgICAvLyAgIH0sXG4gICAgLy8gXSxcbiAgXTtcbn1cblxuZnVuY3Rpb24gcHdhKCk6IFB3YU9wdGlvbnMge1xuICByZXR1cm4ge1xuICAgIGluY2x1ZGVNYW5pZmVzdEljb25zOiBmYWxzZSxcbiAgICBtYW5pZmVzdDoge1xuICAgICAgZGVzY3JpcHRpb246XG4gICAgICAgICdWYmVuIEFkbWluIGlzIGEgbW9kZXJuIGFkbWluIGRhc2hib2FyZCB0ZW1wbGF0ZSBiYXNlZCBvbiBWdWUgMy4gJyxcbiAgICAgIGljb25zOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBzaXplczogJzE5MngxOTInLFxuICAgICAgICAgIHNyYzogJ2h0dHBzOi8vdW5wa2cuY29tL0B2YmVuanMvc3RhdGljLXNvdXJjZUAwLjEuNy9zb3VyY2UvcHdhLWljb24tMTkyLnBuZycsXG4gICAgICAgICAgdHlwZTogJ2ltYWdlL3BuZycsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBzaXplczogJzUxMng1MTInLFxuICAgICAgICAgIHNyYzogJ2h0dHBzOi8vdW5wa2cuY29tL0B2YmVuanMvc3RhdGljLXNvdXJjZUAwLjEuNy9zb3VyY2UvcHdhLWljb24tNTEyLnBuZycsXG4gICAgICAgICAgdHlwZTogJ2ltYWdlL3BuZycsXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgICAgaWQ6ICcvJyxcbiAgICAgIG5hbWU6ICdWYmVuIEFkbWluIERvYycsXG4gICAgICBzaG9ydF9uYW1lOiAndmJlbl9hZG1pbl9kb2MnLFxuICAgICAgdGhlbWVfY29sb3I6ICcjZmZmZmZmJyxcbiAgICB9LFxuICAgIG91dERpcjogcmVzb2x2ZShwcm9jZXNzLmN3ZCgpLCAnLnZpdGVwcmVzcy9kaXN0JyksXG4gICAgcmVnaXN0ZXJUeXBlOiAnYXV0b1VwZGF0ZScsXG4gICAgd29ya2JveDoge1xuICAgICAgZ2xvYlBhdHRlcm5zOiBbJyoqLyoue2NzcyxqcyxodG1sLHN2ZyxwbmcsaWNvLHR4dCx3b2ZmMn0nXSxcbiAgICAgIG1heGltdW1GaWxlU2l6ZVRvQ2FjaGVJbkJ5dGVzOiA1ICogMTAyNCAqIDEwMjQsXG4gICAgfSxcbiAgfTtcbn1cbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL1VzZXJzL2xpeWFuaHVpL3ZzY29kZVByb2plY3RzL3Z1ZS12YmVuLWFkbWluMi9kb2NzLy52aXRlcHJlc3MvY29uZmlnL3BsdWdpbnNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9saXlhbmh1aS92c2NvZGVQcm9qZWN0cy92dWUtdmJlbi1hZG1pbjIvZG9jcy8udml0ZXByZXNzL2NvbmZpZy9wbHVnaW5zL2RlbW8tcHJldmlldy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvbGl5YW5odWkvdnNjb2RlUHJvamVjdHMvdnVlLXZiZW4tYWRtaW4yL2RvY3MvLnZpdGVwcmVzcy9jb25maWcvcGx1Z2lucy9kZW1vLXByZXZpZXcudHNcIjtpbXBvcnQgdHlwZSB7IE1hcmtkb3duRW52LCBNYXJrZG93blJlbmRlcmVyIH0gZnJvbSAndml0ZXByZXNzJztcblxuaW1wb3J0IGNyeXB0byBmcm9tICdub2RlOmNyeXB0byc7XG5pbXBvcnQgeyByZWFkZGlyU3luYyB9IGZyb20gJ25vZGU6ZnMnO1xuaW1wb3J0IHsgam9pbiB9IGZyb20gJ25vZGU6cGF0aCc7XG5cbmV4cG9ydCBjb25zdCByYXdQYXRoUmVnZXhwID1cbiAgL14oLis/KD86XFwuKFtcXGRhLXpdKykpPykoI1tcXHctXSspPyg/OiA/eyhcXGQrKD86WywtXVxcZCspKik/ID8oXFxTKyk/fSk/ID8oPzpcXFsoLispXSk/JC87XG5cbmZ1bmN0aW9uIHJhd1BhdGhUb1Rva2VuKHJhd1BhdGg6IHN0cmluZykge1xuICBjb25zdCBbXG4gICAgZmlsZXBhdGggPSAnJyxcbiAgICBleHRlbnNpb24gPSAnJyxcbiAgICByZWdpb24gPSAnJyxcbiAgICBsaW5lcyA9ICcnLFxuICAgIGxhbmcgPSAnJyxcbiAgICByYXdUaXRsZSA9ICcnLFxuICBdID0gKHJhd1BhdGhSZWdleHAuZXhlYyhyYXdQYXRoKSB8fCBbXSkuc2xpY2UoMSk7XG5cbiAgY29uc3QgdGl0bGUgPSByYXdUaXRsZSB8fCBmaWxlcGF0aC5zcGxpdCgnLycpLnBvcCgpIHx8ICcnO1xuXG4gIHJldHVybiB7IGV4dGVuc2lvbiwgZmlsZXBhdGgsIGxhbmcsIGxpbmVzLCByZWdpb24sIHRpdGxlIH07XG59XG5cbmV4cG9ydCBjb25zdCBkZW1vUHJldmlld1BsdWdpbiA9IChtZDogTWFya2Rvd25SZW5kZXJlcikgPT4ge1xuICBtZC5jb3JlLnJ1bGVyLmFmdGVyKCdpbmxpbmUnLCAnZGVtby1wcmV2aWV3JywgKHN0YXRlKSA9PiB7XG4gICAgY29uc3QgaW5zZXJ0Q29tcG9uZW50SW1wb3J0ID0gKGltcG9ydFN0cmluZzogc3RyaW5nKSA9PiB7XG4gICAgICBjb25zdCBpbmRleCA9IHN0YXRlLnRva2Vucy5maW5kSW5kZXgoXG4gICAgICAgIChpKSA9PiBpLnR5cGUgPT09ICdodG1sX2Jsb2NrJyAmJiBpLmNvbnRlbnQubWF0Y2goLzxzY3JpcHQgc2V0dXA+L2cpLFxuICAgICAgKTtcbiAgICAgIGlmIChpbmRleCA9PT0gLTEpIHtcbiAgICAgICAgY29uc3QgaW1wb3J0Q29tcG9uZW50ID0gbmV3IHN0YXRlLlRva2VuKCdodG1sX2Jsb2NrJywgJycsIDApO1xuICAgICAgICBpbXBvcnRDb21wb25lbnQuY29udGVudCA9IGA8c2NyaXB0IHNldHVwPlxcbiR7aW1wb3J0U3RyaW5nfVxcbjwvc2NyaXB0PlxcbmA7XG4gICAgICAgIHN0YXRlLnRva2Vucy5zcGxpY2UoMCwgMCwgaW1wb3J0Q29tcG9uZW50KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChzdGF0ZS50b2tlbnNbaW5kZXhdKSB7XG4gICAgICAgICAgY29uc3QgY29udGVudCA9IHN0YXRlLnRva2Vuc1tpbmRleF0uY29udGVudDtcbiAgICAgICAgICBzdGF0ZS50b2tlbnNbaW5kZXhdLmNvbnRlbnQgPSBjb250ZW50LnJlcGxhY2UoXG4gICAgICAgICAgICAnPC9zY3JpcHQ+JyxcbiAgICAgICAgICAgIGAke2ltcG9ydFN0cmluZ31cXG48L3NjcmlwdD5gLFxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuICAgIC8vIERlZmluZSB0aGUgcmVndWxhciBleHByZXNzaW9uIHRvIG1hdGNoIHRoZSBkZXNpcmVkIHBhdHRlcm5cbiAgICBjb25zdCByZWdleCA9IC88RGVtb1ByZXZpZXdbXj5dKlxcc2Rpcj1cIihbXlwiXSopXCIvZztcbiAgICAvLyBJdGVyYXRlIHRocm91Z2ggdGhlIE1hcmtkb3duIGNvbnRlbnQgYW5kIHJlcGxhY2UgdGhlIHBhdHRlcm5cbiAgICBzdGF0ZS5zcmMgPSBzdGF0ZS5zcmMucmVwbGFjZUFsbChyZWdleCwgKF9tYXRjaCwgZGlyKSA9PiB7XG4gICAgICBjb25zdCBjb21wb25lbnREaXIgPSBqb2luKHByb2Nlc3MuY3dkKCksICdzcmMnLCBkaXIpLnJlcGxhY2VBbGwoXG4gICAgICAgICdcXFxcJyxcbiAgICAgICAgJy8nLFxuICAgICAgKTtcblxuICAgICAgbGV0IGNoaWxkRmlsZXM6IHN0cmluZ1tdID0gW107XG4gICAgICBsZXQgZGlyRXhpc3RzID0gdHJ1ZTtcblxuICAgICAgdHJ5IHtcbiAgICAgICAgY2hpbGRGaWxlcyA9XG4gICAgICAgICAgcmVhZGRpclN5bmMoY29tcG9uZW50RGlyLCB7XG4gICAgICAgICAgICBlbmNvZGluZzogJ3V0ZjgnLFxuICAgICAgICAgICAgcmVjdXJzaXZlOiBmYWxzZSxcbiAgICAgICAgICAgIHdpdGhGaWxlVHlwZXM6IGZhbHNlLFxuICAgICAgICAgIH0pIHx8IFtdO1xuICAgICAgfSBjYXRjaCB7XG4gICAgICAgIGRpckV4aXN0cyA9IGZhbHNlO1xuICAgICAgfVxuXG4gICAgICBpZiAoIWRpckV4aXN0cykge1xuICAgICAgICByZXR1cm4gJyc7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHVuaXF1ZVdvcmQgPSBnZW5lcmF0ZUNvbnRlbnRIYXNoKGNvbXBvbmVudERpcik7XG5cbiAgICAgIGNvbnN0IENvbXBvbmVudE5hbWUgPSBgRGVtb0NvbXBvbmVudF8ke3VuaXF1ZVdvcmR9YDtcbiAgICAgIGluc2VydENvbXBvbmVudEltcG9ydChcbiAgICAgICAgYGltcG9ydCAke0NvbXBvbmVudE5hbWV9IGZyb20gJyR7Y29tcG9uZW50RGlyfS9pbmRleC52dWUnYCxcbiAgICAgICk7XG4gICAgICBjb25zdCB7IHBhdGg6IF9wYXRoIH0gPSBzdGF0ZS5lbnYgYXMgTWFya2Rvd25FbnY7XG5cbiAgICAgIGNvbnN0IGluZGV4ID0gc3RhdGUudG9rZW5zLmZpbmRJbmRleCgoaSkgPT4gaS5jb250ZW50Lm1hdGNoKHJlZ2V4KSk7XG5cbiAgICAgIGlmICghc3RhdGUudG9rZW5zW2luZGV4XSkge1xuICAgICAgICByZXR1cm4gJyc7XG4gICAgICB9XG4gICAgICBjb25zdCBmaXJzdFN0cmluZyA9ICdpbmRleC52dWUnO1xuICAgICAgY2hpbGRGaWxlcyA9IGNoaWxkRmlsZXMudG9Tb3J0ZWQoKGEsIGIpID0+IHtcbiAgICAgICAgaWYgKGEgPT09IGZpcnN0U3RyaW5nKSByZXR1cm4gLTE7XG4gICAgICAgIGlmIChiID09PSBmaXJzdFN0cmluZykgcmV0dXJuIDE7XG4gICAgICAgIHJldHVybiBhLmxvY2FsZUNvbXBhcmUoYiwgJ2VuJywgeyBzZW5zaXRpdml0eTogJ2Jhc2UnIH0pO1xuICAgICAgfSk7XG4gICAgICBzdGF0ZS50b2tlbnNbaW5kZXhdLmNvbnRlbnQgPVxuICAgICAgICBgPERlbW9QcmV2aWV3IGZpbGVzPVwiJHtlbmNvZGVVUklDb21wb25lbnQoSlNPTi5zdHJpbmdpZnkoY2hpbGRGaWxlcykpfVwiID48JHtDb21wb25lbnROYW1lfS8+XG4gICAgICAgIGA7XG5cbiAgICAgIGNvbnN0IF9kdW1teVRva2VuID0gbmV3IHN0YXRlLlRva2VuKCcnLCAnJywgMCk7XG4gICAgICBjb25zdCB0b2tlbkFycmF5OiBBcnJheTx0eXBlb2YgX2R1bW15VG9rZW4+ID0gW107XG4gICAgICBjaGlsZEZpbGVzLmZvckVhY2goKGZpbGVuYW1lKSA9PiB7XG4gICAgICAgIC8vIGNvbnN0IHNsb3ROYW1lID0gZmlsZW5hbWUucmVwbGFjZShleHRuYW1lKGZpbGVuYW1lKSwgJycpO1xuXG4gICAgICAgIGNvbnN0IHRlbXBsYXRlU3RhcnQgPSBuZXcgc3RhdGUuVG9rZW4oJ2h0bWxfaW5saW5lJywgJycsIDApO1xuICAgICAgICB0ZW1wbGF0ZVN0YXJ0LmNvbnRlbnQgPSBgPHRlbXBsYXRlICMke2ZpbGVuYW1lfT5gO1xuICAgICAgICB0b2tlbkFycmF5LnB1c2godGVtcGxhdGVTdGFydCk7XG5cbiAgICAgICAgY29uc3QgcmVzb2x2ZWRQYXRoID0gam9pbihjb21wb25lbnREaXIsIGZpbGVuYW1lKTtcblxuICAgICAgICBjb25zdCB7IGV4dGVuc2lvbiwgZmlsZXBhdGgsIGxhbmcsIGxpbmVzLCB0aXRsZSB9ID1cbiAgICAgICAgICByYXdQYXRoVG9Ub2tlbihyZXNvbHZlZFBhdGgpO1xuICAgICAgICAvLyBBZGQgY29kZSB0b2tlbnMgZm9yIGVhY2ggbGluZVxuICAgICAgICBjb25zdCB0b2tlbiA9IG5ldyBzdGF0ZS5Ub2tlbignZmVuY2UnLCAnY29kZScsIDApO1xuICAgICAgICB0b2tlbi5pbmZvID0gYCR7bGFuZyB8fCBleHRlbnNpb259JHtsaW5lcyA/IGB7JHtsaW5lc319YCA6ICcnfSR7XG4gICAgICAgICAgdGl0bGUgPyBgWyR7dGl0bGV9XWAgOiAnJ1xuICAgICAgICB9YDtcblxuICAgICAgICB0b2tlbi5jb250ZW50ID0gYDw8PCAke2ZpbGVwYXRofWA7XG4gICAgICAgICh0b2tlbiBhcyBhbnkpLnNyYyA9IFtyZXNvbHZlZFBhdGhdO1xuICAgICAgICB0b2tlbkFycmF5LnB1c2godG9rZW4pO1xuXG4gICAgICAgIGNvbnN0IHRlbXBsYXRlRW5kID0gbmV3IHN0YXRlLlRva2VuKCdodG1sX2lubGluZScsICcnLCAwKTtcbiAgICAgICAgdGVtcGxhdGVFbmQuY29udGVudCA9ICc8L3RlbXBsYXRlPic7XG4gICAgICAgIHRva2VuQXJyYXkucHVzaCh0ZW1wbGF0ZUVuZCk7XG4gICAgICB9KTtcbiAgICAgIGNvbnN0IGVuZFRhZyA9IG5ldyBzdGF0ZS5Ub2tlbignaHRtbF9pbmxpbmUnLCAnJywgMCk7XG4gICAgICBlbmRUYWcuY29udGVudCA9ICc8L0RlbW9QcmV2aWV3Pic7XG4gICAgICB0b2tlbkFycmF5LnB1c2goZW5kVGFnKTtcblxuICAgICAgc3RhdGUudG9rZW5zLnNwbGljZShpbmRleCArIDEsIDAsIC4uLnRva2VuQXJyYXkpO1xuXG4gICAgICAvLyBjb25zb2xlLmxvZyhcbiAgICAgIC8vICAgc3RhdGUubWQucmVuZGVyZXIucmVuZGVyKHN0YXRlLnRva2Vucywgc3RhdGU/Lm9wdGlvbnMgPz8gW10sIHN0YXRlLmVudiksXG4gICAgICAvLyApO1xuICAgICAgcmV0dXJuICcnO1xuICAgIH0pO1xuICB9KTtcbn07XG5cbmZ1bmN0aW9uIGdlbmVyYXRlQ29udGVudEhhc2goaW5wdXQ6IHN0cmluZywgbGVuZ3RoOiBudW1iZXIgPSAxMCk6IHN0cmluZyB7XG4gIC8vIFx1NEY3Rlx1NzUyOCBTSEEtMjU2IFx1NzUxRlx1NjIxMFx1NTRDOFx1NUUwQ1x1NTAzQ1xuICBjb25zdCBoYXNoID0gY3J5cHRvLmNyZWF0ZUhhc2goJ3NoYTI1NicpLnVwZGF0ZShpbnB1dCkuZGlnZXN0KCdoZXgnKTtcblxuICAvLyBcdTVDMDZcdTU0QzhcdTVFMENcdTUwM0NcdThGNkNcdTYzNjJcdTRFM0EgQmFzZTM2IFx1N0YxNlx1NzgwMVx1RkYwQ1x1NUU3Nlx1NTNENlx1NjMwN1x1NUI5QVx1OTU3Rlx1NUVBNlx1NzY4NFx1NUI1N1x1N0IyNlx1NEY1Q1x1NEUzQVx1N0VEM1x1Njc5Q1xuICByZXR1cm4gTnVtYmVyLnBhcnNlSW50KGhhc2gsIDE2KS50b1N0cmluZygzNikuc2xpY2UoMCwgbGVuZ3RoKTtcbn1cbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL1VzZXJzL2xpeWFuaHVpL3ZzY29kZVByb2plY3RzL3Z1ZS12YmVuLWFkbWluMi9kb2NzLy52aXRlcHJlc3MvY29uZmlnXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvbGl5YW5odWkvdnNjb2RlUHJvamVjdHMvdnVlLXZiZW4tYWRtaW4yL2RvY3MvLnZpdGVwcmVzcy9jb25maWcvemgubXRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy9saXlhbmh1aS92c2NvZGVQcm9qZWN0cy92dWUtdmJlbi1hZG1pbjIvZG9jcy8udml0ZXByZXNzL2NvbmZpZy96aC5tdHNcIjtpbXBvcnQgdHlwZSB7IERlZmF1bHRUaGVtZSB9IGZyb20gJ3ZpdGVwcmVzcyc7XG5cbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGVwcmVzcyc7XG5cbmltcG9ydCB7IHZlcnNpb24gfSBmcm9tICcuLi8uLi8uLi9wYWNrYWdlLmpzb24nO1xuXG5leHBvcnQgY29uc3QgemggPSBkZWZpbmVDb25maWcoe1xuICBkZXNjcmlwdGlvbjogJ1ZiZW4gQWRtaW4gJiBcdTRGMDFcdTRFMUFcdTdFQTdcdTdCQTFcdTc0MDZcdTdDRkJcdTdFREZcdTY4NDZcdTY3QjYnLFxuICBsYW5nOiAnemgtSGFucycsXG4gIHRoZW1lQ29uZmlnOiB7XG4gICAgZGFya01vZGVTd2l0Y2hMYWJlbDogJ1x1NEUzQlx1OTg5OCcsXG4gICAgZGFya01vZGVTd2l0Y2hUaXRsZTogJ1x1NTIwN1x1NjM2Mlx1NTIzMFx1NkRGMVx1ODI3Mlx1NkEyMVx1NUYwRicsXG4gICAgZG9jRm9vdGVyOiB7XG4gICAgICBuZXh0OiAnXHU0RTBCXHU0RTAwXHU5ODc1JyxcbiAgICAgIHByZXY6ICdcdTRFMEFcdTRFMDBcdTk4NzUnLFxuICAgIH0sXG4gICAgZWRpdExpbms6IHtcbiAgICAgIHBhdHRlcm46XG4gICAgICAgICdodHRwczovL2dpdGh1Yi5jb20vdmJlbmpzL3Z1ZS12YmVuLWFkbWluL2VkaXQvbWFpbi9kb2NzL3NyYy86cGF0aCcsXG4gICAgICB0ZXh0OiAnXHU1NzI4IEdpdEh1YiBcdTRFMEFcdTdGMTZcdThGOTFcdTZCNjRcdTk4NzVcdTk3NjInLFxuICAgIH0sXG4gICAgZm9vdGVyOiB7XG4gICAgICBjb3B5cmlnaHQ6IGBDb3B5cmlnaHQgXHUwMEE5IDIwMjAtJHtuZXcgRGF0ZSgpLmdldEZ1bGxZZWFyKCl9IFZiZW5gLFxuICAgICAgbWVzc2FnZTogJ1x1NTdGQVx1NEU4RSBNSVQgXHU4QkI4XHU1M0VGXHU1M0QxXHU1RTAzLicsXG4gICAgfSxcbiAgICBsYW5nTWVudUxhYmVsOiAnXHU1OTFBXHU4QkVEXHU4QTAwJyxcbiAgICBsYXN0VXBkYXRlZDoge1xuICAgICAgZm9ybWF0T3B0aW9uczoge1xuICAgICAgICBkYXRlU3R5bGU6ICdzaG9ydCcsXG4gICAgICAgIHRpbWVTdHlsZTogJ21lZGl1bScsXG4gICAgICB9LFxuICAgICAgdGV4dDogJ1x1NjcwMFx1NTQwRVx1NjZGNFx1NjVCMFx1NEU4RScsXG4gICAgfSxcbiAgICBsaWdodE1vZGVTd2l0Y2hUaXRsZTogJ1x1NTIwN1x1NjM2Mlx1NTIzMFx1NkQ0NVx1ODI3Mlx1NkEyMVx1NUYwRicsXG4gICAgbmF2OiBuYXYoKSxcblxuICAgIG91dGxpbmU6IHtcbiAgICAgIGxhYmVsOiAnXHU5ODc1XHU5NzYyXHU1QkZDXHU4MjJBJyxcbiAgICB9LFxuICAgIHJldHVyblRvVG9wTGFiZWw6ICdcdTU2REVcdTUyMzBcdTk4NzZcdTkwRTgnLFxuXG4gICAgc2lkZWJhcjoge1xuICAgICAgJy9jb21tZXJjaWFsLyc6IHsgYmFzZTogJy9jb21tZXJjaWFsLycsIGl0ZW1zOiBzaWRlYmFyQ29tbWVyY2lhbCgpIH0sXG4gICAgICAnL2NvbXBvbmVudHMvJzogeyBiYXNlOiAnL2NvbXBvbmVudHMvJywgaXRlbXM6IHNpZGViYXJDb21wb25lbnRzKCkgfSxcbiAgICAgICcvZ3VpZGUvJzogeyBiYXNlOiAnL2d1aWRlLycsIGl0ZW1zOiBzaWRlYmFyR3VpZGUoKSB9LFxuICAgIH0sXG4gICAgc2lkZWJhck1lbnVMYWJlbDogJ1x1ODNEQ1x1NTM1NScsXG4gIH0sXG59KTtcblxuZnVuY3Rpb24gc2lkZWJhckd1aWRlKCk6IERlZmF1bHRUaGVtZS5TaWRlYmFySXRlbVtdIHtcbiAgcmV0dXJuIFtcbiAgICB7XG4gICAgICBjb2xsYXBzZWQ6IGZhbHNlLFxuICAgICAgdGV4dDogJ1x1N0I4MFx1NEVDQicsXG4gICAgICBpdGVtczogW1xuICAgICAgICB7XG4gICAgICAgICAgbGluazogJ2ludHJvZHVjdGlvbi92YmVuJyxcbiAgICAgICAgICB0ZXh0OiAnXHU1MTczXHU0RThFIFZiZW4gQWRtaW4nLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgbGluazogJ2ludHJvZHVjdGlvbi93aHknLFxuICAgICAgICAgIHRleHQ6ICdcdTRFM0FcdTRFQzBcdTRFNDhcdTkwMDlcdTYyRTlcdTYyMTFcdTRFRUM/JyxcbiAgICAgICAgfSxcbiAgICAgICAgeyBsaW5rOiAnaW50cm9kdWN0aW9uL3F1aWNrLXN0YXJ0JywgdGV4dDogJ1x1NUZFQlx1OTAxRlx1NUYwMFx1NTlDQicgfSxcbiAgICAgICAgeyBsaW5rOiAnaW50cm9kdWN0aW9uL3RoaW4nLCB0ZXh0OiAnXHU3Q0JFXHU3QjgwXHU3MjQ4XHU2NzJDJyB9LFxuICAgICAgICB7XG4gICAgICAgICAgYmFzZTogJy8nLFxuICAgICAgICAgIGxpbms6ICdjb21wb25lbnRzL2ludHJvZHVjdGlvbicsXG4gICAgICAgICAgdGV4dDogJ1x1N0VDNFx1NEVGNlx1NjU4N1x1Njg2MycsXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH0sXG4gICAge1xuICAgICAgdGV4dDogJ1x1NTdGQVx1Nzg0MCcsXG4gICAgICBpdGVtczogW1xuICAgICAgICB7IGxpbms6ICdlc3NlbnRpYWxzL2NvbmNlcHQnLCB0ZXh0OiAnXHU1N0ZBXHU3ODQwXHU2OTgyXHU1RkY1JyB9LFxuICAgICAgICB7IGxpbms6ICdlc3NlbnRpYWxzL2RldmVsb3BtZW50JywgdGV4dDogJ1x1NjcyQ1x1NTczMFx1NUYwMFx1NTNEMScgfSxcbiAgICAgICAgeyBsaW5rOiAnZXNzZW50aWFscy9yb3V0ZScsIHRleHQ6ICdcdThERUZcdTc1MzFcdTU0OENcdTgzRENcdTUzNTUnIH0sXG4gICAgICAgIHsgbGluazogJ2Vzc2VudGlhbHMvc2V0dGluZ3MnLCB0ZXh0OiAnXHU5MTREXHU3RjZFJyB9LFxuICAgICAgICB7IGxpbms6ICdlc3NlbnRpYWxzL2ljb25zJywgdGV4dDogJ1x1NTZGRVx1NjgwNycgfSxcbiAgICAgICAgeyBsaW5rOiAnZXNzZW50aWFscy9zdHlsZXMnLCB0ZXh0OiAnXHU2ODM3XHU1RjBGJyB9LFxuICAgICAgICB7IGxpbms6ICdlc3NlbnRpYWxzL2V4dGVybmFsLW1vZHVsZScsIHRleHQ6ICdcdTU5MTZcdTkwRThcdTZBMjFcdTU3NTcnIH0sXG4gICAgICAgIHsgbGluazogJ2Vzc2VudGlhbHMvYnVpbGQnLCB0ZXh0OiAnXHU2Nzg0XHU1RUZBXHU0RTBFXHU5MEU4XHU3RjcyJyB9LFxuICAgICAgICB7IGxpbms6ICdlc3NlbnRpYWxzL3NlcnZlcicsIHRleHQ6ICdcdTY3MERcdTUyQTFcdTdBRUZcdTRFQTRcdTRFOTJcdTRFMEVcdTY1NzBcdTYzNkVNb2NrJyB9LFxuICAgICAgXSxcbiAgICB9LFxuICAgIHtcbiAgICAgIHRleHQ6ICdcdTZERjFcdTUxNjUnLFxuICAgICAgaXRlbXM6IFtcbiAgICAgICAgeyBsaW5rOiAnaW4tZGVwdGgvbG9naW4nLCB0ZXh0OiAnXHU3NjdCXHU1RjU1JyB9LFxuICAgICAgICAvLyB7IGxpbms6ICdpbi1kZXB0aC9sYXlvdXQnLCB0ZXh0OiAnXHU1RTAzXHU1QzQwJyB9LFxuICAgICAgICB7IGxpbms6ICdpbi1kZXB0aC90aGVtZScsIHRleHQ6ICdcdTRFM0JcdTk4OTgnIH0sXG4gICAgICAgIHsgbGluazogJ2luLWRlcHRoL2FjY2VzcycsIHRleHQ6ICdcdTY3NDNcdTk2NTAnIH0sXG4gICAgICAgIHsgbGluazogJ2luLWRlcHRoL2xvY2FsZScsIHRleHQ6ICdcdTU2RkRcdTk2NDVcdTUzMTYnIH0sXG4gICAgICAgIHsgbGluazogJ2luLWRlcHRoL2ZlYXR1cmVzJywgdGV4dDogJ1x1NUUzOFx1NzUyOFx1NTI5Rlx1ODBGRCcgfSxcbiAgICAgICAgeyBsaW5rOiAnaW4tZGVwdGgvY2hlY2stdXBkYXRlcycsIHRleHQ6ICdcdTY4QzBcdTY3RTVcdTY2RjRcdTY1QjAnIH0sXG4gICAgICAgIHsgbGluazogJ2luLWRlcHRoL2xvYWRpbmcnLCB0ZXh0OiAnXHU1MTY4XHU1QzQwbG9hZGluZycgfSxcbiAgICAgICAgeyBsaW5rOiAnaW4tZGVwdGgvdWktZnJhbWV3b3JrJywgdGV4dDogJ1x1N0VDNFx1NEVGNlx1NUU5M1x1NTIwN1x1NjM2MicgfSxcbiAgICAgIF0sXG4gICAgfSxcbiAgICB7XG4gICAgICB0ZXh0OiAnXHU1REU1XHU3QTBCJyxcbiAgICAgIGl0ZW1zOiBbXG4gICAgICAgIHsgbGluazogJ3Byb2plY3Qvc3RhbmRhcmQnLCB0ZXh0OiAnXHU4OUM0XHU4MzAzJyB9LFxuICAgICAgICB7IGxpbms6ICdwcm9qZWN0L2NsaScsIHRleHQ6ICdDTEknIH0sXG4gICAgICAgIHsgbGluazogJ3Byb2plY3QvZGlyJywgdGV4dDogJ1x1NzZFRVx1NUY1NVx1OEJGNFx1NjYwRScgfSxcbiAgICAgICAgeyBsaW5rOiAncHJvamVjdC90ZXN0JywgdGV4dDogJ1x1NTM1NVx1NTE0M1x1NkQ0Qlx1OEJENScgfSxcbiAgICAgICAgeyBsaW5rOiAncHJvamVjdC90YWlsd2luZGNzcycsIHRleHQ6ICdUYWlsd2luZCBDU1MnIH0sXG4gICAgICAgIHsgbGluazogJ3Byb2plY3QvY2hhbmdlc2V0JywgdGV4dDogJ0NoYW5nZXNldCcgfSxcbiAgICAgICAgeyBsaW5rOiAncHJvamVjdC92aXRlJywgdGV4dDogJ1ZpdGUgQ29uZmlnJyB9LFxuICAgICAgXSxcbiAgICB9LFxuICAgIHtcbiAgICAgIHRleHQ6ICdcdTUxNzZcdTRFRDYnLFxuICAgICAgaXRlbXM6IFtcbiAgICAgICAgeyBsaW5rOiAnb3RoZXIvcHJvamVjdC11cGRhdGUnLCB0ZXh0OiAnXHU5ODc5XHU3NkVFXHU2NkY0XHU2NUIwJyB9LFxuICAgICAgICB7IGxpbms6ICdvdGhlci9yZW1vdmUtY29kZScsIHRleHQ6ICdcdTc5RkJcdTk2NjRcdTRFRTNcdTc4MDEnIH0sXG4gICAgICAgIHsgbGluazogJ290aGVyL2ZhcScsIHRleHQ6ICdcdTVFMzhcdTg5QzFcdTk1RUVcdTk4OTgnIH0sXG4gICAgICBdLFxuICAgIH0sXG4gIF07XG59XG5cbmZ1bmN0aW9uIHNpZGViYXJDb21tZXJjaWFsKCk6IERlZmF1bHRUaGVtZS5TaWRlYmFySXRlbVtdIHtcbiAgcmV0dXJuIFtcbiAgICB7XG4gICAgICBsaW5rOiAnY29tbXVuaXR5JyxcbiAgICAgIHRleHQ6ICdcdTRFQTRcdTZENDFcdTdGQTQnLFxuICAgIH0sXG4gICAge1xuICAgICAgbGluazogJ3RlY2huaWNhbC1zdXBwb3J0JyxcbiAgICAgIHRleHQ6ICdcdTYyODBcdTY3MkZcdTY1MkZcdTYzMDEnLFxuICAgIH0sXG4gICAge1xuICAgICAgbGluazogJ2N1c3RvbWl6ZWQnLFxuICAgICAgdGV4dDogJ1x1NUI5QVx1NTIzNlx1NUYwMFx1NTNEMScsXG4gICAgfSxcbiAgXTtcbn1cblxuZnVuY3Rpb24gc2lkZWJhckNvbXBvbmVudHMoKTogRGVmYXVsdFRoZW1lLlNpZGViYXJJdGVtW10ge1xuICByZXR1cm4gW1xuICAgIHtcbiAgICAgIHRleHQ6ICdcdTdFQzRcdTRFRjYnLFxuICAgICAgaXRlbXM6IFtcbiAgICAgICAge1xuICAgICAgICAgIGxpbms6ICdpbnRyb2R1Y3Rpb24nLFxuICAgICAgICAgIHRleHQ6ICdcdTRFQ0JcdTdFQ0QnLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9LFxuICAgIHtcbiAgICAgIGNvbGxhcHNlZDogZmFsc2UsXG4gICAgICB0ZXh0OiAnXHU1RTAzXHU1QzQwXHU3RUM0XHU0RUY2JyxcbiAgICAgIGl0ZW1zOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBsaW5rOiAnbGF5b3V0LXVpL3BhZ2UnLFxuICAgICAgICAgIHRleHQ6ICdQYWdlIFx1OTg3NVx1OTc2MicsXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH0sXG4gICAge1xuICAgICAgY29sbGFwc2VkOiBmYWxzZSxcbiAgICAgIHRleHQ6ICdcdTkwMUFcdTc1MjhcdTdFQzRcdTRFRjYnLFxuICAgICAgaXRlbXM6IFtcbiAgICAgICAge1xuICAgICAgICAgIGxpbms6ICdjb21tb24tdWkvdmJlbi1hcGktY29tcG9uZW50JyxcbiAgICAgICAgICB0ZXh0OiAnQXBpQ29tcG9uZW50IEFwaVx1N0VDNFx1NEVGNlx1NTMwNVx1ODhDNVx1NTY2OCcsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBsaW5rOiAnY29tbW9uLXVpL3ZiZW4tYWxlcnQnLFxuICAgICAgICAgIHRleHQ6ICdBbGVydCBcdThGN0JcdTkxQ0ZcdTYzRDBcdTc5M0FcdTY4NDYnLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgbGluazogJ2NvbW1vbi11aS92YmVuLW1vZGFsJyxcbiAgICAgICAgICB0ZXh0OiAnTW9kYWwgXHU2QTIxXHU2MDAxXHU2ODQ2JyxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGxpbms6ICdjb21tb24tdWkvdmJlbi1kcmF3ZXInLFxuICAgICAgICAgIHRleHQ6ICdEcmF3ZXIgXHU2MkJEXHU1QzQ5JyxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGxpbms6ICdjb21tb24tdWkvdmJlbi1mb3JtJyxcbiAgICAgICAgICB0ZXh0OiAnRm9ybSBcdTg4NjhcdTUzNTUnLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgbGluazogJ2NvbW1vbi11aS92YmVuLXZ4ZS10YWJsZScsXG4gICAgICAgICAgdGV4dDogJ1Z4ZSBUYWJsZSBcdTg4NjhcdTY4M0MnLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgbGluazogJ2NvbW1vbi11aS92YmVuLWNvdW50LXRvLWFuaW1hdG9yJyxcbiAgICAgICAgICB0ZXh0OiAnQ291bnRUb0FuaW1hdG9yIFx1NjU3MFx1NUI1N1x1NTJBOFx1NzUzQicsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBsaW5rOiAnY29tbW9uLXVpL3ZiZW4tZWxsaXBzaXMtdGV4dCcsXG4gICAgICAgICAgdGV4dDogJ0VsbGlwc2lzVGV4dCBcdTc3MDFcdTc1NjVcdTY1ODdcdTY3MkMnLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgbGluazogJ2NvbW1vbi11aS92YmVuLWNyb3BwZXInLFxuICAgICAgICAgIHRleHQ6ICdDcm9wcGVyIFx1NTZGRVx1NzI0N1x1ODhDMVx1NTI2QScsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBsaW5rOiAnY29tbW9uLXVpL3ZiZW4tdGlwdGFwJyxcbiAgICAgICAgICB0ZXh0OiAnVGlwdGFwIFx1NUJDQ1x1NjU4N1x1NjcyQ1x1N0YxNlx1OEY5MVx1NTY2OCcsXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH0sXG4gIF07XG59XG5cbmZ1bmN0aW9uIG5hdigpOiBEZWZhdWx0VGhlbWUuTmF2SXRlbVtdIHtcbiAgcmV0dXJuIFtcbiAgICB7XG4gICAgICBhY3RpdmVNYXRjaDogJ14vKGd1aWRlfGNvbXBvbmVudHMpLycsXG4gICAgICB0ZXh0OiAnXHU2NTg3XHU2ODYzJyxcbiAgICAgIGl0ZW1zOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBhY3RpdmVNYXRjaDogJ14vZ3VpZGUvJyxcbiAgICAgICAgICBsaW5rOiAnL2d1aWRlL2ludHJvZHVjdGlvbi92YmVuJyxcbiAgICAgICAgICB0ZXh0OiAnXHU2MzA3XHU1MzU3JyxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGFjdGl2ZU1hdGNoOiAnXi9jb21wb25lbnRzLycsXG4gICAgICAgICAgbGluazogJy9jb21wb25lbnRzL2ludHJvZHVjdGlvbicsXG4gICAgICAgICAgdGV4dDogJ1x1N0VDNFx1NEVGNicsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICB0ZXh0OiAnXHU1Mzg2XHU1M0YyXHU3MjQ4XHU2NzJDJyxcbiAgICAgICAgICBpdGVtczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBsaW5rOiAnaHR0cHM6Ly9kb2MudnZiaW4uY24nLFxuICAgICAgICAgICAgICB0ZXh0OiAnMi54XHU3MjQ4XHU2NzJDXHU2NTg3XHU2ODYzJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSxcbiAgICB7XG4gICAgICB0ZXh0OiAnXHU2RjE0XHU3OTNBJyxcbiAgICAgIGl0ZW1zOiBbXG4gICAgICAgIHtcbiAgICAgICAgICB0ZXh0OiAnVmJlbiBBZG1pbicsXG4gICAgICAgICAgaXRlbXM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgbGluazogJ2h0dHBzOi8vd3d3LnZiZW4ucHJvJyxcbiAgICAgICAgICAgICAgdGV4dDogJ1x1NkYxNFx1NzkzQVx1NzI0OFx1NjcyQycsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBsaW5rOiAnaHR0cHM6Ly9hbnQudmJlbi5wcm8nLFxuICAgICAgICAgICAgICB0ZXh0OiAnQW50IERlc2lnbiBWdWUgXHU3MjQ4XHU2NzJDJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGxpbms6ICdodHRwczovL25haXZlLnZiZW4ucHJvJyxcbiAgICAgICAgICAgICAgdGV4dDogJ05haXZlIFx1NzI0OFx1NjcyQycsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBsaW5rOiAnaHR0cHM6Ly9lbGUudmJlbi5wcm8nLFxuICAgICAgICAgICAgICB0ZXh0OiAnRWxlbWVudCBQbHVzXHU3MjQ4XHU2NzJDJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHRleHQ6ICdcdTUxNzZcdTRFRDYnLFxuICAgICAgICAgIGl0ZW1zOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGxpbms6ICdodHRwczovL3ZiZW4udnZiaW4uY24nLFxuICAgICAgICAgICAgICB0ZXh0OiAnVmJlbiBBZG1pbiAyLngnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9LFxuICAgIHtcbiAgICAgIHRleHQ6IHZlcnNpb24sXG4gICAgICBpdGVtczogW1xuICAgICAgICB7XG4gICAgICAgICAgbGluazogJ2h0dHBzOi8vZ2l0aHViLmNvbS92YmVuanMvdnVlLXZiZW4tYWRtaW4vcmVsZWFzZXMnLFxuICAgICAgICAgIHRleHQ6ICdcdTY2RjRcdTY1QjBcdTY1RTVcdTVGRDcnLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgbGluazogJ2h0dHBzOi8vZ2l0aHViLmNvbS9vcmdzL3ZiZW5qcy9wcm9qZWN0cy81JyxcbiAgICAgICAgICB0ZXh0OiAnXHU4REVGXHU3RUJGXHU1NkZFJyxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGxpbms6ICdodHRwczovL2dpdGh1Yi5jb20vdmJlbmpzL3Z1ZS12YmVuLWFkbWluL2Jsb2IvbWFpbi8uZ2l0aHViL2NvbnRyaWJ1dGluZy5tZCcsXG4gICAgICAgICAgdGV4dDogJ1x1OEQyMVx1NzMyRScsXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH0sXG4gICAge1xuICAgICAgbGluazogJy9jb21tZXJjaWFsL3RlY2huaWNhbC1zdXBwb3J0JyxcbiAgICAgIHRleHQ6ICdcdUQ4M0VcdUREODQgXHU2MjgwXHU2NzJGXHU2NTJGXHU2MzAxJyxcbiAgICB9LFxuICAgIHtcbiAgICAgIGxpbms6ICcvc3BvbnNvci9wZXJzb25hbCcsXG4gICAgICB0ZXh0OiAnXHUyNzI4IFx1OEQ1RVx1NTJBOScsXG4gICAgfSxcbiAgICB7XG4gICAgICBsaW5rOiAnL2NvbW1lcmNpYWwvY29tbXVuaXR5JyxcbiAgICAgIHRleHQ6ICdcdUQ4M0RcdURDNjhcdTIwMERcdUQ4M0RcdURDNjZcdTIwMERcdUQ4M0RcdURDNjYgXHU0RUE0XHU2RDQxXHU3RkE0JyxcbiAgICAgIC8vIGl0ZW1zOiBbXG4gICAgICAvLyAgIHtcbiAgICAgIC8vICAgICBsaW5rOiAnaHR0cHM6Ly9xdW4ucXEuY29tL3Fxd2ViL3F1bnByby9zaGFyZT9fd3Y9MyZfd3d2PTEyOCZhcHBDaGFubmVsPXNoYXJlJmludml0ZUNvZGU9MjJ5U3pqN3BLaXcmYnVzaW5lc3NUeXBlPTkmZnJvbT0yNDY2MTAmYml6PWthJm1haW5Tb3VyY2VJZD1zaGFyZSZzdWJTb3VyY2VJZD1vdGhlcnMmanVtcHNvdXJjZT1zaG9ydHVybCMvcGMnLFxuICAgICAgLy8gICAgIHRleHQ6ICdRUVx1OTg5MVx1OTA1MycsXG4gICAgICAvLyAgIH0sXG4gICAgICAvLyAgIHtcbiAgICAgIC8vICAgICBsaW5rOiAnaHR0cHM6Ly9xbS5xcS5jb20vY2dpLWJpbi9xbS9xcj9fd3Y9MTAyNyZrPW1qWm1saGdWenpVeHZkeGxsQjZDMXZIcFg4TzhRUkwwJmF1dGhLZXk9REJkRmJCd0VSbWZhS1k5NUp2UldxTENKSVJHSkFtS3laYnJwelo0MUVLRE1aNVNSNk1mYmpPQmFhTlJONzNmciZub3ZlcmlmeT0wJmdyb3VwX2NvZGU9NDI4NjEwOScsXG4gICAgICAvLyAgICAgdGV4dDogJ1FRXHU3RkE0JyxcbiAgICAgIC8vICAgfSxcbiAgICAgIC8vICAge1xuICAgICAgLy8gICAgIGxpbms6ICdodHRwczovL2Rpc2NvcmQuZ2cvVlU2MmpUZWNhZCcsXG4gICAgICAvLyAgICAgdGV4dDogJ0Rpc2NvcmQnLFxuICAgICAgLy8gICB9LFxuICAgICAgLy8gXSxcbiAgICB9LFxuICAgIC8vIHtcbiAgICAvLyAgIGxpbms6ICcvZnJpZW5kLWxpbmtzLycsXG4gICAgLy8gICB0ZXh0OiAnXHVEODNFXHVERDFEIFx1NTNDQlx1NjBDNVx1OTRGRVx1NjNBNScsXG4gICAgLy8gfSxcbiAgXTtcbn1cblxuZXhwb3J0IGNvbnN0IHNlYXJjaDogRGVmYXVsdFRoZW1lLkFsZ29saWFTZWFyY2hPcHRpb25zWydsb2NhbGVzJ10gPSB7XG4gIHJvb3Q6IHtcbiAgICBwbGFjZWhvbGRlcjogJ1x1NjQxQ1x1N0QyMlx1NjU4N1x1Njg2MycsXG4gICAgdHJhbnNsYXRpb25zOiB7XG4gICAgICBidXR0b246IHtcbiAgICAgICAgYnV0dG9uQXJpYUxhYmVsOiAnXHU2NDFDXHU3RDIyXHU2NTg3XHU2ODYzJyxcbiAgICAgICAgYnV0dG9uVGV4dDogJ1x1NjQxQ1x1N0QyMlx1NjU4N1x1Njg2MycsXG4gICAgICB9LFxuICAgICAgbW9kYWw6IHtcbiAgICAgICAgZXJyb3JTY3JlZW46IHtcbiAgICAgICAgICBoZWxwVGV4dDogJ1x1NEY2MFx1NTNFRlx1ODBGRFx1OTcwMFx1ODk4MVx1NjhDMFx1NjdFNVx1NEY2MFx1NzY4NFx1N0Y1MVx1N0VEQ1x1OEZERVx1NjNBNScsXG4gICAgICAgICAgdGl0bGVUZXh0OiAnXHU2NUUwXHU2Q0Q1XHU4M0I3XHU1M0Q2XHU3RUQzXHU2NzlDJyxcbiAgICAgICAgfSxcbiAgICAgICAgZm9vdGVyOiB7XG4gICAgICAgICAgY2xvc2VUZXh0OiAnXHU1MTczXHU5NUVEJyxcbiAgICAgICAgICBuYXZpZ2F0ZVRleHQ6ICdcdTUyMDdcdTYzNjInLFxuICAgICAgICAgIHNlYXJjaEJ5VGV4dDogJ1x1NjQxQ1x1N0QyMlx1NjNEMFx1NEY5Qlx1ODAwNScsXG4gICAgICAgICAgc2VsZWN0VGV4dDogJ1x1OTAwOVx1NjJFOScsXG4gICAgICAgIH0sXG4gICAgICAgIG5vUmVzdWx0c1NjcmVlbjoge1xuICAgICAgICAgIG5vUmVzdWx0c1RleHQ6ICdcdTY1RTBcdTZDRDVcdTYyN0VcdTUyMzBcdTc2RjhcdTUxNzNcdTdFRDNcdTY3OUMnLFxuICAgICAgICAgIHJlcG9ydE1pc3NpbmdSZXN1bHRzTGlua1RleHQ6ICdcdTcwQjlcdTUxRkJcdTUzQ0RcdTk5ODgnLFxuICAgICAgICAgIHJlcG9ydE1pc3NpbmdSZXN1bHRzVGV4dDogJ1x1NEY2MFx1OEJBNFx1NEUzQVx1OEJFNVx1NjdFNVx1OEJFMlx1NUU5NFx1OEJFNVx1NjcwOVx1N0VEM1x1Njc5Q1x1RkYxRicsXG4gICAgICAgICAgc3VnZ2VzdGVkUXVlcnlUZXh0OiAnXHU0RjYwXHU1M0VGXHU0RUU1XHU1QzFEXHU4QkQ1XHU2N0U1XHU4QkUyJyxcbiAgICAgICAgfSxcbiAgICAgICAgc2VhcmNoQm94OiB7XG4gICAgICAgICAgY2FuY2VsQnV0dG9uQXJpYUxhYmVsOiAnXHU1M0Q2XHU2RDg4JyxcbiAgICAgICAgICBjYW5jZWxCdXR0b25UZXh0OiAnXHU1M0Q2XHU2RDg4JyxcbiAgICAgICAgICByZXNldEJ1dHRvbkFyaWFMYWJlbDogJ1x1NkUwNVx1OTY2NFx1NjdFNVx1OEJFMlx1Njc2MVx1NEVGNicsXG4gICAgICAgICAgcmVzZXRCdXR0b25UaXRsZTogJ1x1NkUwNVx1OTY2NFx1NjdFNVx1OEJFMlx1Njc2MVx1NEVGNicsXG4gICAgICAgIH0sXG4gICAgICAgIHN0YXJ0U2NyZWVuOiB7XG4gICAgICAgICAgZmF2b3JpdGVTZWFyY2hlc1RpdGxlOiAnXHU2NTM2XHU4NUNGJyxcbiAgICAgICAgICBub1JlY2VudFNlYXJjaGVzVGV4dDogJ1x1NkNBMVx1NjcwOVx1NjQxQ1x1N0QyMlx1NTM4Nlx1NTNGMicsXG4gICAgICAgICAgcmVjZW50U2VhcmNoZXNUaXRsZTogJ1x1NjQxQ1x1N0QyMlx1NTM4Nlx1NTNGMicsXG4gICAgICAgICAgcmVtb3ZlRmF2b3JpdGVTZWFyY2hCdXR0b25UaXRsZTogJ1x1NEVDRVx1NjUzNlx1ODVDRlx1NEUyRFx1NzlGQlx1OTY2NCcsXG4gICAgICAgICAgcmVtb3ZlUmVjZW50U2VhcmNoQnV0dG9uVGl0bGU6ICdcdTRFQ0VcdTY0MUNcdTdEMjJcdTUzODZcdTUzRjJcdTRFMkRcdTc5RkJcdTk2NjQnLFxuICAgICAgICAgIHNhdmVSZWNlbnRTZWFyY2hCdXR0b25UaXRsZTogJ1x1NEZERFx1NUI1OFx1ODFGM1x1NjQxQ1x1N0QyMlx1NTM4Nlx1NTNGMicsXG4g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QUFhO0FBQUEsTUFDYixNQUFNO0FBQUEsTUFDTixPQUFPO0FBQUEsUUFDTDtBQUFBLFVBQ0UsYUFBYTtBQUFBLFVBQ2IsTUFBTTtBQUFBLFVBQ04sTUFBTTtBQUFBLFFBQ1I7QUFBQSxRQUNBO0FBQUEsVUFDRSxhQUFhO0FBQUEsVUFDYixNQUFNO0FBQUEsVUFDTixNQUFNO0FBQUEsUUFDUjtBQUFBLFFBQ0E7QUFBQSxVQUNFLE1BQU07QUFBQSxVQUNOLE9BQU87QUFBQSxZQUNMO0FBQUEsY0FDRSxNQUFNO0FBQUEsY0FDTixNQUFNO0FBQUEsWUFDUjtBQUFBLFVBQ0Y7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxJQUNBO0FBQUEsTUFDRSxNQUFNO0FBQUEsTUFDTixPQUFPO0FBQUEsUUFDTDtBQUFBLFVBQ0UsTUFBTTtBQUFBLFVBQ04sT0FBTztBQUFBLFlBQ0w7QUFBQSxjQUNFLE1BQU07QUFBQSxjQUNOLE1BQU07QUFBQSxZQUNSO0FBQUEsWUFDQTtBQUFBLGNBQ0UsTUFBTTtBQUFBLGNBQ04sTUFBTTtBQUFBLFlBQ1I7QUFBQSxZQUNBO0FBQUEsY0FDRSxNQUFNO0FBQUEsY0FDTixNQUFNO0FBQUEsWUFDUjtBQUFBLFlBQ0E7QUFBQSxjQUNFLE1BQU07QUFBQSxjQUNOLE1BQU07QUFBQSxZQUNSO0FBQUEsVUFDRjtBQUFBLFFBQ0Y7QUFBQSxRQUNBO0FBQUEsVUFDRSxNQUFNO0FBQUEsVUFDTixPQUFPO0FBQUEsWUFDTDtBQUFBLGNBQ0UsTUFBTTtBQUFBLGNBQ04sTUFBTTtBQUFBLFlBQ1I7QUFBQSxVQUNGO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsSUFDQTtBQUFBLE1BQ0UsTUFBTTtBQUFBLE1BQ04sT0FBTztBQUFBLFFBQ0w7QUFBQSxVQUNFLE1BQU07QUFBQSxVQUNOLE1BQU07QUFBQSxRQUNSO0FBQUEsUUFDQTtBQUFBLFVBQ0UsTUFBTTtBQUFBLFVBQ04sTUFBTTtBQUFBLFFBQ1I7QUFBQSxRQUNBO0FBQUEsVUFDRSxNQUFNO0FBQUEsVUFDTixN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TixNQUFNO0FBQUEsUUFDUjtBQUFBLFFBQ0E7QUFBQSxVQUNFLE1BQU07QUFBQSxVQUNOLE1BQU07QUFBQSxRQUNSO0FBQUEsUUFDQTtBQUFBLFVBQ0UsTUFBTTtBQUFBLFVBQ04sTUFBTTtBQUFBLFFBQ1I7QUFBQSxRQUNBO0FBQUEsVUFDRSxNQUFNO0FBQUEsVUFDTixNQUFNO0FBQUEsUUFDUjtBQUFBLFFBQ0E7QUFBQSxVQUNFLE1BQU07QUFBQSxVQUNOLE1BQU07QUFBQSxRQUNSO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0Y7QUFFQSxTQUFTRixPQUE4QjtBQUNyQyxTQUFPO0FBQUEsSUFDTDtBQUFBLE1BQ0UsYUFBYTtBQUFBLE1BQ2IsTUFBTTtBQUFBLE1BQ04sT0FBTztBQUFBLFFBQ0w7QUFBQSxVQUNFLGFBQWE7QUFBQSxVQUNiLE1BQU07QUFBQSxVQUNOLE1BQU07QUFBQSxRQUNSO0FBQUEsUUFDQTtBQUFBLFVBQ0UsYUFBYTtBQUFBLFVBQ2IsTUFBTTtBQUFBLFVBQ04sTUFBTTtBQUFBLFFBQ1I7QUFBQSxRQUNBO0FBQUEsVUFDRSxNQUFNO0FBQUEsVUFDTixPQUFPO0FBQUEsWUFDTDtBQUFBLGNBQ0UsTUFBTTtBQUFBLGNBQ04sTUFBTTtBQUFBLFlBQ1I7QUFBQSxVQUNGO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsSUFDQTtBQUFBLE1BQ0UsTUFBTTtBQUFBLE1BQ04sT0FBTztBQUFBLFFBQ0w7QUFBQSxVQUNFLE1BQU07QUFBQSxVQUNOLE9BQU87QUFBQSxZQUNMO0FBQUEsY0FDRSxNQUFNO0FBQUEsY0FDTixNQUFNO0FBQUEsWUFDUjtBQUFBLFlBQ0E7QUFBQSxjQUNFLE1BQU07QUFBQSxjQUNOLE1BQU07QUFBQSxZQUNSO0FBQUEsWUFDQTtBQUFBLGNBQ0UsTUFBTTtBQUFBLGNBQ04sTUFBTTtBQUFBLFlBQ1I7QUFBQSxZQUNBO0FBQUEsY0FDRSxNQUFNO0FBQUEsY0FDTixNQUFNO0FBQUEsWUFDUjtBQUFBLFVBQ0Y7QUFBQSxRQUNGO0FBQUEs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SUFDQSxDQUFDLFFBQVEsRUFBRSxNQUFNLGdCQUFnQixLQUFLLFFBQVEsTUFBTSxnQkFBZ0IsQ0FBQztBQUFBLElBQ3JFO0FBQUEsTUFDRTtBQUFBLE1BQ0E7QUFBQSxRQUNFLFNBQ0U7QUFBQSxRQUNGLE1BQU07QUFBQSxNQUNSO0FBQUEsSUFDRjtBQUFBLElBQ0EsQ0FBQyxRQUFRLEVBQUUsU0FBUyxtQkFBbUIsTUFBTSxXQUFXLENBQUM7QUFBQSxJQUN6RCxDQUFDLFFBQVEsRUFBRSxNQUFNLGdCQUFnQixLQUFLLE9BQU8sQ0FBQztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT2hEO0FBQ0Y7QUFFQSxTQUFTLE1BQWtCO0FBQ3pCLFNBQU87QUFBQSxJQUNMLHNCQUFzQjtBQUFBLElBQ3RCLFVBQVU7QUFBQSxNQUNSLGFBQ0U7QUFBQSxNQUNGLE9BQU87QUFBQSxRQUNMO0FBQUEsVUFDRSxPQUFPO0FBQUEsVUFDUCxLQUFLO0FBQUEsVUFDTCxNQUFNO0FBQUEsUUFDUjtBQUFBLFFBQ0E7QUFBQSxVQUNFLE9BQU87QUFBQSxVQUNQLEtBQUs7QUFBQSxVQUNMLE1BQU07QUFBQSxRQUNSO0FBQUEsTUFDRjtBQUFBLE1BQ0EsSUFBSTtBQUFBLE1BQ0osTUFBTTtBQUFBLE1BQ04sWUFBWTtBQUFBLE1BQ1osYUFBYTtBQUFBLElBQ2Y7QUFBQSxJQUNBLFFBQVEsUUFBUSxRQUFRLElBQUksR0FBRyxpQkFBaUI7QUFBQSxJQUNoRCxjQUFjO0FBQUEsSUFDZCxTQUFTO0FBQUEsTUFDUCxjQUFjLENBQUMsMENBQTBDO0FBQUEsTUFDekQsK0JBQStCLElBQUksT0FBTztBQUFBLElBQzVDO0FBQUEsRUFDRjtBQUNGOzs7QUhsS0EsSUFBTyxpQkFBUTtBQUFBLEVBQ2Isc0JBQXNCO0FBQUEsSUFDcEIsR0FBRztBQUFBLElBQ0gsU0FBUztBQUFBLE1BQ1AsSUFBSTtBQUFBLFFBQ0YsT0FBTztBQUFBLFFBQ1AsTUFBTTtBQUFBLFFBQ04sTUFBTTtBQUFBLFFBQ04sR0FBRztBQUFBLE1BQ0w7QUFBQSxNQUNBLE1BQU07QUFBQSxRQUNKLE9BQU87QUFBQSxRQUNQLE1BQU07QUFBQSxRQUNOLEdBQUc7QUFBQSxNQUNMO0FBQUEsSUFDRjtBQUFBLEVBQ0YsQ0FBQztBQUNIOyIsCiAgIm5hbWVzIjogWyJkZWZpbmVDb25maWciLCAiZGVmaW5lQ29uZmlnIiwgImRlZmluZUNvbmZpZyIsICJuYXYiLCAic2lkZWJhckNvbW1lcmNpYWwiLCAic2lkZWJhckNvbXBvbmVudHMiLCAic2lkZWJhckd1aWRlIiwgImRlZmluZUNvbmZpZyJdCn0K
