"use client";

// Replaces the root layout when it fails, so neither translations nor global styles are available.
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="uk">
      <body
        style={{
          minHeight: "100vh",
          margin: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          padding: 24,
          textAlign: "center",
          fontFamily: "Arial, Helvetica, sans-serif",
          color: "#171717",
        }}
      >
        <h1 style={{ fontSize: 24, margin: 0 }}>Щось пішло не так / Something went wrong</h1>
        <button
          onClick={reset}
          style={{
            padding: "12px 24px",
            border: "none",
            borderRadius: 8,
            background: "#f59e0b",
            color: "#171717",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Спробувати ще раз / Try again
        </button>
      </body>
    </html>
  );
}
