export const colors = {
  primaryOrange: '#F56B0A', // Main orange from logo background
  accentOrange: '#FABD3D',  // Lighter orange/yellow from stone graphic
  darkOrange: '#D95A00',   // Shadow/accent
  white: '#FFFFFF',
  black: '#000000',
  lightGray: '#F0F2F5',    // For backgrounds or subtle cards
  mediumGray: '#A0A0A0',   // For inactive elements or secondary text
  darkGray: '#333333',     // For primary text on light backgrounds
  textOnPrimary: '#FFFFFF',
  textOnAccent: '#333333', // Or white, depending on contrast needs
  
  // Google Translate inspired UI colors
  googleBlue: '#1a73e8', // For accents or links if needed
  statusBarBg: '#F56B0A', // Matching primary header
  headerTintColor: '#FFFFFF',
  tabBarActiveTintColor: '#FFFFFF',
  tabBarInactiveTintColor: '#FABD3D', // Lighter orange for inactive tabs
  tabBarBackground: '#F56B0A',
  cardBackground: '#FFFFFF',
  textInputBackground: '#FFFFFF', // Or a very light gray
  textInputBorder: '#DDDDDD',
  buttonPrimaryBackground: '#F56B0A',
  buttonPrimaryText: '#FFFFFF',
  buttonSecondaryBackground: '#FABD3D',
  buttonSecondaryText: '#333333',
  danger: '#D32F2F',
  success: '#388E3C',
};

export const typography = {
  h1: { fontSize: 28, fontWeight: 'bold' as 'bold' },
  h2: { fontSize: 24, fontWeight: 'bold' as 'bold' },
  h3: { fontSize: 20, fontWeight: 'bold' as 'bold' },
  body1: { fontSize: 16 },
  body2: { fontSize: 14 },
  caption: { fontSize: 12, color: colors.mediumGray },
  button: { fontSize: 16, fontWeight: '500' as '500' },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const borders = {
  radiusSmall: 4,
  radiusMedium: 8,
  radiusLarge: 16,
  borderWidth: 1,
  borderColor: colors.textInputBorder,
};

const theme = {
  colors,
  typography,
  spacing,
  borders,
};

export default theme; 