import MainFooter from "@/global/header/MainFooter";
import type { MainLayoutProps } from "../types/layoutType";
import MainAlert from "@/global/header/MainAlert";
import GlobalHeader from "@/global/header/GlobalHeader";

function MainWrapper({ children }: MainLayoutProps) {
    return (
        <div className="h-full w-full min-w-0 flex flex-col">
            <MainAlert />
            <GlobalHeader />
            <main className="flex-1">{children}</main>
            <MainFooter />
        </div>
    );
}

export default MainWrapper;