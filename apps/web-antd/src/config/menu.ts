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

function parseEnvConfig(): MenuConfig | null {
  const raw = import.meta.env.VITE_MENU_CONFIG as string | undefined;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as MenuConfig;
  } catch {
    console.warn(
      '[menu config] Failed to parse VITE_MENU_CONFIG, using defaults',
    );
    return null;
  }
}

export const menuConfig: MenuConfig = parseEnvConfig() ?? defaultConfig;
