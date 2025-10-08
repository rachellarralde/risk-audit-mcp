const supportsColor = () => {
  if (process.env.NO_COLOR) return false;
  if (process.env.FORCE_COLOR) return true;
  return !!process.stdout.isTTY;
};

const enabled = supportsColor();

const wrap = (code: number, text: string) => (enabled ? `\u001b[${code}m${text}\u001b[0m` : text);

export const colors = {
  red: (s: string) => wrap(31, s),
  yellow: (s: string) => wrap(33, s),
  cyan: (s: string) => wrap(36, s),
  green: (s: string) => wrap(32, s),
  bold: (s: string) => wrap(1, s)
};
