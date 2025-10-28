export const themeColors = {
  blue: {
    primary: "rgb(43 109 169)", // #2B6DA9
    secondary: "rgb(58 130 194)", // Lighter shade
    accent: "rgb(147 186 217)", // Light accent
    light: "rgb(235 243 250)", // Very light blue
    dark: "rgb(32 82 127)", // Darker shade
    darker: "rgb(24 61 95)", // Even darker
    gradient: "from-[#2B6DA9] to-[#20527F]",
    hover: "hover:bg-[#20527F]",
    border: "border-[#93BAD9]",
    text: "text-[#2B6DA9]",
    bg: "bg-[#EBF3FA]",
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
