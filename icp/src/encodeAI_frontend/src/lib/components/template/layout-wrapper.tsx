import AuroraBackground from "../atoms/aurora-background";
import { Toaster } from "../atoms/sonner";

import Header from "../organisms/header";

const LayoutWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en">
      <body>
        <main className="flex w-screen">
          <AuroraBackground className="flex flex-col gap-2 w-full">
            <Header />
            {children}
          </AuroraBackground>
        </main>
        <Toaster />
      </body>
    </html>
  );
};

export default LayoutWrapper;
