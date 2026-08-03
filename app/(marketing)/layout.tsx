import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mkt relative min-h-screen flex flex-col">
      <MarketingHeader />
      <div className="relative z-10 flex-1">{children}</div>
      <MarketingFooter />
    </div>
  );
}
