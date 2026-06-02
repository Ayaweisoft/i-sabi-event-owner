import type { Metadata } from "next";
import { Suspense } from "react";
import AuthGuard from "./_components/AuthGuard";
import SideNav from "./_components/SideNav";
import Header from "./_components/Header";
import InlineLoader from "@/components/Loader/Inline";

// All dashboard routes are private — never index them
export const metadata: Metadata = {
    robots: { index: false, follow: false },
    title: { default: "Dashboard", template: "%s | i-sabi Owner" },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <AuthGuard>
            <Suspense fallback={<InlineLoader />}>
                <div className="flex w-full h-screen overflow-hidden" style={{ backgroundColor: "#f4f8f4" }}>
                    <SideNav />
                    <div className="relative flex-1 overflow-y-auto">
                        <Header />
                        <div className="px-4 pt-4 md:px-8 md:py-6">
                            {children}
                        </div>
                    </div>
                </div>
            </Suspense>
        </AuthGuard>
    );
}
