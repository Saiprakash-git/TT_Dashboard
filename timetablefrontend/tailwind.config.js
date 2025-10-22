/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // this ensures Tailwind works in all React files
  ],
  theme: {
    extend: {
      colors: {
        // 🎨 College-style palette
        primary: "#1E3A8A", // deep blue
        secondary: "#3B82F6", // light blue
        accent: "#60A5FA", // soft blue
        background: "#F0F4FF", // subtle blue-gray background
        surface: "#FFFFFF", // white surfaces
      },
      fontFamily: {
        sans: ["Inter", "Poppins", "sans-serif"], // modern clean fonts
      },
      boxShadow: {
        card: "0 4px 12px rgba(0, 0, 0, 0.1)",
      },
    },
  },
  plugins: [],
};
