export type Lang = 'es' | 'en';
export type ColorTheme = 'default' | 'colorblind';

export interface AppSettings {
  language: Lang;
  symbolColors: boolean;  // color-coded math operators
  colorTheme: ColorTheme;
}

const KEY = 'mathbrain_settings';

const DEFAULTS: AppSettings = {
  language: 'es',
  symbolColors: true,
  colorTheme: 'default',
};

export const loadSettings = (): AppSettings => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch { return DEFAULTS; }
};

export const saveSettings = (s: AppSettings): void => {
  localStorage.setItem(KEY, JSON.stringify(s));
};
