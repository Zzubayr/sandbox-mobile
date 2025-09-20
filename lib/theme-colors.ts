export const themeColors = {
  blue: {
    primary: "rgb(37 99 235)", // blue-600
    secondary: "rgb(59 130 246)", // blue-500
    accent: "rgb(147 197 253)", // blue-300
    light: "rgb(239 246 255)", // blue-50
    dark: "rgb(30 64 175)", // blue-700
    darker: "rgb(29 78 216)", // blue-800
    gradient: "from-blue-500 to-blue-700",
    hover: "hover:bg-blue-700",
    border: "border-blue-200",
    text: "text-blue-600",
    bg: "bg-blue-50",
  },
  green: {
    primary: "rgb(22 163 74)", // green-600
    secondary: "rgb(34 197 94)", // green-500
    accent: "rgb(134 239 172)", // green-300
    light: "rgb(240 253 244)", // green-50
    dark: "rgb(21 128 61)", // green-700
    darker: "rgb(20 83 45)", // green-800
    gradient: "from-green-500 to-green-700",
    hover: "hover:bg-green-700",
    border: "border-green-200",
    text: "text-green-600",
    bg: "bg-green-50",
  },
  purple: {
    primary: "rgb(147 51 234)", // purple-600
    secondary: "rgb(168 85 247)", // purple-500
    accent: "rgb(196 181 253)", // purple-300
    light: "rgb(250 245 255)", // purple-50
    dark: "rgb(126 34 206)", // purple-700
    darker: "rgb(109 40 217)", // purple-800
    gradient: "from-purple-500 to-purple-700",
    hover: "hover:bg-purple-700",
    border: "border-purple-200",
    text: "text-purple-600",
    bg: "bg-purple-50",
  },
}

export function getThemeColors(theme: "blue" | "green" | "purple") {
  return themeColors[theme] || themeColors.blue
}

export function getThemeCSSVariables(theme: "blue" | "green" | "purple") {
  const colors = getThemeColors(theme)
  return {
    '--theme-primary': colors.primary,
    '--theme-secondary': colors.secondary,
    '--theme-accent': colors.accent,
    '--theme-light': colors.light,
    '--theme-dark': colors.dark,
    '--theme-darker': colors.darker,
  }
}

export function applyThemeToDocument(theme: "blue" | "green" | "purple") {
  if (typeof document !== 'undefined') {
    const root = document.documentElement
    const variables = getThemeCSSVariables(theme)
    
    Object.entries(variables).forEach(([key, value]) => {
      root.style.setProperty(key, value)
    })
    
    // Add theme class to body for additional styling
    document.body.className = document.body.className.replace(/theme-\w+/g, '')
    document.body.classList.add(`theme-${theme}`)
  }
}
