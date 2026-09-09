import MainFooter from "@/global/header/MainFooter";
import type { MainLayoutProps } from "../types/layoutType";
import MainAlert from "@/global/header/MainAlert";

function MainWrapper({ children }: MainLayoutProps) {
    return (
        <div className="h-full w-full min-w-0 flex flex-col">
            <MainAlert />
            <main className="flex-1">{children}</main>
            <MainFooter />
        </div>
    );
}

export default MainWrapper;