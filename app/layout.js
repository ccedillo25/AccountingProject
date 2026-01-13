import "./globals.css";
import Sidebar from "./components/Sidebar";

export const metadata = {
  title: "Interactive Accounting Guide",
  description: "Interactive technical accounting models with content licensing workflows."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <main>
          <Sidebar />
          <div className="content">
            <div className="content__inner">{children}</div>
          </div>
        </main>
      </body>
    </html>
  );
}
