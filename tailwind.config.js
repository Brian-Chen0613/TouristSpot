/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,js}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Noto Sans TC"', 'sans-serif'],
      },
      colors: {
        "bg-base": "#F5F0DC",
        surface: "#FFFFFF",
        primary: "#3A7D44",
        secondary: "#8DB84A",
        ink: "#2C2C2C",
        muted: "#6B7280",
        "border-soft": "#D9D3B8",
        danger: "#E05252",
      },
      fontSize: {
        "heading-sm": "2.25rem",
        "heading-pc": "3rem",
        "subheading-sm": "1.25rem",
        "subheading-pc": "1.5rem",
        body: "1rem",
        button: "1rem",
        label: "0.875rem",
      },
    },
  },
  plugins: [],
};
