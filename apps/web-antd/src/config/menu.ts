export interface MenuItemConfig {
  visible: boolean;
  children?: Record<string, boolean>;
}

export type MenuConfig = Record<string, boolean | MenuItemConfig>;

const defaultConfig: MenuConfig = {
  Dashboard: {
    visible: true,
    children: {
      Analytics: true,
      Workspace: true,
    },
  },
  Cosmic: true,
};

async function fetchMenuConfig(): Promise<MenuConfig> {
  try {
    const res = await fetch('/setting.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as MenuConfig;
  } catch {
    console.warn('[menu config] Failed to fetch /setting.json, using defaults');
    return defaultConfig;
  }
}

export const menuConfig: MenuConfig = await fetchMenuConfig();
