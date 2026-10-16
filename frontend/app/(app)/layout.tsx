import TestInfo from "../../components/test-info";
/**
 * A2: layout for Next.js-only routes (search, account, checkout…).
 */
export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-a2-group="app" style={{ outline: "3px dashed #1565c0" }}>
      <div
        style={{
          background: "#1565c0",
          color: "#fff",
          padding: "0.25rem 1rem",
          fontSize: "0.75rem",
          fontFamily: "sans-serif",
        }}
      >
        A2: (app) group layout
      </div>
      <TestInfo />
      {children}
    </div>
  );
}
